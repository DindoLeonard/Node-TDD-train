// extends the interface of Request
declare global {
  namespace Express {
    interface Request {
      example: string;
    }
  }
}
