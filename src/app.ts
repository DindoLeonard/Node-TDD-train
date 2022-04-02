import express, { Express } from 'express';
import UserRouter from './user/UserRouter';

const app: Express = express();

app.use(express.json());
app.use(UserRouter);

export default app;
