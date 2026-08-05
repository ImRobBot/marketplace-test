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

import type { Product } from './product';
import type { User } from './user';

export class CartItem extends Model<InferAttributes<CartItem>, InferCreationAttributes<CartItem>> {
  declare id: CreationOptional<number>;
  declare qty: CreationOptional<number>;
  declare UserId: ForeignKey<User['id']>;
  declare ProductId: ForeignKey<Product['id']>;
  declare Product?: NonAttribute<Product>;
}

export function initCartItemModel(sequelize: Sequelize): typeof CartItem {
  CartItem.init(
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
      }
    },
    { sequelize, modelName: 'CartItem' }
  );

  return CartItem;
}
