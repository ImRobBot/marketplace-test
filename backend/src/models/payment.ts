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

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';

export class Payment extends Model<InferAttributes<Payment>, InferCreationAttributes<Payment>> {
  declare id: CreationOptional<number>;
  declare provider: CreationOptional<string>;
  declare externalReference: CreationOptional<string | null>;
  declare status: CreationOptional<PaymentStatus>;
  declare amountCents: number;
  declare currency: CreationOptional<string>;
  declare OrderId: ForeignKey<Order['id']>;
}

export function initPaymentModel(sequelize: Sequelize): typeof Payment {
  Payment.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      provider: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'simulated'
      },
      externalReference: {
        type: DataTypes.STRING(128),
        allowNull: true
      },
      status: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'pending'
      },
      amountCents: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'MXN'
      }
    },
    { sequelize, modelName: 'Payment' }
  );

  return Payment;
}
