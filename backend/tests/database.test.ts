import { databaseDialect, databaseStorage } from '../src/models';
import { legacyOrderState, toAmountCents } from '../src/database/legacyMapping';
import { migrationNames } from '../src/database/migrations';

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
});
