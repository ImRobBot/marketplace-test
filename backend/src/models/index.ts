import path from 'node:path';

import { Sequelize } from 'sequelize';

import { CartItem, initCartItemModel } from './cartItem';
import { initOrderModel, Order } from './order';
import { initOrderItemModel, OrderItem } from './orderItem';
import { initProductModel, Product } from './product';
import { initUserModel, User } from './user';

export interface Models {
  sequelize: Sequelize;
  User: typeof User;
  Product: typeof Product;
  Order: typeof Order;
  OrderItem: typeof OrderItem;
  CartItem: typeof CartItem;
}

export const databaseStorage =
  process.env.NODE_ENV === 'test'
    ? ':memory:'
    : process.env.DB_STORAGE?.trim() ||
      path.resolve(__dirname, '..', '..', 'data', 'database.sqlite');

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: databaseStorage,
  logging: false
});

initUserModel(sequelize);
initProductModel(sequelize);
initOrderModel(sequelize);
initOrderItemModel(sequelize);
initCartItemModel(sequelize);

User.hasMany(Order, { foreignKey: 'UserId' });
Order.belongsTo(User, { foreignKey: 'UserId' });

Order.hasMany(OrderItem, { as: 'items', foreignKey: 'OrderId' });
OrderItem.belongsTo(Order, { foreignKey: 'OrderId' });
Product.hasMany(OrderItem, { foreignKey: 'ProductId' });
OrderItem.belongsTo(Product, { foreignKey: 'ProductId' });

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
  CartItem
};

export { CartItem, Order, OrderItem, Product, User };
