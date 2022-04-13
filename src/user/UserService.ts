import bcrypt from 'bcrypt';
import User from './User';
import crypto from 'crypto';
import EmailService from '../email/EmailService';
import sequelize from '../config/database';
// import { EmailException } from '../email/EmailException';
import HttpException from '../errors/HttpException';

const generateToken = (length: number): string => {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
};

const save = async (body: { username: string; email: string; password: string }) => {
  const saltRounds = 10;

  const { username, email, password } = body;

  const hash = await bcrypt.hash(password, saltRounds);

  const user = {
    username,
    email,
    password: hash,
    activationToken: generateToken(16),
  };

  const transaction = await sequelize.transaction();

  await User.create(user, { transaction });

  try {
    await EmailService.sendAccountActivation(email, user.activationToken);
    await transaction.commit();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    await transaction.rollback();
    // throw EmailException();
    throw new HttpException(502, 'E-mail Failure');
  }
};

const findByEmail = async (email: string) => {
  return await User.findOne({ where: { email } });
};

const activate = async (token: string) => {
  const user = await User.findOne({ where: { activationToken: token } });

  if (!user) {
    throw new HttpException(400, 'This account is either active or the active token is invalid');
  }

  user.inactive = false;
  user.activationToken = null;

  await user.save();
};

const getUsers = async (page = 0, size = 10) => {
  //
  const users = await User.findAndCountAll({
    where: {
      inactive: false,
    },
    attributes: ['id', 'username', 'email'],
    limit: size,
    offset: page * size,
  });

  return {
    content: users.rows,
    page,
    size,
    totalPages: Math.ceil(users.count / size),
  };
};

const UserService = {
  save,
  findByEmail,
  activate,
  getUsers,
};

export default UserService;
