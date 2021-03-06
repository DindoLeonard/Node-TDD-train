import app from './src/app';
import sequelize from './src/config/database';
import User from './src/user/User';
import bcrypt from 'bcrypt';
import TokenService from './src/auth/TokenService';

const addUsers = async (activeUserCount: number, inactiveUserCount = 0) => {
  const hash = await bcrypt.hash('P4ssword', 10);

  for (let i = 0; i < activeUserCount + (inactiveUserCount || 0); i += 1) {
    await User.create({
      username: `user${i + 1}`,
      email: `user${i + 1}@mail.com`,
      password: hash,
      inactive: i >= activeUserCount,
    });
  }
};

// initializing sequalize
sequelize.sync({ force: true }).then(async () => {
  await addUsers(25);
});

TokenService.scheduleCleanup();

app.listen(3000, () => {
  console.log(`app is running in ${process.env.NODE_ENV}`);
});
