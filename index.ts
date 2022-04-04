import app from './src/app';
import sequelize from './src/config/database';

// initializing sequalize
sequelize.sync();

console.log('env ' + process.env.NODE_ENV);

app.listen(3000, () => {
  console.log(`app is running`);
});
