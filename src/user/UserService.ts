import bcrypt from 'bcrypt';
import User from './User';

const save = async (body: { username: string; email: string; password: string }) => {
  const saltRounds = 10;

  const hash = await bcrypt.hash(body.password, saltRounds);

  const user = {
    username: body.username,
    email: body.email,
    password: hash,
  };

  await User.create(user);
};

const UserService = {
  save,
};

export default UserService;