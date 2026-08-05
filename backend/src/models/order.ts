import {
  DataTypes,
  Model,
  type CreationOptional,
  type ForeignKey,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
  type Sequelize
} from 'sequelize';

import type { OrderItem } from './orderItem';
import type { User } from './user';

export class Order extends Model<InferAttributes<Order>, InferCreationAttributes<Order>> {
  declare id: CreationOptional<number>;
  declare status: CreationOptional<string>;
  declare total: CreationOptional<number>;
  declare UserId: ForeignKey<User['id']>;
  declare items?: NonAttribute<OrderItem[]>;
}

export function initOrderModel(sequelize: Sequelize): typeof Order {
  Order.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'created'
      },
      total: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
      }
    },
    { sequelize, modelName: 'Order' }
  );

  return Order;
}
