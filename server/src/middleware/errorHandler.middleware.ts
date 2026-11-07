import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errorTypes';
import { logger } from '../utils/logger';
import { sendError } from '../utils/helpers';
import { ERROR_CODES, HTTP_STATUS } from '../config/constants';
import { config } from '../config/env';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: config.isDevelopment ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Handle operational errors
  if (err instanceof AppError && err.isOperational) {
    sendError(res, err.message, err.code, err.statusCode);
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    sendError(
      res,
      'Validation failed',
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
      config.isDevelopment ? err.message : undefined
    );
    return;
  }

  // Handle Mongoose duplicate key errors
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    sendError(
      res,
      'Resource already exists',
      ERROR_CODES.DUPLICATE_EMAIL,
      HTTP_STATUS.CONFLICT
    );
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token', ERROR_CODES.AUTH_FAILED, HTTP_STATUS.UNAUTHORIZED);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Token expired', ERROR_CODES.TOKEN_EXPIRED, HTTP_STATUS.UNAUTHORIZED);
    return;
  }

  // Handle unknown errors
  sendError(
    res,
    config.isDevelopment ? err.message : 'Internal server error',
    ERROR_CODES.INTERNAL_ERROR,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    config.isDevelopment ? err.stack : undefined
  );
};

export const notFound = (req: Request, res: Response): void => {
  sendError(
    res,
    `Route ${req.originalUrl} not found`,
    ERROR_CODES.NOT_FOUND,
    HTTP_STATUS.NOT_FOUND
  );
};
