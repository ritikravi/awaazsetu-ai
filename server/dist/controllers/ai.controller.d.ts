import { Request, Response, NextFunction } from 'express';
export declare class AIController {
    analyze(req: Request, res: Response, next: NextFunction): Promise<void>;
    health(_req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const aiController: AIController;
//# sourceMappingURL=ai.controller.d.ts.map