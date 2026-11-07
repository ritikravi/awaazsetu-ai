"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const helpers_1 = require("../utils/helpers");
const constants_1 = require("../config/constants");
const errorTypes_1 = require("../utils/errorTypes");
class AuthController {
    async register(req, res, next) {
        try {
            const { name, email, password, role, preferredLanguage } = req.body;
            const result = await auth_service_1.authService.register(name, email, password, role, preferredLanguage);
            (0, helpers_1.sendSuccess)(res, { user: (0, helpers_1.sanitizeUser)(result.user), token: result.token }, constants_1.HTTP_STATUS.CREATED);
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await auth_service_1.authService.login(email, password);
            (0, helpers_1.sendSuccess)(res, {
                user: (0, helpers_1.sanitizeUser)(result.user),
                token: result.token,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getCurrentUser(req, res, next) {
        try {
            const authReq = req;
            const user = await auth_service_1.authService.getUserById(authReq.user.id);
            if (!user) {
                return next(new errorTypes_1.NotFoundError('User not found'));
            }
            (0, helpers_1.sendSuccess)(res, { user: (0, helpers_1.sanitizeUser)(user) });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map