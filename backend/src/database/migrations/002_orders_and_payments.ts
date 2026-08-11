import { DataTypes } from 'sequelize';

import type { Migration } from '../migration';

export const ordersAndPaymentsMigration: Migration = {
  name: '002_orders_and_payments',
  async up(queryInterface, transaction) {
    await queryInterface.changeColumn(
      'Products',
      'price',
      { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      { transaction }
    );
    await queryInterface.changeColumn(
      'Orders',
      'total',
      { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      { transaction }
    );
    await queryInterface.changeColumn(
      'OrderItems',
      'price',
      { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      { transaction }
    );
    await queryInterface.addColumn(
      'Orders',
      'idempotencyKey',
      { type: DataTypes.STRING(128), allowNull: true },
      { transaction }
    );
    await queryInterface.addColumn(
      'Orders',
      'inventoryReleasedAt',
      { type: DataTypes.DATE, allowNull: true },
      { transaction }
    );
    await queryInterface.addConstraint('Orders', {
      fields: ['UserId', 'idempotencyKey'],
      type: 'unique',
      name: 'orders_user_idempotency_unique',
      transaction
    });

    await queryInterface.createTable(
      'Payments',
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        provider: {
          type: DataTypes.STRING(32),
          allowNull: false,
          defaultValue: 'simulated'
        },
        externalReference: { type: DataTypes.STRING(128), allowNull: true },
        status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'pending' },
        amountCents: { type: DataTypes.INTEGER, allowNull: false },
        currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'MXN' },
        OrderId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          unique: true,
          references: { model: 'Orders', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false }
      },
      { transaction }
    );
  },
  async down(queryInterface, transaction) {
    await queryInterface.dropTable('Payments', { transaction });
    await queryInterface.removeConstraint('Orders', 'orders_user_idempotency_unique', {
      transaction
    });
    await queryInterface.removeColumn('Orders', 'inventoryReleasedAt', { transaction });
    await queryInterface.removeColumn('Orders', 'idempotencyKey', { transaction });
    await queryInterface.changeColumn(
      'OrderItems',
      'price',
      { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      { transaction }
    );
    await queryInterface.changeColumn(
      'Orders',
      'total',
      { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      { transaction }
    );
    await queryInterface.changeColumn(
      'Products',
      'price',
      { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      { transaction }
    );
  }
};
