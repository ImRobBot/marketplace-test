import { Router } from 'express';
import { UniqueConstraintError, type Transaction } from 'sequelize';

import { createAuthMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/errors';
import type { CartItem, Models, Order, Product } from '../models';
import { isRecord, parsePositiveInteger } from '../validation';

interface OrderRoutesDependencies {
  models: Models;
}

type PaymentOutcome = 'paid' | 'failed';

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;
const cancellationLocks = new Map<number, Promise<void>>();

async function withCancellationLock<T>(orderId: number, action: () => Promise<T>): Promise<T> {
  const previous = cancellationLocks.get(orderId) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>(resolve => {
    release = resolve;
  });
  const queued = previous.then(() => current);
  cancellationLocks.set(orderId, queued);

  await previous;
  try {
    return await action();
  } finally {
    release();
    if (cancellationLocks.get(orderId) === queued) cancellationLocks.delete(orderId);
  }
}

function includedProduct(item: CartItem): Product {
  if (!item.Product) throw new Error('Expected Product association to be loaded');
  return item.Product;
}

function serializeOrder(order: Order) {
  const attributes = order.toJSON() as unknown as Record<string, unknown>;
  return {
    id: order.id,
    status: order.status,
    total: Number(order.total),
    createdAt: attributes.createdAt,
    updatedAt: attributes.updatedAt,
    items: (order.items ?? []).map(item => ({
      id: item.id,
      ProductId: item.ProductId,
      qty: item.qty,
      price: Number(item.price)
    })),
    payment: order.payment
      ? {
          status: order.payment.status,
          provider: order.payment.provider,
          amountCents: order.payment.amountCents,
          currency: order.payment.currency
        }
      : null
  };
}

async function rollbackIfActive(transaction: Transaction): Promise<void> {
  const state = (transaction as Transaction & { finished?: string }).finished;
  if (!state) await transaction.rollback();
}

function orderIncludes(models: Models) {
  return [
    { model: models.OrderItem, as: 'items' },
    { model: models.Payment, as: 'payment' }
  ];
}

async function findOwnedOrder(
  models: Models,
  userId: number,
  orderId: number,
  transaction?: Transaction
) {
  return models.Order.findOne({
    where: { id: orderId, UserId: userId },
    include: orderIncludes(models),
    transaction
  });
}

async function findOwnedOrderForUpdate(
  models: Models,
  userId: number,
  orderId: number,
  transaction: Transaction
) {
  const order = await models.Order.findOne({
    where: { id: orderId, UserId: userId },
    transaction,
    lock: transaction.LOCK.UPDATE
  });
  if (!order) return null;

  order.items = await models.OrderItem.findAll({
    where: { OrderId: order.id },
    transaction,
    lock: transaction.LOCK.UPDATE
  });
  order.payment = await models.Payment.findOne({
    where: { OrderId: order.id },
    transaction,
    lock: transaction.LOCK.UPDATE
  }) ?? undefined;
  return order;
}

async function findIdempotentOrder(
  models: Models,
  userId: number,
  idempotencyKey: string,
  transaction?: Transaction
) {
  return models.Order.findOne({
    where: { UserId: userId, idempotencyKey },
    include: orderIncludes(models),
    transaction
  });
}

function simulatedPaymentsEnabled(): boolean {
  return process.env.NODE_ENV !== 'production'
    && process.env.ENABLE_SIMULATED_PAYMENTS !== 'false';
}

export function createOrderRouter({ models }: OrderRoutesDependencies): Router {
  const router = Router();
  const auth = createAuthMiddleware(models);

  router.post('/checkout', auth, asyncHandler(async (req, res) => {
    const idempotencyKey = req.get('Idempotency-Key')?.trim();
    if (idempotencyKey && !IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
      res.status(400).json({ error: 'Invalid Idempotency-Key' });
      return;
    }

    if (idempotencyKey) {
      const existing = await findIdempotentOrder(models, req.user!.id, idempotencyKey);
      if (existing) {
        res.json({
          ok: true,
          orderId: existing.id,
          replayed: true,
          order: serializeOrder(existing)
        });
        return;
      }
    }

    const transaction = await models.sequelize.transaction();
    try {
      const items = await models.CartItem.findAll({
        where: { UserId: req.user!.id },
        include: [{ model: models.Product, required: true }],
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (items.length === 0) {
        await transaction.rollback();
        if (idempotencyKey) {
          const existing = await findIdempotentOrder(models, req.user!.id, idempotencyKey);
          if (existing) {
            res.json({
              ok: true,
              orderId: existing.id,
              replayed: true,
              order: serializeOrder(existing)
            });
            return;
          }
        }
        res.status(400).json({ error: 'Cart empty' });
        return;
      }

      let totalCents = 0;
      for (const item of items) {
        const product = includedProduct(item);
        if (product.stock < item.qty) {
          await transaction.rollback();
          res.status(400).json({ error: `Insufficient stock for ${product.title}` });
          return;
        }

        totalCents += Math.round(Number(product.price) * 100) * item.qty;
        product.stock -= item.qty;
        await product.save({ transaction });
      }

      const order = await models.Order.create(
        {
          UserId: req.user!.id,
          total: totalCents / 100,
          status: 'pending_payment',
          idempotencyKey: idempotencyKey ?? null
        },
        { transaction }
      );

      await models.OrderItem.bulkCreate(
        items.map(item => {
          const product = includedProduct(item);
          return {
            OrderId: order.id,
            ProductId: product.id,
            qty: item.qty,
            price: product.price
          };
        }),
        { transaction }
      );
      await models.Payment.create(
        { OrderId: order.id, amountCents: totalCents, status: 'pending' },
        { transaction }
      );
      await models.CartItem.destroy({
        where: { UserId: req.user!.id },
        transaction
      });
      await transaction.commit();

      const created = await findOwnedOrder(models, req.user!.id, order.id);
      if (!created) throw new Error('Created order not found');
      res.json({
        ok: true,
        orderId: created.id,
        replayed: false,
        order: serializeOrder(created)
      });
    } catch (error) {
      await rollbackIfActive(transaction);
      if (error instanceof UniqueConstraintError && idempotencyKey) {
        const existing = await findIdempotentOrder(models, req.user!.id, idempotencyKey);
        if (existing) {
          res.json({
            ok: true,
            orderId: existing.id,
            replayed: true,
            order: serializeOrder(existing)
          });
          return;
        }
      }
      throw error;
    }
  }));

  router.get('/orders', auth, asyncHandler(async (req, res) => {
    const orders = await models.Order.findAll({
      where: { UserId: req.user!.id },
      include: orderIncludes(models),
      order: [['createdAt', 'DESC']]
    });
    res.json(orders.map(serializeOrder));
  }));

  router.get('/orders/:orderId', auth, asyncHandler(async (req, res) => {
    const orderId = parsePositiveInteger(req.params.orderId);
    if (orderId === null) {
      res.status(400).json({ error: 'Invalid order id' });
      return;
    }

    const order = await findOwnedOrder(models, req.user!.id, orderId);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(serializeOrder(order));
  }));

  router.post('/orders/:orderId/pay', auth, asyncHandler(async (req, res) => {
    const orderId = parsePositiveInteger(req.params.orderId);
    if (orderId === null) {
      res.status(400).json({ error: 'Invalid order id' });
      return;
    }

    const body = isRecord(req.body) ? req.body : {};
    const outcome = body.outcome === undefined ? 'paid' : body.outcome;
    if (outcome !== 'paid' && outcome !== 'failed') {
      res.status(400).json({ error: 'Invalid payment outcome' });
      return;
    }

    const transaction = await models.sequelize.transaction();
    try {
      const order = await findOwnedOrderForUpdate(models, req.user!.id, orderId, transaction);
      if (!order) {
        await transaction.rollback();
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      if (!simulatedPaymentsEnabled()) {
        await transaction.rollback();
        res.status(503).json({ error: 'Simulated payments are disabled' });
        return;
      }
      if (order.status === 'paid' && order.payment?.status === 'paid') {
        await transaction.commit();
        res.json({ ok: true, replayed: true, order: serializeOrder(order) });
        return;
      }
      if (order.status === 'payment_failed' && order.payment?.status === 'failed') {
        await transaction.commit();
        res.json({ ok: true, replayed: true, order: serializeOrder(order) });
        return;
      }
      if (order.status !== 'pending_payment' || order.payment?.status !== 'pending') {
        await transaction.rollback();
        res.status(409).json({ error: 'Order cannot be paid' });
        return;
      }

      const paymentOutcome = outcome as PaymentOutcome;
      order.status = paymentOutcome === 'paid' ? 'paid' : 'payment_failed';
      order.payment.status = paymentOutcome;
      order.payment.externalReference = `simulated-${order.id}`;
      await order.payment.save({ transaction });
      await order.save({ transaction });
      await transaction.commit();

      const updated = await findOwnedOrder(models, req.user!.id, orderId);
      if (!updated) throw new Error('Paid order not found');
      res.json({ ok: true, replayed: false, order: serializeOrder(updated) });
    } catch (error) {
      await rollbackIfActive(transaction);
      throw error;
    }
  }));

  router.post('/orders/:orderId/cancel', auth, asyncHandler(async (req, res) => {
    const orderId = parsePositiveInteger(req.params.orderId);
    if (orderId === null) {
      res.status(400).json({ error: 'Invalid order id' });
      return;
    }

    await withCancellationLock(orderId, async () => {
      const transaction = await models.sequelize.transaction();
      try {
        const order = await findOwnedOrderForUpdate(models, req.user!.id, orderId, transaction);
        if (!order) {
          await transaction.rollback();
          res.status(404).json({ error: 'Order not found' });
          return;
        }
        if (order.inventoryReleasedAt) {
          await transaction.commit();
          res.json({ ok: true, replayed: true, order: serializeOrder(order) });
          return;
        }

        for (const item of order.items ?? []) {
          const product = await models.Product.findByPk(item.ProductId, {
            transaction,
            lock: transaction.LOCK.UPDATE
          });
          if (!product) throw new Error(`Product ${item.ProductId} not found`);
          product.stock += item.qty;
          await product.save({ transaction });
        }

        order.status = 'cancelled';
        order.inventoryReleasedAt = new Date();
        if (order.payment) {
          order.payment.status = order.payment.status === 'paid' ? 'refunded' : 'cancelled';
          await order.payment.save({ transaction });
        }
        await order.save({ transaction });
        await transaction.commit();

        const cancelled = await findOwnedOrder(models, req.user!.id, orderId);
        if (!cancelled) throw new Error('Cancelled order not found');
        res.json({ ok: true, replayed: false, order: serializeOrder(cancelled) });
      } catch (error) {
        await rollbackIfActive(transaction);
        throw error;
      }
    });
  }));

  return router;
}
