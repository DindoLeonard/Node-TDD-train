import express, { Express, Request, Response } from 'express';
import User from './user/User';

export const app: Express = express();

app.use(express.json());

app.post('/api/1.0/users', (req: Request, res: Response) => {
  User.create(req.body).then(() => {
    return res.send({ message: 'User created' });
  });
});
