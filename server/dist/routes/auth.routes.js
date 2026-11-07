"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const auth_validator_1 = require("../validators/auth.validator");
const router = (0, express_1.Router)();
/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', (0, validate_middleware_1.validate)(auth_validator_1.registerSchema), auth_controller_1.authController.register.bind(auth_controller_1.authController));
/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', (0, validate_middleware_1.validate)(auth_validator_1.loginSchema), auth_controller_1.authController.login.bind(auth_controller_1.authController));
/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.authController.getCurrentUser.bind(auth_controller_1.authController));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map