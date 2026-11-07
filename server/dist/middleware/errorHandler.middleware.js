"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.errorHandler = void 0;
const errorTypes_1 = require("../utils/errorTypes");
const logger_1 = require("../utils/logger");
const helpers_1 = require("../utils/helpers");
const constants_1 = require("../config/constants");
const env_1 = require("../config/env");
const errorHandler = (err, req, res, _next) => {
    // Log error
    logger_1.logger.error('Error occurred:', {
        message: err.message,
        stack: env_1.config.isDevelopment ? err.stack : undefined,
        path: req.path,
        method: req.method,
    });
    // Handle operational errors
    if (err instanceof errorTypes_1.AppError && err.isOperational) {
        (0, helpers_1.sendError)(res, err.message, err.code, err.statusCode);
        return;
    }
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        (0, helpers_1.sendError)(res, 'Validation failed', constants_1.ERROR_CODES.VALIDATION_ERROR, constants_1.HTTP_STATUS.BAD_REQUEST, env_1.config.isDevelopment ? err.message : undefined);
        return;
    }
    // Handle Mongoose duplicate key errors
    if (err.name === 'MongoServerError' && err.code === 11000) {
        (0, helpers_1.sendError)(res, 'Resource already exists', constants_1.ERROR_CODES.DUPLICATE_EMAIL, constants_1.HTTP_STATUS.CONFLICT);
        return;
    }
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        (0, helpers_1.sendError)(res, 'Invalid token', constants_1.ERROR_CODES.AUTH_FAILED, constants_1.HTTP_STATUS.UNAUTHORIZED);
        return;
    }
    if (err.name === 'TokenExpiredError') {
        (0, helpers_1.sendError)(res, 'Token expired', constants_1.ERROR_CODES.TOKEN_EXPIRED, constants_1.HTTP_STATUS.UNAUTHORIZED);
        return;
    }
    // Handle unknown errors
    (0, helpers_1.sendError)(res, env_1.config.isDevelopment ? err.message : 'Internal server error', constants_1.ERROR_CODES.INTERNAL_ERROR, constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, env_1.config.isDevelopment ? err.stack : undefined);
};
exports.errorHandler = errorHandler;
const notFound = (req, res) => {
    (0, helpers_1.sendError)(res, `Route ${req.originalUrl} not found`, constants_1.ERROR_CODES.NOT_FOUND, constants_1.HTTP_STATUS.NOT_FOUND);
};
exports.notFound = notFound;
//# sourceMappingURL=errorHandler.middleware.js.map