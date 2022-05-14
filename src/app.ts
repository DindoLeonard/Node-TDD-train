import express from 'express';
import ErrorHandler from './errors/ErrorHandler';
// import HttpException from './errors/HttpException';
import UserRouter from './user/UserRouter';
import AuthenticationRouter from './auth/AuthenticationRouter';
import tokenAuthentication from './middleware/tokenAuthentication';
import FileService from './file/FileService';

// create folders before app is initialized
FileService.createFolders();

const app = express();

app.use(express.json());

// authentication middleware
app.use(tokenAuthentication);

app.use(UserRouter);
app.use(AuthenticationRouter);

app.use(ErrorHandler);

export default app;
