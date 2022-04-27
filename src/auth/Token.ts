import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from 'sequelize';
import sequelize from '../config/database';

class Token extends Model<InferAttributes<Token>, InferCreationAttributes<Token>> {
  declare id?: CreationOptional<number>;
  declare token: string;
  declare userId?: number;
  declare lastUsedAt?: Date;
}

Token.init(
  {
    token: {
      type: DataTypes.STRING,
    },
    // userId: {
    //   type: DataTypes.INTEGER,
    // },
    lastUsedAt: {
      type: DataTypes.DATE,
    },
  },

  { sequelize, modelName: 'token', timestamps: false }
);

export default Token;
