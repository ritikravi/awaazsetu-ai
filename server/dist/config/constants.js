"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP_STATUS = exports.ERROR_CODES = exports.GNANI_CONFIG = exports.SUPPORTED_LANGUAGES = exports.SUPPORTED_AUDIO_FORMATS = exports.AI_PROVIDERS = exports.VERIFICATION_STATUSES = exports.USER_ROLES = exports.INCIDENT_STATUSES = exports.SEVERITY_LEVELS = exports.INCIDENT_CATEGORIES = void 0;
exports.INCIDENT_CATEGORIES = [
    'Water Leakage',
    'Road Damage',
    'Electrical Hazard',
    'Waste Management',
    'Drainage Problem',
    'Public Safety',
    'Infrastructure Damage',
    'Other',
];
exports.SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
exports.INCIDENT_STATUSES = [
    'Submitted',
    'Under Review',
    'Assigned',
    'In Progress',
    'Resolved',
    'Rejected',
];
exports.USER_ROLES = ['citizen', 'admin'];
exports.VERIFICATION_STATUSES = ['pending', 'verified', 'rejected'];
exports.AI_PROVIDERS = ['prisma', 'evon', 'timbre'];
exports.SUPPORTED_AUDIO_FORMATS = [
    'audio/wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/ogg',
    'audio/webm',
];
exports.SUPPORTED_LANGUAGES = ['hi-IN', 'en-IN'];
exports.GNANI_CONFIG = {
    PRISMA: {
        TIMEOUT: 30000,
        MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
        RETRY_ATTEMPTS: 2,
        RETRY_DELAY: 1000,
    },
    EVON: {
        TIMEOUT: 60000, // 60 seconds — llama-server needs time for inference
        MAX_TOKENS: 800, // enough for full JSON output after reasoning
        TEMPERATURE: 0.1, // low temperature for structured output
        RETRY_ATTEMPTS: 1,
    },
    TIMBRE: {
        TIMEOUT: 20000,
        MAX_TEXT_LENGTH: 500,
        DEFAULT_VOICE: 'Nalini',
        DEFAULT_MODEL: 'timbre-v2.5',
        DEFAULT_LANGUAGE: 'hi-IN',
    },
};
exports.ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTH_FAILED: 'AUTH_FAILED',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    ACCESS_DENIED: 'ACCESS_DENIED',
    NOT_FOUND: 'NOT_FOUND',
    DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    PRISMA_ERROR: 'PRISMA_ERROR',
    EVON_ERROR: 'EVON_ERROR',
    TIMBRE_ERROR: 'TIMBRE_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
};
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
};
//# sourceMappingURL=constants.js.map