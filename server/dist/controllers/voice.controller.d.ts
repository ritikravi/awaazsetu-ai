import { Request, Response, NextFunction } from 'express';
export declare class VoiceController {
    transcribe(req: Request, res: Response, next: NextFunction): Promise<void>;
    speak(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const voiceController: VoiceController;
//# sourceMappingURL=voice.controller.d.ts.map