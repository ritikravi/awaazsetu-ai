import { Response } from 'express';
import { HTTP_STATUS } from '../config/constants';

interface SuccessResponse<T> {
  success: true;
  data: T;
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export const sendSuccess = <T>(res: Response, data: T, statusCode: number = HTTP_STATUS.OK): void => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  code: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  details?: unknown
): void => {
  const response: ErrorResponse = {
    success: false,
    error: {
      message,
      code,
    },
  };

  if (details !== undefined) {
    response.error.details = details;
  }

  res.status(statusCode).json(response);
};

export const generateIncidentId = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `INC-${year}-${random}`;
};

export const sanitizeUser = (user: any) => {
  const { passwordHash, ...sanitized } = user.toObject ? user.toObject() : user;
  return sanitized;
};

export const calculatePagination = (page: number, limit: number, total: number) => {
  return {
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
  };
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
