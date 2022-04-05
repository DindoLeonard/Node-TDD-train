import ValidationErrors from '../../src/user/interface/ValidationErrors';

declare global {
  namespace Express {
    interface Request {
      validationErrors: ValidationErrors;
    }
  }
}
