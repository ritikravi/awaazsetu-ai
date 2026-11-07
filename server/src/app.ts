import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler.middleware';
import { globalRateLimiter, authRateLimiter } from './middleware/rateLimiter.middleware';
import { logger } from './utils/logger';

// Routes
import authRoutes from './routes/auth.routes';
import voiceRoutes from './routes/voice.routes';
import aiRoutes from './routes/ai.routes';
import incidentRoutes from './routes/incident.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'https://awaazsetu-ai.vercel.app',
      'http://localhost:5173',
      config.cors.origin,
    ];
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(null, false);
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', globalRateLimiter);

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: { status: 'operational', timestamp: new Date().toISOString(), uptime: process.uptime() },
  });
});

// API routes
app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 and Error handlers (must be last)
app.use(notFound);
app.use(errorHandler);

export default app;
