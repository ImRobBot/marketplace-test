import type { Express } from 'express';
import request from 'supertest';

import { createApp, initializeApp } from '../src/app';
import {
  CartItem,
  databaseStorage,
  Order,
  OrderItem,
  Payment,
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
  await Payment.destroy({ where: {} });
  await OrderItem.destroy({ where: {} });
  await Order.destroy({ where: {} });
  await User.destroy({ where: {} });
  await Product.update({ stock: 10 }, { where: { title: 'Producto A' } });
  await Product.update({ stock: 5 }, { where: { title: 'Producto B' } });
});

afterAll(async () => {
  await sequelize.close();
});

async function register(username = 'buyer'): Promise<string> {
  const response = await request(app)
    .post('/api/auth/register')
    .set('X-Auth-Transport', 'bearer')
    .send({ username, password: 'secret123456' })
    .expect(200);

  return response.body.token as string;
}

function authenticated(token: string) {
  const authorization = `Bearer ${token}`;
  return {
    get: (path: string) => request(app).get(path).set('Authorization', authorization),
    post: (path: string) => request(app).post(path).set('Authorization', authorization),
    put: (path: string) => request(app).put(path).set('Authorization', authorization),
    delete: (path: string) => request(app).delete(path).set('Authorization', authorization)
  };
}

