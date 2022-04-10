import bcrypt from 'bcrypt';
import User from './User';
import crypto from 'crypto';
import EmailService from '../email/EmailService';
import sequelize from '../config/database';
import { EmailException } from '../email/EmailException';

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
    throw EmailException();
  }
};

const findByEmail = async (email: string) => {
  return await User.findOne({ where: { email } });
};

const UserService = {
  save,
  findByEmail,
};

export default UserService;
