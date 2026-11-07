import { Request, Response, NextFunction } from 'express';
export declare class DashboardController {
    getStats(_req: Request, res: Response, next: NextFunction): Promise<void>;
    getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const dashboardController: DashboardController;
//# sourceMappingURL=dashboard.controller.d.ts.map