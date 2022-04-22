import jwt from 'jsonwebtoken';
import User from '../user/User';

const createToken = (user: User) => {
  return jwt.sign({ id: user.id }, 'this-is-our-secret');
};

export default { createToken };