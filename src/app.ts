import express, { Express, Request, Response } from 'express';
import User from './user/User';
import bcrypt from 'bcrypt';

export const app: Express = express();

app.use(express.json());

app.post('/api/1.0/users', (req: Request, res: Response) => {
  const requestBody = req.body as { password: string; username: string; email: string };
  const saltRounds = 10;

  bcrypt.hash(requestBody.password, saltRounds).then((hash) => {
    //
    const user = {
      username: requestBody.username,
      email: requestBody.email,
      password: hash,
    };

    User.create(user).then(() => {
      return res.send({ message: 'User created' });
    });
  });
});
