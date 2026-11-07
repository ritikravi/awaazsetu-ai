export declare const INCIDENT_CATEGORIES: readonly ["Water Leakage", "Road Damage", "Electrical Hazard", "Waste Management", "Drainage Problem", "Public Safety", "Infrastructure Damage", "Other"];
export declare const SEVERITY_LEVELS: readonly ["Low", "Medium", "High", "Critical"];
export declare const INCIDENT_STATUSES: readonly ["Submitted", "Under Review", "Assigned", "In Progress", "Resolved", "Rejected"];
export declare const USER_ROLES: readonly ["citizen", "admin"];
export declare const VERIFICATION_STATUSES: readonly ["pending", "verified", "rejected"];
export declare const AI_PROVIDERS: readonly ["prisma", "evon", "timbre"];
export declare const SUPPORTED_AUDIO_FORMATS: readonly ["audio/wav", "audio/mp3", "audio/mpeg", "audio/ogg", "audio/webm"];
export declare const SUPPORTED_LANGUAGES: readonly ["hi-IN", "en-IN"];
export declare const GNANI_CONFIG: {
    PRISMA: {
        TIMEOUT: number;
        MAX_FILE_SIZE: number;
        RETRY_ATTEMPTS: number;
        RETRY_DELAY: number;
    };
    EVON: {
        TIMEOUT: number;
        MAX_TOKENS: number;
        TEMPERATURE: number;
        RETRY_ATTEMPTS: number;
    };
    TIMBRE: {
        TIMEOUT: number;
        MAX_TEXT_LENGTH: number;
        DEFAULT_VOICE: string;
        DEFAULT_MODEL: string;
        DEFAULT_LANGUAGE: string;
    };
};
export declare const ERROR_CODES: {
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly AUTH_FAILED: "AUTH_FAILED";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly ACCESS_DENIED: "ACCESS_DENIED";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly DUPLICATE_EMAIL: "DUPLICATE_EMAIL";
    readonly FILE_TOO_LARGE: "FILE_TOO_LARGE";
    readonly INVALID_FILE_TYPE: "INVALID_FILE_TYPE";
    readonly PRISMA_ERROR: "PRISMA_ERROR";
    readonly EVON_ERROR: "EVON_ERROR";
    readonly TIMBRE_ERROR: "TIMBRE_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly TIMEOUT_ERROR: "TIMEOUT_ERROR";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
};
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly SERVICE_UNAVAILABLE: 503;
    readonly GATEWAY_TIMEOUT: 504;
};
//# sourceMappingURL=constants.d.ts.map