"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = require("../models/User.model");
const env_1 = require("../config/env");
const errorTypes_1 = require("../utils/errorTypes");
class AuthService {
    async register(name, email, password, role = 'citizen', preferredLanguage = 'hi-IN') {
        const existingUser = await User_model_1.User.findOne({ email });
        if (existingUser) {
            throw new errorTypes_1.DuplicateError('User with this email already exists');
        }
        if (password.length < 8) {
            throw new errorTypes_1.ValidationError('Password must be at least 8 characters long');
        }
        const user = await User_model_1.User.create({
            name,
            email,
            passwordHash: password,
            role,
            preferredLanguage,
        });
        const token = this.generateToken(user);
        return { user, token };
    }
    async login(email, password) {
        const user = await User_model_1.User.findOne({ email }).select('+passwordHash');
        if (!user) {
            throw new errorTypes_1.AuthenticationError('Invalid email or password');
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new errorTypes_1.AuthenticationError('Invalid email or password');
        }
        const token = this.generateToken(user);
        return { user, token };
    }
    async getUserById(userId) {
        return User_model_1.User.findById(userId);
    }
    generateToken(user) {
        const payload = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        };
        const options = {
            expiresIn: 86400, // 24 hours in seconds
        };
        return jsonwebtoken_1.default.sign(payload, env_1.config.jwt.secret, options);
    }
    verifyToken(token) {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwt.secret);
        return decoded;
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map