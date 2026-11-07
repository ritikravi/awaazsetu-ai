import rateLimit from 'express-rate-limit';
import { config } from '../config/env';
import { sendError } from '../utils/helpers';
import { ERROR_CODES } from '../config/constants';

export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'Too many requests, please try again later.', ERROR_CODES.RATE_LIMIT_EXCEEDED, 429);
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler: (_req, res) => {
    sendError(res, 'Too many auth attempts, please try again later.', ERROR_CODES.RATE_LIMIT_EXCEEDED, 429);
  },
});
