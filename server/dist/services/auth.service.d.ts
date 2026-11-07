import { IUser } from '../models/User.model';
export declare class AuthService {
    register(name: string, email: string, password: string, role?: 'citizen' | 'admin', preferredLanguage?: string): Promise<{
        user: IUser;
        token: string;
    }>;
    login(email: string, password: string): Promise<{
        user: IUser;
        token: string;
    }>;
    getUserById(userId: string): Promise<IUser | null>;
    generateToken(user: IUser): string;
    verifyToken(token: string): {
        userId: string;
        email: string;
        role: 'citizen' | 'admin';
    };
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map