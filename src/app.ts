import express from 'express';
import UserRouter from './user/UserRouter';

const app = express();

app.use(express.json());
app.use(UserRouter);

export default app;
