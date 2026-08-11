import { Router } from 'express';

import { createAuthMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/errors';
import type { Models } from '../models';
import { isCartQuantity, isRecord, parsePositiveInteger } from '../validation';

interface CartRoutesDependencies {
  models: Models;
}

interface CartBody {
  productId?: unknown;
  qty?: unknown;
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

  return router;
}
