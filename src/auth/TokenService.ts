// import jwt from 'jsonwebtoken';
import User from '../user/User';
import generator from '../shared/generator';
import Token from './Token';
import Sequelize from 'sequelize';

const ONE_WEEK_IN_MILLIS = 7 * 24 * 60 * 60 * 1000;

const createToken = async (user: User) => {
  // creating random string token and store in db under token field
  const token = generator.randomString(32);

  await Token.create({ token, userId: user.id as number, lastUsedAt: new Date() });

  return token;
  // return jwt.sign({ id: user.id }, 'this-is-our-secret');
};

const verify = async (token: string) => {
  const oneWeekAgo = new Date(Date.now() - ONE_WEEK_IN_MILLIS);

  const tokenInDB = await Token.findOne({
    where: {
      token: token,
      lastUsedAt: {
        [Sequelize.Op.gt]: oneWeekAgo,
      },
    },
  });

  if (tokenInDB) {
    tokenInDB.lastUsedAt = new Date();
  }

  tokenInDB?.save();

  const userId = tokenInDB?.userId;

  return { id: userId };

  // return jwt.verify(token, 'this-is-our-secret');
};

const deleteToken = async (token: string) => {
  await Token.destroy({ where: { token } });
};

const scheduleCleanup = async () => {
  //

  console.log('running cleanup');

  setInterval(async () => {
    const oneWeekAgo = new Date(Date.now() - ONE_WEEK_IN_MILLIS);
    await Token.destroy({
      where: {
        lastUsedAt: {
          [Sequelize.Op.lt]: oneWeekAgo,
        },
      },
    });
  }, 60 * 60 * 1000);
};

export default { createToken, verify, deleteToken, scheduleCleanup };
