import jwt, { SignOptions } from 'jsonwebtoken';
import { User, IUser } from '../models/User.model';
import { config } from '../config/env';
import { AuthenticationError, DuplicateError, ValidationError } from '../utils/errorTypes';

export class AuthService {
  async register(
    name: string,
    email: string,
    password: string,
    role: 'citizen' | 'admin' = 'citizen',
    preferredLanguage = 'hi-IN'
  ): Promise<{ user: IUser; token: string }> {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new DuplicateError('User with this email already exists');
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role,
      preferredLanguage,
    });

    const token = this.generateToken(user);
    return { user, token };
  }

  async login(email: string, password: string): Promise<{ user: IUser; token: string }> {
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    const token = this.generateToken(user);
    return { user, token };
  }

  async getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }

  generateToken(user: IUser): string {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const options: SignOptions = {
      expiresIn: 86400, // 24 hours in seconds
    };

    return jwt.sign(payload, config.jwt.secret, options);
  }

  verifyToken(token: string): { userId: string; email: string; role: 'citizen' | 'admin' } {
    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string;
      email: string;
      role: 'citizen' | 'admin';
    };
    return decoded;
  }
}

export const authService = new AuthService();
