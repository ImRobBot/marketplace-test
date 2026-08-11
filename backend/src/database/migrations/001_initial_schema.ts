import { DataTypes } from 'sequelize';

import type { Migration } from '../migration';

export const initialSchemaMigration: Migration = {
  name: '001_initial_schema',
  async up(queryInterface, transaction) {
    await queryInterface.createTable(
      'Users',
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        username: { type: DataTypes.STRING, allowNull: false, unique: true },
        passwordHash: { type: DataTypes.STRING, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false }
      },
      { transaction }
    );

    await queryInterface.createTable(
      'Products',
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        title: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
        stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false }
      },
      { transaction }
    );

    await queryInterface.createTable(
      'Orders',
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'created' },
        total: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
        UserId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'Users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false }
      },
      { transaction }
    );

    await queryInterface.createTable(
      'OrderItems',
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
        price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
        OrderId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'Orders', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        ProductId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'Products', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false }
      },
      { transaction }
    );

    await queryInterface.createTable(
      'CartItems',
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
        UserId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'Users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        ProductId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'Products', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false }
      },
      { transaction }
    );

    await queryInterface.addConstraint('CartItems', {
      fields: ['UserId', 'ProductId'],
      type: 'unique',
      name: 'cart_items_user_product_unique',
      transaction
    });
  },
  async down(queryInterface, transaction) {
    await queryInterface.dropTable('CartItems', { transaction });
    await queryInterface.dropTable('OrderItems', { transaction });
    await queryInterface.dropTable('Orders', { transaction });
    await queryInterface.dropTable('Products', { transaction });
    await queryInterface.dropTable('Users', { transaction });
  }
};
