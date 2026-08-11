import {
  DataTypes,
  Model,
  type CreationOptional,
  type ForeignKey,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize
} from 'sequelize';

import type { Order } from './order';
import type { Product } from './product';

export class OrderItem extends Model<InferAttributes<OrderItem>, InferCreationAttributes<OrderItem>> {
  declare id: CreationOptional<number>;
  declare qty: CreationOptional<number>;
  declare price: CreationOptional<number>;
  declare OrderId: ForeignKey<Order['id']>;
  declare ProductId: ForeignKey<Product['id']>;
}

export function initOrderItemModel(sequelize: Sequelize): typeof OrderItem {
  OrderItem.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      }
    },
    { sequelize, modelName: 'OrderItem' }
  );

  return OrderItem;
}
