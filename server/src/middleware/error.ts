import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('[API Error]', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && config.env === 'production' 
      ? 'An unexpected error occurred on the server' 
      : message,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    ...(config.env !== 'production' && { stack: err.stack }),
  });
}
