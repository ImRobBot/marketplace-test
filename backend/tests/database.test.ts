import type { QueryInterface, Transaction } from 'sequelize';

import { databaseDialect, databaseStorage } from '../src/models';
import { legacyOrderState, toAmountCents } from '../src/database/legacyMapping';
import { migrationNames } from '../src/database/migrations';
import { initialSchemaMigration } from '../src/database/migrations/001_initial_schema';
import { ordersAndPaymentsMigration } from '../src/database/migrations/002_orders_and_payments';

function createMigrationInterface() {
  const methods = {
    createTable: jest.fn().mockResolvedValue(undefined),
    addConstraint: jest.fn().mockResolvedValue(undefined),
    changeColumn: jest.fn().mockResolvedValue(undefined),
    addColumn: jest.fn().mockResolvedValue(undefined),
    dropTable: jest.fn().mockResolvedValue(undefined),
    removeConstraint: jest.fn().mockResolvedValue(undefined),
    removeColumn: jest.fn().mockResolvedValue(undefined)
  };

  return { methods, queryInterface: methods as unknown as QueryInterface };
}

const transaction = {} as Transaction;

describe('database configuration', () => {
  it('uses in-memory SQLite only for the test environment', () => {
    expect(databaseDialect).toBe('sqlite');
    expect(databaseStorage).toBe(':memory:');
  });

  it('has ordered schema migrations for the production database', () => {
    expect(migrationNames).toEqual([
      '001_initial_schema',
      '002_orders_and_payments'
    ]);
  });

  it('maps legacy orders to explicit order and payment states', () => {
    expect(legacyOrderState('paid')).toEqual({ order: 'paid', payment: 'paid' });
    expect(legacyOrderState('cancelled')).toEqual({
      order: 'cancelled',
      payment: 'cancelled'
    });
    expect(legacyOrderState('created')).toEqual({
      order: 'pending_payment',
      payment: 'pending'
    });
  });

  it('converts decimal legacy totals to integer cents', () => {
    expect(toAmountCents(19.99)).toBe(1999);
    expect(toAmountCents('0.10')).toBe(10);
  });

  it('creates and rolls back the initial PostgreSQL schema in dependency order', async () => {
    const { methods, queryInterface } = createMigrationInterface();

    await initialSchemaMigration.up(queryInterface, transaction);
    expect(methods.createTable.mock.calls.map(call => call[0])).toEqual([
      'Users',
      'Products',
      'Orders',
      'OrderItems',
      'CartItems'
    ]);
    expect(methods.addConstraint).toHaveBeenCalledWith('CartItems', expect.objectContaining({
      name: 'cart_items_user_product_unique',
      transaction
    }));

    await initialSchemaMigration.down(queryInterface, transaction);
    expect(methods.dropTable.mock.calls.map(call => call[0])).toEqual([
      'CartItems',
      'OrderItems',
      'Orders',
      'Products',
      'Users'
    ]);
  });

  it('creates and rolls back order payment fields and constraints', async () => {
    const { methods, queryInterface } = createMigrationInterface();

    await ordersAndPaymentsMigration.up(queryInterface, transaction);
    expect(methods.changeColumn).toHaveBeenCalledTimes(3);
    expect(methods.addColumn.mock.calls.map(call => [call[0], call[1]])).toEqual([
      ['Orders', 'idempotencyKey'],
      ['Orders', 'inventoryReleasedAt']
    ]);
    expect(methods.addConstraint).toHaveBeenCalledWith('Orders', expect.objectContaining({
      name: 'orders_user_idempotency_unique',
      transaction
    }));
    expect(methods.createTable).toHaveBeenCalledWith(
      'Payments',
      expect.objectContaining({ OrderId: expect.objectContaining({ unique: true }) }),
      { transaction }
    );

    await ordersAndPaymentsMigration.down(queryInterface, transaction);
    expect(methods.dropTable).toHaveBeenCalledWith('Payments', { transaction });
    expect(methods.removeConstraint).toHaveBeenCalledWith(
      'Orders',
      'orders_user_idempotency_unique',
      { transaction }
    );
    expect(methods.removeColumn.mock.calls.map(call => [call[0], call[1]])).toEqual([
      ['Orders', 'inventoryReleasedAt'],
      ['Orders', 'idempotencyKey']
    ]);
    expect(methods.changeColumn).toHaveBeenCalledTimes(6);
  });
});
