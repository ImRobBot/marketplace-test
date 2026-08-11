import { existsSync } from 'node:fs';
import path from 'node:path';

import { QueryTypes, Sequelize, type Transaction } from 'sequelize';
import sqlite3 from 'sqlite3';

import { legacyOrderState, toAmountCents } from './legacyMapping';
import { runMigrations } from './migrator';
import { models, sequelize } from '../models';

type LegacyRow = Record<string, unknown>;

const legacyTables = ['Users', 'Products', 'Orders', 'OrderItems', 'CartItems'] as const;
const targetTables = [...legacyTables, 'Payments'] as const;

interface ImportReport {
  Users: number;
  Products: number;
  Orders: number;
  OrderItems: number;
  CartItems: number;
  Payments: number;
}

function sourcePath(): string {
  return path.resolve(process.env.SQLITE_SOURCE?.trim() || path.join('data', 'database.sqlite'));
}

async function readLegacyRows(source: Sequelize): Promise<Record<string, LegacyRow[]>> {
  const availableTables = (await source.getQueryInterface().showAllTables()).map(String);
  const missing = legacyTables.filter(table => !availableTables.includes(table));
  if (missing.length > 0) {
    throw new Error(`SQLite source is missing tables: ${missing.join(', ')}`);
  }

  const rows: Record<string, LegacyRow[]> = {};
  for (const table of legacyTables) {
    rows[table] = await source.query<LegacyRow>(`SELECT * FROM "${table}"`, {
      type: QueryTypes.SELECT
    });
  }
  return rows;
}

function normalizeOrders(rows: LegacyRow[]): { orders: LegacyRow[]; payments: LegacyRow[] } {
  const orders: LegacyRow[] = [];
  const payments: LegacyRow[] = [];

  rows.forEach((row, index) => {
    const state = legacyOrderState(row.status);
    const timestamp = row.updatedAt ?? row.createdAt ?? new Date();
    orders.push({
      ...row,
      status: state.order,
      idempotencyKey: null,
      inventoryReleasedAt: state.order === 'cancelled' ? timestamp : null
    });
    payments.push({
      id: index + 1,
      provider: 'legacy',
      externalReference: `legacy-order-${String(row.id)}`,
      status: state.payment,
      amountCents: toAmountCents(row.total),
      currency: 'MXN',
      OrderId: row.id,
      createdAt: row.createdAt ?? timestamp,
      updatedAt: timestamp
    });
  });

  return { orders, payments };
}

async function assertEmptyTarget(transaction: Transaction): Promise<void> {
  const counts = await Promise.all([
    models.User.count({ transaction }),
    models.Product.count({ transaction }),
    models.Order.count({ transaction }),
    models.OrderItem.count({ transaction }),
    models.CartItem.count({ transaction }),
    models.Payment.count({ transaction })
  ]);
  if (counts.some(count => count > 0)) {
    throw new Error('PostgreSQL target must be empty before importing SQLite data');
  }
}

async function resetSequences(transaction: Transaction): Promise<void> {
  for (const table of targetTables) {
    await sequelize.query(
      `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE(MAX("id"), 1), MAX("id") IS NOT NULL) FROM "${table}"`,
      { transaction }
    );
  }
}

async function importRows(rows: Record<string, LegacyRow[]>): Promise<ImportReport> {
  const { orders, payments } = normalizeOrders(rows.Orders ?? []);
  const importedRows: Record<string, LegacyRow[]> = { ...rows, Orders: orders, Payments: payments };

  await sequelize.transaction(async transaction => {
    await assertEmptyTarget(transaction);
    for (const table of targetTables) {
      const tableRows = importedRows[table] ?? [];
      if (tableRows.length > 0) {
        await sequelize.getQueryInterface().bulkInsert(table, tableRows, { transaction });
      }
    }
    await resetSequences(transaction);
  });

  return Object.fromEntries(
    targetTables.map(table => [table, importedRows[table]?.length ?? 0])
  ) as unknown as ImportReport;
}

async function main(): Promise<void> {
  const sqlitePath = sourcePath();
  if (!existsSync(sqlitePath)) {
    throw new Error(`SQLite source does not exist: ${sqlitePath}`);
  }

  const source = new Sequelize({
    dialect: 'sqlite',
    storage: sqlitePath,
    logging: false,
    dialectOptions: { mode: sqlite3.OPEN_READONLY }
  });

  try {
    await source.authenticate();
    await sequelize.authenticate();
    await runMigrations(sequelize);
    const report = await importRows(await readLegacyRows(source));
    console.log(`Importacion completada desde ${sqlitePath}: ${JSON.stringify(report)}`);
  } finally {
    await Promise.allSettled([source.close(), sequelize.close()]);
  }
}

void main().catch((error: unknown) => {
  console.error('No se pudo importar la base SQLite.', error);
  process.exitCode = 1;
});
