import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errorTypes';
export declare const errorHandler: (err: Error | AppError, req: Request, res: Response, _next: NextFunction) => void;
export declare const notFound: (req: Request, res: Response) => void;
//# sourceMappingURL=errorHandler.middleware.d.ts.map