import { Request, Response, NextFunction } from 'express';
export declare class IncidentController {
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
    list(req: Request, res: Response, next: NextFunction): Promise<void>;
    getOne(req: Request, res: Response, next: NextFunction): Promise<void>;
    update(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    getHistory(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const incidentController: IncidentController;
//# sourceMappingURL=incident.controller.d.ts.map