import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import UserService from '../user/UserService';
import ForbiddenException from '../errors/ForbiddenException';

// middleware to check if user is authorized
const basicAuthentication = async (req: Request, res: Response, next: NextFunction) => {
  //
  const authorization = req.headers.authorization;

  if (authorization) {
    // authorzation === 'Basic ...'
    // skip 6 characters to remove the "Basic "
    const encoded = authorization.substring(6);
    const decoded = Buffer.from(encoded, 'base64').toString('ascii');
    const [email, password] = decoded.split(':');

    const user = await UserService.findByEmail(email);

    if (user && !user.inactive) {
      //
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return next(new ForbiddenException());
      }
      req.authenticatedUser = user;
    }
  }

  next();
};

export default basicAuthentication;
