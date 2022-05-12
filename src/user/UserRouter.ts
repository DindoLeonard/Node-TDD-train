import { NextFunction, Request, Response, Router } from 'express';
import UserService from './UserService';
import { check, validationResult } from 'express-validator';
import HttpException from '../errors/HttpException';
import pagination from '../middleware/pagination';
import ForbiddenException from '../errors/ForbiddenException';
import NotFoundException from '../errors/NotFoundException';
// import bcrypt from 'bcrypt';
// import basicAuthentication from '../middleware/basicAuthentication';
// import tokenAuthentication from '../middleware/tokenAuthentication';
// import TokenService from '../auth/TokenService';

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

router.get('/api/1.0/users', pagination, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authenticatedUser = req.authenticatedUser;
    //
    const { page, size } = req.pagination;

    const users = await UserService.getUsers(page, size, authenticatedUser);

    res.send(users);
  } catch (err) {
    next(err);
  }
});

router.get('/api/1.0/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserService.getUser(req.params.id);

    res.send(user);
  } catch (err) {
    next(err);
  }
});

router.put('/api/1.0/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  //
  const authenticatedUser = req.authenticatedUser;

  if (!authenticatedUser || authenticatedUser.id !== Number(req.params.id)) {
    return next(new ForbiddenException());
  }

  await UserService.updateUser(req.params.id, req.body);

  return res.send();
});

router.delete('/api/1.0/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authenticatedUser = req.authenticatedUser;

    if (!authenticatedUser || authenticatedUser.id !== Number(req.params.id)) {
      throw new ForbiddenException(undefined, 'You are not authorized to delete user');
    }

    await UserService.deleteUser(req.params.id);
    // const authorization = req.headers.authorization;

    // const token = authorization?.substring(7);

    // if (token) {
    //   await TokenService.deleteToken(token);
    // }

    res.send();
  } catch (err) {
    next(err);
  }
});

router.post(
  '/api/1.0/user/password',
  check('email').isEmail().withMessage('E-mail is not valid'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      //
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new HttpException(400, 'E-mail is not valid', errors.array());
      }

      await UserService.passwordResetRequest(req.body.email);

      const user = await UserService.findByEmail(req.body.email);

      if (user) {
        return res.send({ message: 'Check your e-mail for resetting your password' });
      }

      throw new NotFoundException('E-mail not found');
    } catch (err) {
      next(err);
    }
  }
);

export default router;
