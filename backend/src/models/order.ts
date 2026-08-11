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
import type { Payment } from './payment';
import type { User } from './user';

export type OrderStatus = 'pending_payment' | 'paid' | 'payment_failed' | 'cancelled';

export class Order extends Model<InferAttributes<Order>, InferCreationAttributes<Order>> {
  declare id: CreationOptional<number>;
  declare status: CreationOptional<OrderStatus>;
  declare total: CreationOptional<number>;
  declare idempotencyKey: CreationOptional<string | null>;
  declare inventoryReleasedAt: CreationOptional<Date | null>;
  declare UserId: ForeignKey<User['id']>;
  declare items?: NonAttribute<OrderItem[]>;
  declare payment?: NonAttribute<Payment>;
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
        defaultValue: 'pending_payment'
      },
      total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      idempotencyKey: {
        type: DataTypes.STRING(128),
        allowNull: true
      },
      inventoryReleasedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Order',
      indexes: [{ unique: true, fields: ['UserId', 'idempotencyKey'] }]
    }
  );

  return Order;
}
