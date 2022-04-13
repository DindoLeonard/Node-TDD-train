import app from './src/app';
import sequelize from './src/config/database';
import User from './src/user/User';

const addUsers = async (activeUserCount: number, inactiveUserCount = 0) => {
  for (let i = 0; i < activeUserCount + (inactiveUserCount || 0); i += 1) {
    await User.create({
      username: `user${i + 1}`,
      email: `user${i + 1}@mail.com`,
      password: 'P4ssword',
      inactive: i >= activeUserCount,
    });
  }
};

// initializing sequalize
sequelize.sync({ force: true }).then(async () => {
  await addUsers(25);
});

console.log('env ' + process.env.NODE_ENV);

app.listen(3000, () => {
  console.log(`app is running`);
});
