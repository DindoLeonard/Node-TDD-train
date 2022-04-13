import { Request, Response, NextFunction } from 'express';

const pagination = (req: Request, res: Response, next: NextFunction) => {
  const pageAsNumber = Number.parseInt(req.query.page as string);
  const sizeAsNumber = Number.parseInt(req.query.size as string);

  let page = Number.isNaN(pageAsNumber) ? 0 : pageAsNumber;

  let size = Number.isNaN(sizeAsNumber) ? 10 : sizeAsNumber;

  if (page < 0) {
    page = 0;
  }

  if (size > 10 || size < 1) {
    size = 10;
  }

  req.pagination = {
    page,
    size,
  };

  next();
};

export default pagination;
