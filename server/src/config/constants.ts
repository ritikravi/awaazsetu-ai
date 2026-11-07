export const INCIDENT_CATEGORIES = [
  'Water Leakage',
  'Road Damage',
  'Electrical Hazard',
  'Waste Management',
  'Drainage Problem',
  'Public Safety',
  'Infrastructure Damage',
  'Other',
] as const;

export const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'] as const;

export const INCIDENT_STATUSES = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
  'Rejected',
] as const;

export const USER_ROLES = ['citizen', 'admin'] as const;

export const VERIFICATION_STATUSES = ['pending', 'verified', 'rejected'] as const;

export const AI_PROVIDERS = ['prisma', 'evon', 'timbre'] as const;

export const SUPPORTED_AUDIO_FORMATS = [
  'audio/wav',
  'audio/mp3',
  'audio/mpeg',
  'audio/ogg',
  'audio/webm',
] as const;

export const SUPPORTED_LANGUAGES = ['hi-IN', 'en-IN'] as const;

export const GNANI_CONFIG = {
  PRISMA: {
    TIMEOUT: 30000,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY: 1000,
  },
  EVON: {
    TIMEOUT: 15000,
    MAX_TOKENS: 1024,
    TEMPERATURE: 0.7,
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

export const ERROR_CODES = {
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
} as const;

export const HTTP_STATUS = {
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
} as const;
