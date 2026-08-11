import { Router } from 'express';
import { Op } from 'sequelize';

import { createAuthMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/errors';
import type { CartItem, Models, Product } from '../models';
import { isCartQuantity, isRecord, parsePositiveInteger } from '../validation';

interface CartRoutesDependencies {
  models: Models;
}

interface CartBody {
  productId?: unknown;
  qty?: unknown;
}

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
    if (cancellationLocks.get(orderId) === queued) {
      cancellationLocks.delete(orderId);
    }
  }
}

function includedProduct(item: CartItem): Product {
  if (!item.Product) {
    throw new Error('Expected Product association to be loaded');
  }

  return item.Product;
}

export function createCartRouter({ models }: CartRoutesDependencies): Router {
  const router = Router();
  const auth = createAuthMiddleware(models);

  router.get('/cart', auth, asyncHandler(async (req, res) => {
    const items = await models.CartItem.findAll({
      where: { UserId: req.user!.id },
      include: [models.Product]
    });

    res.json(
      items.map((item) => ({
        productId: item.ProductId,
        qty: item.qty,
        product: item.Product
      }))
    );
  }));

  router.post('/cart', auth, asyncHandler(async (req, res) => {
    const body = isRecord(req.body) ? req.body : {};
    const { productId: rawProductId, qty: rawQty } = body as CartBody;
    const productId = parsePositiveInteger(rawProductId);
    const qty = rawQty === undefined ? 1 : rawQty;
    if (productId === null || !isCartQuantity(qty)) {
      res.status(400).json({ error: 'Invalid product or quantity' });
      return;
    }
    const product = await models.Product.findByPk(productId);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const [item, created] = await models.CartItem.findOrCreate({
      where: { UserId: req.user!.id, ProductId: product.id },
      defaults: { qty }
    });

    const nextQuantity = created ? qty : item.qty + qty;
    if (!isCartQuantity(nextQuantity)) {
      res.status(400).json({ error: 'Invalid quantity' });
      return;
    }

    item.qty = nextQuantity;
    await item.save();

    const items = await models.CartItem.findAll({
      where: { UserId: req.user!.id },
      include: [models.Product]
    });

    res.json(items.map((cartItem) => ({ productId: cartItem.ProductId, qty: cartItem.qty })));
  }));

  router.put('/cart', auth, asyncHandler(async (req, res) => {
    const body = isRecord(req.body) ? req.body : {};
    const { productId: rawProductId, qty } = body as CartBody;
    const productId = parsePositiveInteger(rawProductId);
    if (productId === null || !isCartQuantity(qty)) {
      res.status(400).json({ error: 'Invalid product or quantity' });
      return;
    }

    const item = await models.CartItem.findOne({
      where: { UserId: req.user!.id, ProductId: productId }
    });

    if (!item) {
      res.status(404).json({ error: 'Item not in cart' });
      return;
    }

    item.qty = qty;
    await item.save();
    res.json({ ok: true });
  }));

  router.delete('/cart/:productId', auth, asyncHandler(async (req, res) => {
    const productId = parsePositiveInteger(req.params.productId);
    if (productId === null) {
      res.status(400).json({ error: 'Invalid product id' });
      return;
    }

    await models.CartItem.destroy({
      where: { UserId: req.user!.id, ProductId: productId }
    });

    res.json({ ok: true });
  }));

  router.post('/checkout', auth, asyncHandler(async (req, res) => {
    const transaction = await models.sequelize.transaction();

    try {
      const items = await models.CartItem.findAll({
        where: { UserId: req.user!.id },
        include: [models.Product],
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (items.length === 0) {
        await transaction.rollback();
        res.status(400).json({ error: 'Cart empty' });
        return;
      }

      let total = 0;
      for (const item of items) {
        const product = includedProduct(item);
        if (product.stock < item.qty) {
          await transaction.rollback();
          res.status(400).json({ error: `Insufficient stock for ${product.title}` });
          return;
        }

        total += item.qty * product.price;
        product.stock -= item.qty;
        await product.save({ transaction });
      }

      const order = await models.Order.create(
        { UserId: req.user!.id, total, status: 'paid' },
        { transaction }
      );

      for (const item of items) {
        const product = includedProduct(item);
        await models.OrderItem.create(
          {
            OrderId: order.id,
            ProductId: product.id,
            qty: item.qty,
            price: product.price
          },
          { transaction }
        );
      }

      await models.CartItem.destroy({
        where: { UserId: req.user!.id },
        transaction
      });
      await transaction.commit();
      res.json({ ok: true, orderId: order.id });
    } catch {
      await transaction.rollback();
      res.status(500).json({ error: 'Checkout failed' });
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
        const [updatedCount] = await models.Order.update(
          { status: 'cancelled' },
          {
            where: {
              id: orderId,
              UserId: req.user!.id,
              status: { [Op.ne]: 'cancelled' }
            },
            transaction
          }
        );

        const order = await models.Order.findOne({
          where: { id: orderId, UserId: req.user!.id },
          include: [{ model: models.OrderItem, as: 'items' }],
          transaction,
          lock: transaction.LOCK.UPDATE
        });

        if (!order) {
          await transaction.rollback();
          res.status(404).json({ error: 'Order not found' });
          return;
        }

        if (updatedCount === 0) {
          await transaction.commit();
          res.json({ ok: true });
          return;
        }

        for (const item of order.items ?? []) {
          const product = await models.Product.findByPk(item.ProductId, {
            transaction,
            lock: transaction.LOCK.UPDATE
          });
          if (!product) {
            throw new Error(`Product ${item.ProductId} not found`);
          }

          product.stock += item.qty;
          await product.save({ transaction });
        }

        await transaction.commit();
        res.json({ ok: true });
      } catch {
        await transaction.rollback();
        res.status(500).json({ error: 'Cancel failed' });
      }
    });
  }));

  return router;
}
