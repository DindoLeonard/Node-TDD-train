import express, { Express } from 'express';

const app: Express = express();

app.listen(3000, () => {
  console.log(`app is running`);
});
