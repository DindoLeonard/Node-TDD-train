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

  // will be undefined if object is empty
  const validationErrorObjectOrUndefined =
    Object.keys(validationErrors).length === 0 && validationErrors.constructor === Object
      ? undefined
      : validationErrors;

  return res.status(error.status).send({
    path: req.originalUrl,
    timestamp: new Date().getTime(),
    message: error.message,
    validationErrors: validationErrorObjectOrUndefined,
  });
};

export default ErrorHandler;