describe('API validation and protected workflows', () => {
  it('serves health, products and security headers', async () => {
    const health = await request(app).get('/api/health').expect(200);

    expect(health.body).toMatchObject({
      status: 'ok - up',
      version: '11/08/2026'
    });
    expect(Date.parse(health.body.timestamp as string)).not.toBeNaN();
    expect(health.headers['x-content-type-options']).toBe('nosniff');
    expect(health.headers['x-frame-options']).toBe('DENY');
    expect(health.headers['referrer-policy']).toBe('no-referrer');
    expect(health.headers['permissions-policy']).toContain('camera=()');
    expect(health.headers['content-security-policy']).toContain("default-src 'none'");
    expect(health.headers['x-powered-by']).toBeUndefined();

    const products = await request(app).get('/api/products').expect(200);
    expect(products.body).toHaveLength(2);
    expect(products.body[0].id).toBe(1);

    await request(app).get('/api/products/1').expect(200);
    await request(app).get('/api/products/999').expect(404);
    await request(app)
      .get('/api/products/not-an-id')
      .expect(400)
      .expect({ error: 'Invalid product id' });
  });

  it('validates credentials and rejects duplicate or invalid logins', async () => {
    await request(app).post('/api/auth/register').send({}).expect(400);
    await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('null')
      .expect(400)
      .expect({ error: 'Invalid JSON' });
    const invalidPassword = await request(app)
      .post('/api/auth/register')
      .send({ username: 'ab', password: 'short' })
      .expect(400);
    expect(invalidPassword.body).toEqual({
      error: 'Invalid username'
    });

    const shortPassword = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', password: 'short' })
      .expect(400);
    expect(shortPassword.body).toEqual({
      error: 'Password must be between 12 and 128 characters'
    });

    await request(app)
      .post('/api/auth/register')
      .send({ username: 'Alice', password: 'secret123456' })
      .expect(200);
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', password: 'secret123456' })
      .expect(400);

    await request(app).post('/api/auth/login').send({}).expect(400);
    await request(app)
      .post('/api/auth/login')
      .send({ username: 'unknown', password: 'secret123456' })
      .expect(401);
    await request(app)
      .post('/api/auth/login')
      .send({ username: 'ALICE', password: 'wrong-password' })
      .expect(401);
    await request(app)
      .post('/api/auth/login')
      .send({ username: 'ALICE', password: 'secret123456' })
      .expect(200);

    const user = await User.findOne({ where: { username: 'alice' } });
    expect(user?.username).toBe('alice');
  });

  it('protects cart routes from missing and malformed tokens', async () => {
    await request(app).get('/api/cart').expect(401).expect({ error: 'Missing token' });
    await request(app)
      .get('/api/cart')
      .set('Authorization', 'Token malformed')
      .expect(401)
      .expect({ error: 'Invalid token' });
    await request(app)
      .get('/api/cart')
      .set('Authorization', 'Bearer malformed')
      .expect(401)
      .expect({ error: 'Invalid token' });

    const token = await register();
    const cart = await request(app)
      .get('/api/cart')
      .set('Authorization', `bearer ${token}`)
      .expect(200);
    expect(cart.body).toEqual([]);
  });

  it('validates cart additions, updates and removals', async () => {
    const token = await register();

    await authenticated(token)
      .post('/api/cart')
      .send({ productId: 'not-a-number', qty: 1 })
      .expect(400);
    await authenticated(token)
      .post('/api/cart')
      .send({ productId: 1, qty: 0 })
      .expect(400);
    await authenticated(token)
      .post('/api/cart')
      .send({ productId: 999, qty: 1 })
      .expect(404);

    await authenticated(token).post('/api/cart').send({ productId: 1 }).expect(200);
    const added = await authenticated(token)
      .post('/api/cart')
      .send({ productId: 1, qty: 2 })
      .expect(200);
    expect(added.body).toEqual([{ productId: 1, qty: 3 }]);

    await authenticated(token)
      .put('/api/cart')
      .send({ productId: 2, qty: 1 })
      .expect(404);
    await authenticated(token)
      .put('/api/cart')
      .send({ productId: 1, qty: 0 })
      .expect(400);
    await authenticated(token)
      .put('/api/cart')
      .send({ productId: 1, qty: 4 })
      .expect(200);

    const cart = await authenticated(token).get('/api/cart').expect(200);
    expect(cart.body[0].qty).toBe(4);
    await authenticated(token).delete('/api/cart/1').expect(200);
    expect((await authenticated(token).get('/api/cart').expect(200)).body).toEqual([]);
  });

  it('uses an HttpOnly cookie by default and clears it on logout', async () => {
    const browser = request.agent(app);
    const registration = await browser
      .post('/api/auth/register')
      .send({ username: 'cookie-user', password: 'secret123456' })
      .expect(200);

    expect(registration.body).toEqual({ user: { id: expect.any(Number), username: 'cookie-user' } });
    expect(registration.headers['set-cookie']?.[0]).toContain('mercado_session=');
    expect(registration.headers['set-cookie']?.[0]).toContain('HttpOnly');
    expect(registration.headers['set-cookie']?.[0]).toContain('SameSite=Lax');

    await browser.get('/api/auth/me').expect(200).expect({
      user: { id: registration.body.user.id, username: 'cookie-user' }
    });
    await browser.get('/api/cart').expect(200).expect([]);
    await browser
      .post('/api/cart')
      .set('Origin', 'http://evil.example')
      .send({ productId: 1, qty: 1 })
      .expect(403)
      .expect({ error: 'Invalid request origin' });
    await browser
      .post('/api/auth/logout')
      .set('Origin', 'http://localhost:3000')
      .expect(200)
      .expect({ ok: true });
    await browser.get('/api/auth/me').expect(401);
  });

  it('returns 413 for oversized JSON without exposing the submitted body', async () => {
    const { logger } = await import('../src/logger');
    const errorLog = jest.spyOn(logger, 'error');
    const secretMarker = 'must-not-appear-in-logs';

    await request(app)
      .post('/api/auth/login')
      .send({ username: 'oversized', password: secretMarker.repeat(1000) })
      .expect(413)
      .expect({ error: 'Payload too large' });

    expect(JSON.stringify(errorLog.mock.calls)).not.toContain(secretMarker);
    errorLog.mockRestore();
  });

  it('rejects cart quantities that exceed the per-line maximum after accumulation', async () => {
    const token = await register('quantity-limit');

    await authenticated(token).post('/api/cart').send({ productId: 1, qty: 60 }).expect(200);
    await authenticated(token)
      .post('/api/cart')
      .send({ productId: 1, qty: 41 })
      .expect(400)
      .expect({ error: 'Invalid quantity' });

    const cart = await authenticated(token).get('/api/cart').expect(200);
    expect(cart.body[0].qty).toBe(60);
  });

  it('rejects invalid cart and order identifiers at the API boundary', async () => {
    const token = await register('identifier-validation');

    await authenticated(token)
      .put('/api/cart')
      .send({ productId: 'not-an-id', qty: 1 })
      .expect(400)
      .expect({ error: 'Invalid product or quantity' });
    await authenticated(token)
      .delete('/api/cart/not-an-id')
      .expect(400)
      .expect({ error: 'Invalid product id' });
    await authenticated(token)
      .post('/api/orders/not-an-id/cancel')
      .expect(400)
      .expect({ error: 'Invalid order id' });
    await authenticated(token)
      .get('/api/orders/not-an-id')
      .expect(400)
      .expect({ error: 'Invalid order id' });
    await authenticated(token)
      .post('/api/orders/not-an-id/pay')
      .expect(400)
      .expect({ error: 'Invalid order id' });
  });

  it('returns JSON for unknown routes', async () => {
    await request(app)
      .get('/api/does-not-exist')
      .expect(404)
      .expect({ error: 'Not found' });
  });

  it('rejects empty carts and insufficient stock during checkout', async () => {
    const token = await register();

    await authenticated(token).post('/api/checkout').expect(400).expect({ error: 'Cart empty' });
    await authenticated(token).post('/api/cart').send({ productId: 1, qty: 11 }).expect(200);
    await authenticated(token)
      .post('/api/checkout')
      .expect(400)
      .expect({ error: 'Insufficient stock for Producto A' });

    expect(await CartItem.count()).toBe(1);
  });

  it('creates a pending order and safely replays an idempotent checkout', async () => {
    const token = await register('idempotent-checkout');
    const key = 'checkout-attempt-0001';

    await authenticated(token).post('/api/cart').send({ productId: 1, qty: 2 }).expect(200);
    const checkout = await authenticated(token)
      .post('/api/checkout')
      .set('Idempotency-Key', key)
      .expect(200);

    expect(checkout.body).toMatchObject({
      ok: true,
      replayed: false,
      order: {
        id: expect.any(Number),
        status: 'pending_payment',
        total: 19.98,
        payment: { status: 'pending', amountCents: 1998, currency: 'MXN' }
      }
    });

    const replay = await authenticated(token)
      .post('/api/checkout')
      .set('Idempotency-Key', key)
      .expect(200);
    expect(replay.body).toMatchObject({
      ok: true,
      replayed: true,
      order: { id: checkout.body.order.id, status: 'pending_payment' }
    });
    expect(await Order.count()).toBe(1);
    expect(await Payment.count()).toBe(1);
    expect((await Product.findByPk(1))?.stock).toBe(8);

    await authenticated(token)
      .post('/api/checkout')
      .set('Idempotency-Key', 'short')
      .expect(400)
      .expect({ error: 'Invalid Idempotency-Key' });
  });

  it('lists only owned orders and pays a pending order idempotently', async () => {
    const ownerToken = await register('order-owner');
    const otherToken = await register('order-outsider');

    await authenticated(ownerToken).post('/api/cart').send({ productId: 2, qty: 1 }).expect(200);
    const checkout = await authenticated(ownerToken).post('/api/checkout').expect(200);
    const orderId = checkout.body.order.id as number;

    const orders = await authenticated(ownerToken).get('/api/orders').expect(200);
    expect(orders.body).toHaveLength(1);
    expect(orders.body[0]).toMatchObject({ id: orderId, status: 'pending_payment' });
    await authenticated(otherToken).get('/api/orders').expect(200).expect([]);
    await authenticated(otherToken).get(`/api/orders/${orderId}`).expect(404);
    await authenticated(otherToken).post(`/api/orders/${orderId}/pay`).expect(404);

    const detail = await authenticated(ownerToken).get(`/api/orders/${orderId}`).expect(200);
    expect(detail.body).toMatchObject({
      id: orderId,
      status: 'pending_payment',
      items: [{ ProductId: 2, qty: 1 }],
      payment: { status: 'pending', amountCents: 1999 }
    });

    const paid = await authenticated(ownerToken)
      .post(`/api/orders/${orderId}/pay`)
      .send({ outcome: 'paid' })
      .expect(200);
    expect(paid.body).toMatchObject({
      ok: true,
      replayed: false,
      order: { id: orderId, status: 'paid', payment: { status: 'paid' } }
    });

    const replay = await authenticated(ownerToken)
      .post(`/api/orders/${orderId}/pay`)
      .send({ outcome: 'paid' })
      .expect(200);
    expect(replay.body).toMatchObject({
      ok: true,
      replayed: true,
      order: { id: orderId, status: 'paid', payment: { status: 'paid' } }
    });
    expect(await Payment.count({ where: { OrderId: orderId } })).toBe(1);
  });

  it('records a simulated payment failure without allowing outcome changes on replay', async () => {
    const token = await register('failed-payment');
    await authenticated(token).post('/api/cart').send({ productId: 1, qty: 1 }).expect(200);
    const checkout = await authenticated(token).post('/api/checkout').expect(200);
    const orderId = checkout.body.order.id as number;

    await authenticated(token)
      .post(`/api/orders/${orderId}/pay`)
      .send({ outcome: 'declined' })
      .expect(400)
      .expect({ error: 'Invalid payment outcome' });
    const failed = await authenticated(token)
      .post(`/api/orders/${orderId}/pay`)
      .send({ outcome: 'failed' })
      .expect(200);
    expect(failed.body).toMatchObject({
      replayed: false,
      order: { status: 'payment_failed', payment: { status: 'failed' } }
    });

    const replay = await authenticated(token)
      .post(`/api/orders/${orderId}/pay`)
      .send({ outcome: 'paid' })
      .expect(200);
    expect(replay.body).toMatchObject({
      replayed: true,
      order: { status: 'payment_failed', payment: { status: 'failed' } }
    });
  });

  it('keeps simulated payments disabled in production', async () => {
    const token = await register('production-payment');
    await authenticated(token).post('/api/cart').send({ productId: 1, qty: 1 }).expect(200);
    const checkout = await authenticated(token).post('/api/checkout').expect(200);
    const orderId = checkout.body.order.id as number;
    const originalEnvironment = process.env.NODE_ENV;

    try {
      process.env.NODE_ENV = 'production';
      await authenticated(token)
        .post(`/api/orders/${orderId}/pay`)
        .send({ outcome: 'paid' })
        .expect(503)
        .expect({ error: 'Simulated payments are disabled' });
    } finally {
      process.env.NODE_ENV = originalEnvironment;
    }

    expect((await Order.findByPk(orderId))?.status).toBe('pending_payment');
    expect((await Payment.findOne({ where: { OrderId: orderId } }))?.status).toBe('pending');
  });

  it('cancels orders idempotently and hides other or missing orders', async () => {
    const ownerToken = await register('owner');
    const otherToken = await register('other');

    await authenticated(ownerToken).post('/api/cart').send({ productId: 1, qty: 1 }).expect(200);
    const checkout = await authenticated(ownerToken).post('/api/checkout').expect(200);
    const orderId = checkout.body.orderId as number;

    await authenticated(otherToken).post(`/api/orders/${orderId}/cancel`).expect(404);
    await authenticated(ownerToken).post('/api/orders/999/cancel').expect(404);
    await authenticated(ownerToken).post(`/api/orders/${orderId}/cancel`).expect(200);
    await authenticated(ownerToken).post(`/api/orders/${orderId}/cancel`).expect(200);

    const order = await Order.findByPk(orderId);
    expect(order?.status).toBe('cancelled');
    expect(order?.inventoryReleasedAt).toBeInstanceOf(Date);
    expect((await Payment.findOne({ where: { OrderId: orderId } }))?.status).toBe('cancelled');
  });

  it('restores stock only once when cancellation requests overlap', async () => {
    const token = await register('concurrent-cancel');

    await authenticated(token).post('/api/cart').send({ productId: 1, qty: 1 }).expect(200);
    const checkout = await authenticated(token).post('/api/checkout').expect(200);
    const orderId = checkout.body.orderId as number;

    const responses = await Promise.all([
      authenticated(token).post(`/api/orders/${orderId}/cancel`),
      authenticated(token).post(`/api/orders/${orderId}/cancel`)
    ]);

    expect(responses.map(response => response.status)).toEqual([200, 200]);
    expect((await Product.findByPk(1))?.stock).toBe(10);
  });
});
