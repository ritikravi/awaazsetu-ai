"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('5000'),
    MONGODB_URI: zod_1.z.string(),
    JWT_SECRET: zod_1.z.string(),
    JWT_EXPIRE: zod_1.z.string().default('24h'),
    PRISMA_API_ENDPOINT: zod_1.z.string().default('https://api.vachana.ai/stt/v3'),
    PRISMA_API_KEY_ID: zod_1.z.string().optional(),
    EVON_INFERENCE_ENDPOINT: zod_1.z.string().optional(),
    TIMBRE_API_ENDPOINT: zod_1.z.string().default('https://api.vachana.ai/api/v1/tts/inference'),
    TIMBRE_API_KEY_ID: zod_1.z.string().optional(),
    MAX_FILE_SIZE: zod_1.z.string().default('10485760'),
    UPLOAD_DIR: zod_1.z.string().default('./uploads'),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:5173'),
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().default('900000'),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().default('100'),
});
const parseEnv = () => {
    try {
        return envSchema.parse(process.env);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            console.error('❌ Environment validation failed:');
            error.errors.forEach((err) => {
                console.error(`  ${err.path.join('.')}: ${err.message}`);
            });
            process.exit(1);
        }
        throw error;
    }
};
exports.env = parseEnv();
exports.config = {
    env: exports.env.NODE_ENV,
    port: parseInt(exports.env.PORT, 10),
    isDevelopment: exports.env.NODE_ENV === 'development',
    isProduction: exports.env.NODE_ENV === 'production',
    isTest: exports.env.NODE_ENV === 'test',
    mongodb: {
        uri: exports.env.MONGODB_URI,
    },
    jwt: {
        secret: exports.env.JWT_SECRET,
        expire: exports.env.JWT_EXPIRE,
    },
    gnani: {
        prisma: {
            apiEndpoint: exports.env.PRISMA_API_ENDPOINT,
            apiKeyId: exports.env.PRISMA_API_KEY_ID,
        },
        evon: {
            inferenceEndpoint: exports.env.EVON_INFERENCE_ENDPOINT,
        },
        timbre: {
            apiEndpoint: exports.env.TIMBRE_API_ENDPOINT,
            apiKeyId: exports.env.TIMBRE_API_KEY_ID,
        },
    },
    upload: {
        maxFileSize: parseInt(exports.env.MAX_FILE_SIZE, 10),
        uploadDir: exports.env.UPLOAD_DIR,
    },
    cors: {
        origin: exports.env.CORS_ORIGIN,
    },
    rateLimit: {
        windowMs: parseInt(exports.env.RATE_LIMIT_WINDOW_MS, 10),
        maxRequests: parseInt(exports.env.RATE_LIMIT_MAX_REQUESTS, 10),
    },
};
//# sourceMappingURL=env.js.map