class NotFoundException extends Error {
  status: number;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(message: string, status = 404, errors?: any) {
    super(message);
    this.status = status;
    this.message = message;
    this.errors = errors;
  }
}

export default NotFoundException;
