import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../types/express';
import { AuthenticationError, AuthorizationError } from '../utils/errorTypes';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);

    const user = await authService.getUserById(decoded.userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Attach user to request as any to avoid TS declaration issues
    (req as AuthRequest).user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: Array<'citizen' | 'admin'>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return next(new AuthenticationError('User not authenticated'));
    }

    if (!roles.includes(authReq.user.role)) {
      return next(new AuthorizationError('You do not have permission to access this resource'));
    }

    next();
  };
};
