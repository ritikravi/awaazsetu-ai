"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = exports.TimeoutError = exports.ServiceUnavailableError = exports.FileUploadError = exports.DuplicateError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
const constants_1 = require("../config/constants");
class AppError extends Error {
    constructor(message, statusCode, code, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message) {
        super(message, constants_1.HTTP_STATUS.BAD_REQUEST, constants_1.ERROR_CODES.VALIDATION_ERROR);
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, constants_1.HTTP_STATUS.UNAUTHORIZED, constants_1.ERROR_CODES.AUTH_FAILED);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, constants_1.HTTP_STATUS.FORBIDDEN, constants_1.ERROR_CODES.ACCESS_DENIED);
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, constants_1.HTTP_STATUS.NOT_FOUND, constants_1.ERROR_CODES.NOT_FOUND);
    }
}
exports.NotFoundError = NotFoundError;
class DuplicateError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, constants_1.HTTP_STATUS.CONFLICT, constants_1.ERROR_CODES.DUPLICATE_EMAIL);
    }
}
exports.DuplicateError = DuplicateError;
class FileUploadError extends AppError {
    constructor(message, code = constants_1.ERROR_CODES.INVALID_FILE_TYPE) {
        super(message, constants_1.HTTP_STATUS.BAD_REQUEST, code);
    }
}
exports.FileUploadError = FileUploadError;
class ServiceUnavailableError extends AppError {
    constructor(message = 'Service temporarily unavailable') {
        super(message, constants_1.HTTP_STATUS.SERVICE_UNAVAILABLE, constants_1.ERROR_CODES.SERVICE_UNAVAILABLE);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
class TimeoutError extends AppError {
    constructor(message = 'Request timeout') {
        super(message, constants_1.HTTP_STATUS.GATEWAY_TIMEOUT, constants_1.ERROR_CODES.TIMEOUT_ERROR);
    }
}
exports.TimeoutError = TimeoutError;
class RateLimitError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, constants_1.HTTP_STATUS.TOO_MANY_REQUESTS, constants_1.ERROR_CODES.RATE_LIMIT_EXCEEDED);
    }
}
exports.RateLimitError = RateLimitError;
//# sourceMappingURL=errorTypes.js.map