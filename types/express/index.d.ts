import ValidationErrors from '../../src/user/interface/ValidationErrors';
import User from '../../src/user/User';

declare global {
  namespace Express {
    interface Request {
      validationErrors: ValidationErrors;
      pagination: {
        size: number;
        page: number;
      };
      authenticatedUser: User;
    }
  }
}
