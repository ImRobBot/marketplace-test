import 'dotenv/config';

import cors from 'cors';
import express, { type Express } from 'express';

import { models, Product, sequelize, User } from './models';
import { createAuthRouter } from './routes/auth';
import { createCartRouter } from './routes/cart';
import { rateLimit, securityHeaders } from './middleware/security';

export function createApp(): Express {
  const app = express();
  const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.use(securityHeaders());
  app.use(cors({ origin: allowedOrigin }));
  app.use(express.json({ limit: '10kb' }));
  app.use(rateLimit());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/products', async (_req, res) => {
    const products = await Product.findAll({ order: [['id', 'ASC']] });
    res.json(products);
  });

  app.get('/api/products/:id', async (req, res) => {
    const product = await Product.findByPk(Number(req.params.id));
    if (!product) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    res.json(product);
  });

  app.use('/api/auth', createAuthRouter({ models: { User } }));
  app.use('/api', createCartRouter({ models }));

  return app;
}

export async function initializeApp(): Promise<void> {
  await sequelize.sync();

  const productCount = await Product.count();
  if (productCount === 0) {
    await Product.bulkCreate([
      { title: 'Producto A', price: 9.99, stock: 10 },
      { title: 'Producto B', price: 19.99, stock: 5 }
    ]);
  }
}
