import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sanitizeUser } from '../utils/helpers';
import { HTTP_STATUS } from '../config/constants';
import { AuthRequest } from '../types/express';
import { NotFoundError } from '../utils/errorTypes';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, role, preferredLanguage } = req.body;

      const result = await authService.register(name, email, password, role, preferredLanguage);

      sendSuccess(
        res,
        { user: sanitizeUser(result.user), token: result.token },
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      sendSuccess(res, {
        user: sanitizeUser(result.user),
        token: result.token,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const user = await authService.getUserById(authReq.user.id);
      if (!user) {
        return next(new NotFoundError('User not found'));
      }

      sendSuccess(res, { user: sanitizeUser(user) });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
