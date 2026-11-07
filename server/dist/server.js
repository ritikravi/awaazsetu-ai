"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const logger_1 = require("./utils/logger");
const startServer = async () => {
    try {
        // Connect to database
        await (0, database_1.connectDatabase)();
        // Start server
        const server = app_1.default.listen(env_1.config.port, () => {
            logger_1.logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎙️  AwaazSetu AI - Server Running                      ║
║                                                           ║
║   Environment: ${env_1.config.env.padEnd(42)}║
║   Port:        ${env_1.config.port.toString().padEnd(42)}║
║   Database:    Connected ✅                               ║
║                                                           ║
║   Health:      http://localhost:${env_1.config.port}/health          ║
║   API:         http://localhost:${env_1.config.port}/api             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
        });
        // Graceful shutdown
        const gracefulShutdown = (signal) => {
            logger_1.logger.info(`${signal} received. Starting graceful shutdown...`);
            server.close(() => {
                logger_1.logger.info('HTTP server closed');
                process.exit(0);
            });
            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger_1.logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map