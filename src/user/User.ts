import { Model, DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/database';

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare username: string;
  declare email: string;
  declare password: string;
  declare inactive: boolean | undefined;
  declare activationToken: string | undefined;
}

User.init(
  {
    username: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
    password: {
      type: DataTypes.STRING,
    },
    inactive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    activationToken: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    modelName: 'user',
  }
);

export default User;
