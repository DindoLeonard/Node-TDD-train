import express, { Request, Response, NextFunction } from 'express';
import HttpException from '../errors/HttpException';
import UserService from '../user/UserService';
import bcrypt from 'bcrypt';
import { check, validationResult } from 'express-validator';
import TokenService from './TokenService';

const router = express.Router();

router.post('/api/1.0/auth', check('email').isEmail(), async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  const { email, password } = req.body as { email: string; password: string };

  try {
    if (!errors.isEmpty()) {
      throw new HttpException(401, 'Incorrect credentials');
    }

    const user = await UserService.findByEmail(email);

    if (!user) {
      throw new HttpException(401, 'Incorrect credentials');
    }

    // match password
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      throw new HttpException(401, 'Incorrect credentials');
    }

    if (user.inactive) {
      throw new HttpException(403, 'Account is inactive');
    }

    // CREATE TOKEN
    const token = await TokenService.createToken(user);

    res.send({
      id: user?.id,
      username: user?.username,
      token,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
