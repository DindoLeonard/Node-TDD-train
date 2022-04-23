import { Request, Response, NextFunction } from 'express';
import TokenService from '../auth/TokenService';
import User from '../user/User';

// middleware to check if user is authorized
const tokenAuthentication = async (req: Request, res: Response, next: NextFunction) => {
  //
  const authorization = req.headers.authorization;

  if (authorization) {
    // authorzation === 'Bearer <token>'
    // skip 6 characters to remove the "Bearer "
    const token = authorization.substring(7);

    try {
      const user = (await TokenService.verify(token)) as User;

      req.authenticatedUser = user;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // console.log('EERRR', err);
    }
  }

  next();
};

export default tokenAuthentication;
