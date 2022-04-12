/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express';
import HttpException from './HttpException';

const ErrorHandler = async (error: HttpException, req: Request, res: Response, _next: NextFunction) => {
  let validationErrors: { [key: string]: string } = {};

  if (error.errors) {
    validationErrors = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error.errors.forEach((err: any) => {
      validationErrors[err.param] = err.msg;
    });
  }

  return res.status(error.status).send({ message: error.message, validationErrors });
};

export default ErrorHandler;
