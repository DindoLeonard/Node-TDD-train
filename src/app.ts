import express from 'express';
import ErrorHandler from './errors/ErrorHandler';
// import HttpException from './errors/HttpException';
import UserRouter from './user/UserRouter';

const app = express();

app.use(express.json());

app.use(UserRouter);

app.use(ErrorHandler);

export default app;
