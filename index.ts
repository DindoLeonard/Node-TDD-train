import app from './src/app';
import sequelize from './src/config/database';

// initializing sequalize
sequelize.sync();

app.listen(3000, () => {
  console.log(`app is running`);
});
