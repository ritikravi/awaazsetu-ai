"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const auth_service_1 = require("../services/auth.service");
const errorTypes_1 = require("../utils/errorTypes");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errorTypes_1.AuthenticationError('No token provided');
        }
        const token = authHeader.substring(7);
        const decoded = auth_service_1.authService.verifyToken(token);
        const user = await auth_service_1.authService.getUserById(decoded.userId);
        if (!user) {
            throw new errorTypes_1.AuthenticationError('User not found');
        }
        // Attach user to request as any to avoid TS declaration issues
        req.user = {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        };
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, _res, next) => {
        const authReq = req;
        if (!authReq.user) {
            return next(new errorTypes_1.AuthenticationError('User not authenticated'));
        }
        if (!roles.includes(authReq.user.role)) {
            return next(new errorTypes_1.AuthorizationError('You do not have permission to access this resource'));
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.middleware.js.map