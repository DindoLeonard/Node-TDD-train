import { Request, Response, Router } from 'express';
import UserService from './UserService';

const router = Router();

router.post('/api/1.0/users', async (req: Request, res: Response) => {
  const requestBody = req.body as { password: string; username: string; email: string };

  const { username } = requestBody;

  if (username === null) {
    return res.status(400).send({
      validationErrors: {
        username: 'Username cannot be null',
      },
    });
  }

  await UserService.save(requestBody);

  res.send({ message: 'User created' });
});

export default router;
