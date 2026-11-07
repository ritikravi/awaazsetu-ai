export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly isOperational: boolean;
    constructor(message: string, statusCode: number, code: string, isOperational?: boolean);
}
export declare class ValidationError extends AppError {
    constructor(message: string);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string);
}
export declare class DuplicateError extends AppError {
    constructor(message?: string);
}
export declare class FileUploadError extends AppError {
    constructor(message: string, code?: string);
}
export declare class ServiceUnavailableError extends AppError {
    constructor(message?: string);
}
export declare class TimeoutError extends AppError {
    constructor(message?: string);
}
export declare class RateLimitError extends AppError {
    constructor(message?: string);
}
//# sourceMappingURL=errorTypes.d.ts.map