"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.calculatePagination = exports.sanitizeUser = exports.generateIncidentId = exports.sendError = exports.sendSuccess = void 0;
const constants_1 = require("../config/constants");
const sendSuccess = (res, data, statusCode = constants_1.HTTP_STATUS.OK) => {
    const response = {
        success: true,
        data,
    };
    res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, code, statusCode = constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, details) => {
    const response = {
        success: false,
        error: {
            message,
            code,
        },
    };
    if (details !== undefined) {
        response.error.details = details;
    }
    res.status(statusCode).json(response);
};
exports.sendError = sendError;
const generateIncidentId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `INC-${year}-${random}`;
};
exports.generateIncidentId = generateIncidentId;
const sanitizeUser = (user) => {
    const { passwordHash, ...sanitized } = user.toObject ? user.toObject() : user;
    return sanitized;
};
exports.sanitizeUser = sanitizeUser;
const calculatePagination = (page, limit, total) => {
    return {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
    };
};
exports.calculatePagination = calculatePagination;
const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
exports.sleep = sleep;
//# sourceMappingURL=helpers.js.map