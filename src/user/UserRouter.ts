import { NextFunction, Request, Response, Router } from 'express';
import UserService from './UserService';
import { check, validationResult } from 'express-validator';
import HttpException from '../errors/HttpException';

const router = Router();

router.post(
  '/api/1.0/users',
  check('username')
    .notEmpty()
    .withMessage('Username cannot be null')
    .bail() // to bail and not continue after the previous check
    .isLength({ min: 4, max: 32 })
    .withMessage('Must have min 4 and max 32 characters'),
  check('email')
    .notEmpty()
    .withMessage('E-mail cannot be null')
    .bail()
    .isEmail()
    .withMessage('E-mail is not valid')
    .bail()
    .custom(async (email) => {
      const user = await UserService.findByEmail(email);

      if (user) {
        throw new Error('E-mail in use');
      }
    }),
  check('password')
    .notEmpty()
    .withMessage('Password cannot be null')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Password must be atleast 6 characters')
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('Password must have at least 1 uppercase, 1 lowercase letter and 1 number'),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    try {
      if (!errors.isEmpty()) {
        // const validationErrors: { [key: string]: string } = {};

        // errors.array().forEach((error) => {
        //   validationErrors[error.param] = error.msg;
        // });

        // return res.status(400).send({ validationErrors });
        throw new HttpException(400, 'Validation Failure', errors.array());
      }

      const requestBody = req.body as { password: string; username: string; email: string };

      await UserService.save(requestBody);

      return res.send({ message: 'User created' });
    } catch (err) {
      next(err);
    }
  }
);

router.post('/api/1.0/users/token/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.params.token;

    await UserService.activate(token);

    res.send({
      message: 'Account is activated',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    next(err);
  }
});

export default router;
