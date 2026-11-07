export declare const env: {
    NODE_ENV: "development" | "production" | "test";
    PORT: string;
    MONGODB_URI: string;
    JWT_SECRET: string;
    JWT_EXPIRE: string;
    PRISMA_API_ENDPOINT: string;
    TIMBRE_API_ENDPOINT: string;
    MAX_FILE_SIZE: string;
    UPLOAD_DIR: string;
    CORS_ORIGIN: string;
    RATE_LIMIT_WINDOW_MS: string;
    RATE_LIMIT_MAX_REQUESTS: string;
    PRISMA_API_KEY_ID?: string | undefined;
    EVON_INFERENCE_ENDPOINT?: string | undefined;
    TIMBRE_API_KEY_ID?: string | undefined;
};
export declare const config: {
    env: "development" | "production" | "test";
    port: number;
    isDevelopment: boolean;
    isProduction: boolean;
    isTest: boolean;
    mongodb: {
        uri: string;
    };
    jwt: {
        secret: string;
        expire: string;
    };
    gnani: {
        prisma: {
            apiEndpoint: string;
            apiKeyId: string | undefined;
        };
        evon: {
            inferenceEndpoint: string | undefined;
        };
        timbre: {
            apiEndpoint: string;
            apiKeyId: string | undefined;
        };
    };
    upload: {
        maxFileSize: number;
        uploadDir: string;
    };
    cors: {
        origin: string;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
};
//# sourceMappingURL=env.d.ts.map