import express, { Express, Request, Response } from 'express';

export const app: Express = express();

app.post('/api/1.0/users', (req: Request, res: Response) => {
  return res.send({ message: 'User created' });
});
