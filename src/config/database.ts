import { Sequelize } from 'sequelize';
import config from 'config';

const dbConfig = config.get('database') as {
  database: string;
  username: string;
  password: string;
  dialect: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql';
  storage: string;
  logging: boolean;
};

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  dialect: dbConfig.dialect,
  storage: dbConfig.storage,
  logging: dbConfig.logging,
});

export default sequelize;
