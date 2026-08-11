import { Sequelize, type Dialect } from 'sequelize';

import { CartItem, initCartItemModel } from './cartItem';
import { initOrderModel, Order } from './order';
import { initOrderItemModel, OrderItem } from './orderItem';
import { initPaymentModel, Payment } from './payment';
import { initProductModel, Product } from './product';
import { initUserModel, User } from './user';

export interface Models {
  sequelize: Sequelize;
  User: typeof User;
  Product: typeof Product;
  Order: typeof Order;
  OrderItem: typeof OrderItem;
  Payment: typeof Payment;
  CartItem: typeof CartItem;
}

const isTestDatabase = process.env.NODE_ENV === 'test';
const databaseUrl = process.env.DATABASE_URL?.trim();

export const databaseDialect: Dialect = isTestDatabase ? 'sqlite' : 'postgres';
export const databaseStorage = isTestDatabase ? ':memory:' : undefined;

function createSequelize(): Sequelize {
  if (isTestDatabase) {
    return new Sequelize({ dialect: 'sqlite', storage: databaseStorage, logging: false });
  }

  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be configured outside the test environment');
  }

  return new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      application_name: 'mercado-uno-api',
      statement_timeout: 15_000,
      idle_in_transaction_session_timeout: 15_000,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined
    }
  });
}

export const sequelize = createSequelize();

initUserModel(sequelize);
initProductModel(sequelize);
initOrderModel(sequelize);
initOrderItemModel(sequelize);
initPaymentModel(sequelize);
initCartItemModel(sequelize);

User.hasMany(Order, { foreignKey: 'UserId' });
Order.belongsTo(User, { foreignKey: 'UserId' });

Order.hasMany(OrderItem, { as: 'items', foreignKey: 'OrderId' });
OrderItem.belongsTo(Order, { foreignKey: 'OrderId' });
Product.hasMany(OrderItem, { foreignKey: 'ProductId' });
OrderItem.belongsTo(Product, { foreignKey: 'ProductId' });

Order.hasOne(Payment, { as: 'payment', foreignKey: 'OrderId' });
Payment.belongsTo(Order, { foreignKey: 'OrderId' });

User.hasMany(CartItem, { foreignKey: 'UserId' });
CartItem.belongsTo(User, { foreignKey: 'UserId' });
Product.hasMany(CartItem, { foreignKey: 'ProductId' });
CartItem.belongsTo(Product, { foreignKey: 'ProductId' });

export const models: Models = {
  sequelize,
  User,
  Product,
  Order,
  OrderItem,
  Payment,
  CartItem
};

export { CartItem, Order, OrderItem, Payment, Product, User };
