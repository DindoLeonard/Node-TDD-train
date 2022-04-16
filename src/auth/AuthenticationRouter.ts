import express, { Request, Response } from 'express';
import UserService from '../user/UserService';

const router = express.Router();

router.post(
  '/api/1.0/auth',
  async (req: Request<unknown, unknown, { email: string; password: string }>, res: Response) => {
    const { email } = req.body;

    const user = await UserService.findByEmail(email);

    res.send({
      id: user?.id,
      username: user?.username,
    });
  }
);

export default router;
