import { Request, Response, NextFunction, Router } from 'express';
import UserService from './UserService';

const router = Router();

const validateUsername = (req: Request, res: Response, next: NextFunction) => {
  //

  const requestBody = req.body as { password: string; username: string; email: string };

  const { username } = requestBody;

  if (username === null) {
    req.validationErrors = {
      ...req.validationErrors,
      username: 'Username cannot be null',
    };
  }

  next();
};

const validateEmail = (req: Request, res: Response, next: NextFunction) => {
  const requestBody = req.body as { username?: string | null; password?: string | null; email?: string | null };

  if (requestBody.email === null) {
    req.validationErrors = {
      ...req.validationErrors,
      email: 'E-mail cannot be null',
    };
  }
  next();
};

router.post('/api/1.0/users', validateUsername, validateEmail, async (req: Request, res: Response) => {
  // will take care of validation errors
  if (req.validationErrors) {
    const response = { validationErrors: { ...req.validationErrors } };

    res.status(400).send(response);
  }

  const requestBody = req.body as { password: string; username: string; email: string };

  await UserService.save(requestBody);

  res.send({ message: 'User created' });
});

export default router;
