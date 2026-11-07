import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  MONGODB_URI: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRE: z.string().default('24h'),
  PRISMA_API_ENDPOINT: z.string().default('https://api.vachana.ai/stt/v3'),
  PRISMA_API_KEY_ID: z.string().optional(),
  EVON_INFERENCE_ENDPOINT: z.string().optional(),
  TIMBRE_API_ENDPOINT: z.string().default('https://api.vachana.ai/api/v1/tts/inference'),
  TIMBRE_API_KEY_ID: z.string().optional(),
  MAX_FILE_SIZE: z.string().default('10485760'),
  UPLOAD_DIR: z.string().default('./uploads'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const env = parseEnv();

export const config = {
  env: env.NODE_ENV,
  port: parseInt(env.PORT, 10),
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  mongodb: {
    uri: env.MONGODB_URI,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expire: env.JWT_EXPIRE,
  },
  gnani: {
    prisma: {
      apiEndpoint: env.PRISMA_API_ENDPOINT,
      apiKeyId: env.PRISMA_API_KEY_ID,
    },
    evon: {
      inferenceEndpoint: env.EVON_INFERENCE_ENDPOINT,
    },
    timbre: {
      apiEndpoint: env.TIMBRE_API_ENDPOINT,
      apiKeyId: env.TIMBRE_API_KEY_ID,
    },
  },
  upload: {
    maxFileSize: parseInt(env.MAX_FILE_SIZE, 10),
    uploadDir: env.UPLOAD_DIR,
  },
  cors: {
    origin: env.CORS_ORIGIN,
  },
  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
  },
};
