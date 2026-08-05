import { Router } from 'express';

import { createAuthMiddleware } from '../middleware/auth';
import type { CartItem, Models, Product } from '../models';

interface CartRoutesDependencies {
  models: Models;
}

interface CartBody {
  productId?: unknown;
  qty?: unknown;
}

function validQuantity(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1 && value <= 100;
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

  router.get('/cart', auth, async (req, res) => {
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
  });

  router.post('/cart', auth, async (req, res) => {
    const { productId: rawProductId, qty: rawQty } = req.body as CartBody;
    const productId = Number(rawProductId);
    const qty = rawQty === undefined ? 1 : rawQty;
    if (!Number.isSafeInteger(productId) || !validQuantity(qty)) {
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

    item.qty = created ? qty : item.qty + qty;
    await item.save();

    const items = await models.CartItem.findAll({
      where: { UserId: req.user!.id },
      include: [models.Product]
    });

    res.json(items.map((cartItem) => ({ productId: cartItem.ProductId, qty: cartItem.qty })));
  });

  router.put('/cart', auth, async (req, res) => {
    const { productId, qty } = req.body as CartBody;
    const item = await models.CartItem.findOne({
      where: { UserId: req.user!.id, ProductId: Number(productId) }
    });

    if (!item) {
      res.status(404).json({ error: 'Item not in cart' });
      return;
    }

    if (!validQuantity(qty)) {
      res.status(400).json({ error: 'Invalid quantity' });
      return;
    }
    item.qty = qty;
    await item.save();
    res.json({ ok: true });
  });

  router.delete('/cart/:productId', auth, async (req, res) => {
    const productId = Number(req.params.productId);
    await models.CartItem.destroy({
      where: { UserId: req.user!.id, ProductId: productId }
    });

    res.json({ ok: true });
  });

  router.post('/checkout', auth, async (req, res) => {
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
  });

  router.post('/orders/:orderId/cancel', auth, async (req, res) => {
    const order = await models.Order.findOne({
      where: { id: Number(req.params.orderId), UserId: req.user!.id },
      include: [{ model: models.OrderItem, as: 'items' }]
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.status === 'cancelled') {
      res.json({ ok: true });
      return;
    }

    const transaction = await models.sequelize.transaction();
    try {
      for (const item of order.items ?? []) {
        const product = await models.Product.findByPk(item.ProductId);
        if (!product) {
          throw new Error(`Product ${item.ProductId} not found`);
        }

        product.stock += item.qty;
        await product.save({ transaction });
      }

      order.status = 'cancelled';
      await order.save({ transaction });
      await transaction.commit();
      res.json({ ok: true });
    } catch {
      await transaction.rollback();
      res.status(500).json({ error: 'Cancel failed' });
    }
  });

  return router;
}
