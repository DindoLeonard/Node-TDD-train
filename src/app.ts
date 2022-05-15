import express from 'express';
import ErrorHandler from './errors/ErrorHandler';
// import HttpException from './errors/HttpException';
import UserRouter from './user/UserRouter';
import AuthenticationRouter from './auth/AuthenticationRouter';
import tokenAuthentication from './middleware/tokenAuthentication';
import FileService from './file/FileService';
import config from 'config';
import path from 'path';

const uploadDir = config.get<string>('uploadDir');
const profileDir = config.get<string>('profileDir');
const profileFolder = path.join('.', uploadDir, profileDir);

const ONE_YEAR_IN_MILLIS = 365 * 24 * 60 * 60 * 1000;

// create folders before app is initialized
FileService.createFolders();

const app = express();

app.use(express.json());

// Serving static files
app.use('/images', express.static(profileFolder, { maxAge: ONE_YEAR_IN_MILLIS }));

// authentication middleware
app.use(tokenAuthentication);

app.use(UserRouter);
app.use(AuthenticationRouter);

app.use(ErrorHandler);

export default app;
