"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = exports.globalRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("../config/env");
const helpers_1 = require("../utils/helpers");
const constants_1 = require("../config/constants");
exports.globalRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.config.rateLimit.windowMs,
    max: env_1.config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        (0, helpers_1.sendError)(res, 'Too many requests, please try again later.', constants_1.ERROR_CODES.RATE_LIMIT_EXCEEDED, 429);
    },
});
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    handler: (_req, res) => {
        (0, helpers_1.sendError)(res, 'Too many auth attempts, please try again later.', constants_1.ERROR_CODES.RATE_LIMIT_EXCEEDED, 429);
    },
});
//# sourceMappingURL=rateLimiter.middleware.js.map