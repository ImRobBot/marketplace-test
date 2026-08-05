import type { Express } from 'express';
import request from 'supertest';

import { createApp, initializeApp } from '../src/app';
import {
  CartItem,
  databaseStorage,
  Order,
  OrderItem,
  Product,
  sequelize,
  User
} from '../src/models';

let app: Express;

beforeAll(async () => {
  if (databaseStorage !== ':memory:') {
    throw new Error(`Tests must use an in-memory database, received: ${databaseStorage}`);
  }

  await initializeApp();
  app = createApp();
});

beforeEach(async () => {
  await CartItem.destroy({ where: {} });
  await OrderItem.destroy({ where: {} });
  await Order.destroy({ where: {} });
  await User.destroy({ where: {} });
  await Product.update({ stock: 10 }, { where: { title: 'Producto A' } });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Marketplace API', () => {
  it('registers and logs in a user', async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', password: 'secret123456' })
      .expect(200);

    expect(registerResponse.body.user.username).toBe('alice');
    expect(registerResponse.body.token).toBeTruthy();

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: 'secret123456' })
      .expect(200);

    expect(loginResponse.body.user.username).toBe('alice');
  });

  it('creates an order from the cart and updates stock', async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({ username: 'bob', password: 'secret123456' })
      .expect(200);

    const token = registerResponse.body.token as string;

    await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: 1, qty: 2 })
      .expect(200);

    const checkoutResponse = await request(app)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(checkoutResponse.body.ok).toBe(true);

    const product = await Product.findByPk(1);
    expect(product?.stock).toBe(8);
  });

  it('cancels an order and restores stock', async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({ username: 'carol', password: 'secret123456' })
      .expect(200);

    const token = registerResponse.body.token as string;

    await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: 1, qty: 1 })
      .expect(200);

    const checkoutResponse = await request(app)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const cancelResponse = await request(app)
      .post(`/api/orders/${checkoutResponse.body.orderId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(cancelResponse.body.ok).toBe(true);

    const product = await Product.findByPk(1);
    expect(product?.stock).toBe(10);
  });
});
