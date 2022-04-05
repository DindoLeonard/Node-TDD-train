import { Request, Response, Router } from 'express';
import UserService from './UserService';
import { check, validationResult } from 'express-validator';

const router = Router();

router.post(
  '/api/1.0/users',
  check('username').notEmpty().withMessage('Username cannot be null'),
  check('email').notEmpty().withMessage('E-mail cannot be null'),
  check('password').notEmpty().withMessage('Password cannot be null'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const validationErrors: { [key: string]: string } = {};

      errors.array().forEach((error) => {
        validationErrors[error.param] = error.msg;
      });

      return res.status(400).send({ validationErrors });
    }

    const requestBody = req.body as { password: string; username: string; email: string };

    await UserService.save(requestBody);

    res.send({ message: 'User created' });
  }
);

export default router;
