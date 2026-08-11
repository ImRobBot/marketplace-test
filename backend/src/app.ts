import 'dotenv/config';

import cors from 'cors';
import express, { type Express } from 'express';
import pinoHttp from 'pino-http';

import { runMigrations } from './database/migrator';
import { logger } from './logger';
import { asyncHandler, errorHandler, notFoundHandler } from './middleware/errors';
import { databaseDialect, models, Product, sequelize, User } from './models';
import { createAuthRouter } from './routes/auth';
import { createCartRouter } from './routes/cart';
import { createOrderRouter } from './routes/orders';
import { rateLimit, securityHeaders } from './middleware/security';
import { parsePositiveInteger } from './validation';

export function createApp(): Express {
  const app = express();
  const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  const trustedProxyHops = Number(process.env.TRUST_PROXY);
  if (Number.isSafeInteger(trustedProxyHops) && trustedProxyHops > 0) {
    app.set('trust proxy', trustedProxyHops);
  }
  app.disable('x-powered-by');
  app.use(securityHeaders());
  app.use(cors({ origin: allowedOrigin, credentials: true }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: process.env.NODE_ENV !== 'test'
    })
  );
  app.use(rateLimit());
  app.use(express.json({ limit: '10kb', strict: true }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok - up',
      version: '11/08/2026',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/products', asyncHandler(async (_req, res) => {
    const products = await Product.findAll({ order: [['id', 'ASC']] });
    res.json(products);
  }));

  app.get('/api/products/:id', asyncHandler(async (req, res) => {
    const productId = parsePositiveInteger(req.params.id);
    if (productId === null) {
      res.status(400).json({ error: 'Invalid product id' });
      return;
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    res.json(product);
  }));

  app.use(
    '/api/auth',
    rateLimit({
      windowMs: 60_000,
      maxRequests: process.env.NODE_ENV === 'test' ? 1_000 : 20
    })
  );
  app.use('/api/auth', createAuthRouter({ models: { User } }));
  app.use('/api', createCartRouter({ models }));
  app.use('/api', createOrderRouter({ models }));
  app.use(notFoundHandler());
  app.use(errorHandler);

  return app;
}

export async function initializeApp(): Promise<void> {
  if (databaseDialect === 'sqlite') {
    await sequelize.sync();
  } else {
    await sequelize.authenticate();
    await runMigrations(sequelize);
  }

  const productCount = await Product.count();
  if (productCount === 0) {
    await Product.bulkCreate([
      { title: 'Producto A', price: 9.99, stock: 10 },
      { title: 'Producto B', price: 19.99, stock: 5 }
    ]);
  }
}
