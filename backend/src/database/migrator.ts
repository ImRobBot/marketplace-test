import { DataTypes, QueryTypes, type Sequelize } from 'sequelize';

import { migrations } from './migrations';

interface AppliedMigration {
  name: string;
}

async function ensureMetadataTable(sequelize: Sequelize): Promise<void> {
  const queryInterface = sequelize.getQueryInterface();
  const tableNames = (await queryInterface.showAllTables()).map(String);

  if (!tableNames.includes('SequelizeMeta')) {
    await queryInterface.createTable('SequelizeMeta', {
      name: { type: DataTypes.STRING, allowNull: false, primaryKey: true }
    });
  }
}

export async function runMigrations(sequelize: Sequelize): Promise<string[]> {
  await ensureMetadataTable(sequelize);
  const applied = await sequelize.query<AppliedMigration>(
    'SELECT "name" FROM "SequelizeMeta" ORDER BY "name" ASC',
    { type: QueryTypes.SELECT }
  );
  const appliedNames = new Set(applied.map(migration => migration.name));
  const executed: string[] = [];

  for (const migration of migrations) {
    if (appliedNames.has(migration.name)) continue;

    await sequelize.transaction(async transaction => {
      await migration.up(sequelize.getQueryInterface(), transaction);
      await sequelize.getQueryInterface().bulkInsert(
        'SequelizeMeta',
        [{ name: migration.name }],
        { transaction }
      );
    });
    executed.push(migration.name);
  }

  return executed;
}
