module.exports = {
  database: {
    database: 'hoaxify',
    username: 'my-db-user',
    password: 'db-p4ss',
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false,
  },
  mail: {
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'eliane.goyette37@ethereal.email',
      pass: 'BUYXg4d55sGD46esrX',
    },
  },
  uploadDir: 'upload-dev',
  profileDir: 'profile',
};
