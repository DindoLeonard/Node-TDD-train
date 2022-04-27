// import jwt from 'jsonwebtoken';
import User from '../user/User';
import generator from '../shared/generator';
import Token from './Token';

const createToken = async (user: User) => {
  // creating random string token and store in db under token field
  const token = generator.randomString(32);

  await Token.create({ token, userId: user.id as number });

  return token;
  // return jwt.sign({ id: user.id }, 'this-is-our-secret');
};

const verify = async (token: string) => {
  const tokenInDB = await Token.findOne({ where: { token: token } });

  const userId = tokenInDB?.userId;

  return { id: userId };

  // return jwt.verify(token, 'this-is-our-secret');
};

const deleteToken = async (token: string) => {
  await Token.destroy({ where: { token } });
};

export default { createToken, verify, deleteToken };
