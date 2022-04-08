import bcrypt from 'bcrypt';
import User from './User';
import crypto from 'crypto';

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

  await User.create(user);
};

const findByEmail = async (email: string) => {
  return await User.findOne({ where: { email } });
};

const UserService = {
  save,
  findByEmail,
};

export default UserService;
