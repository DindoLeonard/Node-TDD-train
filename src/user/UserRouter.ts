import { Request, Response, Router } from 'express';
import UserService from './UserService';

const router = Router();

router.post('/api/1.0/users', async (req: Request, res: Response) => {
  const requestBody = req.body as { password: string; username: string; email: string };

  await UserService.save(requestBody);

  res.send({ message: 'User created' });
});

export default router;
