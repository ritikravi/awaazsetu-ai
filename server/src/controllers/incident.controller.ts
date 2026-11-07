import { Request, Response, NextFunction } from 'express';
import { incidentService } from '../services/incident.service';
import { sendSuccess } from '../utils/helpers';
import { HTTP_STATUS } from '../config/constants';
import { AuthRequest } from '../types/express';

export class IncidentController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const incident = await incidentService.create({
        userId: authReq.user.id,
        ...req.body,
      });
      sendSuccess(res, { incident }, HTTP_STATUS.CREATED);
    } catch (error) { next(error); }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { page, limit, status, category, severity, userId } = req.query;
      const result = await incidentService.findMany(
        {
          page: page ? parseInt(page as string) : undefined,
          limit: limit ? parseInt(limit as string) : undefined,
          status: status as string,
          category: category as string,
          severity: severity as string,
          userId: userId as string,
        },
        authReq.user.id,
        authReq.user.role === 'admin'
      );
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const incident = await incidentService.findById(
        req.params.id,
        authReq.user.id,
        authReq.user.role === 'admin'
      );
      const history = await incidentService.getHistory(req.params.id);
      sendSuccess(res, { incident, history });
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const incident = await incidentService.update(req.params.id, req.body, authReq.user.id);
      sendSuccess(res, { incident });
    } catch (error) { next(error); }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { status, notes } = req.body;
      const incident = await incidentService.updateStatus(
        req.params.id,
        status,
        authReq.user.id,
        notes
      );
      sendSuccess(res, { incident });
    } catch (error) { next(error); }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const history = await incidentService.getHistory(req.params.id);
      sendSuccess(res, { history });
    } catch (error) { next(error); }
  }
}

export const incidentController = new IncidentController();
