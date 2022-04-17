class ForbiddenException extends Error {
  status: number;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(status = 403, message = 'You are not authorized to update user', errors?: any) {
    super(message);
    this.status = status;
    this.message = message;
    this.errors = errors;
  }
}

export default ForbiddenException;
