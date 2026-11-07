"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const env_1 = require("./config/env");
const errorHandler_middleware_1 = require("./middleware/errorHandler.middleware");
const rateLimiter_middleware_1 = require("./middleware/rateLimiter.middleware");
const logger_1 = require("./utils/logger");
// Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const voice_routes_1 = __importDefault(require("./routes/voice.routes"));
const ai_routes_1 = __importDefault(require("./routes/ai.routes"));
const incident_routes_1 = __importDefault(require("./routes/incident.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        const allowed = [
            'https://awaazsetu-ai.vercel.app',
            'http://localhost:5173',
            env_1.config.cors.origin,
        ];
        if (!origin || allowed.includes(origin))
            return callback(null, true);
        callback(null, false);
    },
    credentials: true,
}));
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Rate limiting
app.use('/api/', rateLimiter_middleware_1.globalRateLimiter);
// Request logging
app.use((req, _res, next) => {
    logger_1.logger.info(`${req.method} ${req.path}`, { ip: req.ip });
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
app.use('/api/auth', rateLimiter_middleware_1.authRateLimiter, auth_routes_1.default);
app.use('/api/voice', voice_routes_1.default);
app.use('/api/ai', ai_routes_1.default);
app.use('/api/incidents', incident_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
// 404 and Error handlers (must be last)
app.use(errorHandler_middleware_1.notFound);
app.use(errorHandler_middleware_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map