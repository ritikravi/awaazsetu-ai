import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';
import { sendSuccess } from '../utils/helpers';

export class DashboardController {
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await analyticsService.getStats();
      sendSuccess(res, stats);
    } catch (error) { next(error); }
  }

  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const data = await analyticsService.getAnalytics(
        startDate as string | undefined,
        endDate as string | undefined
      );
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }
}

export const dashboardController = new DashboardController();
