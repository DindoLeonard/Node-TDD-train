import bcrypt from 'bcrypt';
import User from './User';
// import crypto from 'crypto';
import EmailService from '../email/EmailService';
import Sequelize from 'sequelize';
import sequelize from '../config/database';
// import { EmailException } from '../email/EmailException';
import HttpException from '../errors/HttpException';
import generator from '../shared/generator';
import NotFoundException from '../errors/NotFoundException';
import TokenService from '../auth/TokenService';

// const generateToken = (length: number): string => {
//   return crypto.randomBytes(length).toString('hex').substring(0, length);
// };

const save = async (body: { username: string; email: string; password: string }) => {
  const saltRounds = 10;

  const { username, email, password } = body;

  const hash = await bcrypt.hash(password, saltRounds);

  const user = {
    username,
    email,
    password: hash,
    activationToken: generator.randomString(16),
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

const getUsers = async (page = 0, size = 10, authenticatedUser: User) => {
  //
  const id = authenticatedUser ? authenticatedUser.id : 0;

  const users = await User.findAndCountAll({
    where: {
      inactive: false,
      id: {
        [Sequelize.Op.not]: id,
      },
    },
    attributes: ['id', 'username', 'email', 'image'],
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

const getUser = async (id: string) => {
  const user = await User.findOne({
    where: { id: id, inactive: false },
    attributes: ['id', 'username', 'email', 'image'],
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return user;
};

const updateUser = async (
  id: string,
  updatedBody: { username: string; email: string; inactive: string; image: string }
) => {
  //
  const user = await User.findOne({ where: { id } });

  if (user) {
    user.username = updatedBody.username;

    // saving image in base64 format
    user.image = updatedBody.image;
    await user?.save();

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      image: user.image,
    };
  }
};

const deleteUser = async (id: string) => {
  await User.destroy({ where: { id } });
};

const passwordResetRequest = async (email: string) => {
  //
  const user = await UserService.findByEmail(email);

  if (!user) {
    throw new NotFoundException('E-mail not found');
  }

  // generate password reset token
  user.passwordResetToken = generator.randomString(16);
  await user.save();

  try {
    await EmailService.sendPasswordReset(email, user.passwordResetToken);
  } catch (err) {
    throw new HttpException(502, 'E-mail Failure');
  }
};

const updatePassword = async (updateRequest: {
  passwordResetRequest: string;
  password: string;
  passwordResetToken: string;
}) => {
  const user = await findByPasswordResetToken(updateRequest.passwordResetToken);
  const salt = 10;
  const hash = await bcrypt.hash(updateRequest.password, salt);

  if (user) {
    user.password = hash;
    // delete token after user password update
    user.passwordResetToken = null;

    user.inactive = false;

    user.activationToken = null;

    await user.save();

    if (user.id) {
      await TokenService.clearTokens(user.id.toString());
    }
  }
};

const findByPasswordResetToken = (token: string) => {
  //
  return User.findOne({ where: { passwordResetToken: token } });
};

const UserService = {
  save,
  findByEmail,
  activate,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  passwordResetRequest,
  updatePassword,
  findByPasswordResetToken,
};

export default UserService;
