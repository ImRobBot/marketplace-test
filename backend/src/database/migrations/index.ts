import type { Migration } from '../migration';
import { initialSchemaMigration } from './001_initial_schema';
import { ordersAndPaymentsMigration } from './002_orders_and_payments';

export const migrations: readonly Migration[] = [
  initialSchemaMigration,
  ordersAndPaymentsMigration
];

export const migrationNames = migrations.map(migration => migration.name);
