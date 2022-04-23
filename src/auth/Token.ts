import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '../config/database';

class Token extends Model<InferAttributes<Token>, InferCreationAttributes<Token>> {
  declare id?: CreationOptional<number>;
  declare token: string;
  declare userId: number;
}

Token.init(
  {
    token: {
      type: DataTypes.STRING,
    },
    userId: {
      type: DataTypes.INTEGER,
    },
  },

  { sequelize, modelName: 'token' }
);

export default Token;
