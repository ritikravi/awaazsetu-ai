import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'citizen' | 'admin';
}

export interface AuthRequest extends Request {
  user: AuthenticatedUser;
}
