import { Response } from 'express';
export declare const sendSuccess: <T>(res: Response, data: T, statusCode?: number) => void;
export declare const sendError: (res: Response, message: string, code: string, statusCode?: number, details?: unknown) => void;
export declare const generateIncidentId: () => string;
export declare const sanitizeUser: (user: any) => any;
export declare const calculatePagination: (page: number, limit: number, total: number) => {
    total: number;
    page: number;
    pages: number;
    limit: number;
};
export declare const sleep: (ms: number) => Promise<void>;
//# sourceMappingURL=helpers.d.ts.map