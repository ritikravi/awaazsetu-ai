import { Request, Response, NextFunction } from 'express';
import { evonService } from '../services/gnani/evon.service';
import { prismaService } from '../services/gnani/prisma.service';
import { timbreService } from '../services/gnani/timbre.service';
import { AIProcessingLog } from '../models/AIProcessingLog.model';
import { sendSuccess } from '../utils/helpers';
import { ValidationError } from '../utils/errorTypes';

export class AIController {
  // POST /api/ai/analyze
  async analyze(req: Request, res: Response, next: NextFunction) {
    try {
      const { transcript, language } = req.body;

      if (!transcript || typeof transcript !== 'string') {
        throw new ValidationError('Transcript is required');
      }

      const lang = language ?? 'hi-IN';
      const startTime = Date.now();

      const result = await evonService.analyzeIncident(transcript, lang);
      const processingTimeMs = Date.now() - startTime;

      // Tell the client exactly what engine was used — no deception
      const engineUsed = evonService.isConfigured ? 'evon-v3.3' : 'rule-based';

      await AIProcessingLog.create({
        provider: 'evon',
        modelName: evonService.isConfigured ? 'gnani-evon-v3.3-30B' : 'rule-based-extractor',
        operation: 'incident_analysis',
        status: 'success',
        processingTimeMs,
      }).catch(() => {});

      sendSuccess(res, {
        ...result,
        _meta: {
          engine: engineUsed,
          processingTimeMs,
          evonConfigured: evonService.isConfigured,
        },
      });
    } catch (error: any) {
      await AIProcessingLog.create({
        provider: 'evon',
        modelName: 'gnani-evon-v3.3-30B',
        operation: 'incident_analysis',
        status: error.name === 'TimeoutError' ? 'timeout' : 'error',
        processingTimeMs: 0,
        errorMessage: error.message,
      }).catch(() => {});

      next(error);
    }
  }

  // GET /api/ai/health
  async health(_req: Request, res: Response, next: NextFunction) {
    try {
      const [prisma, evon, timbre] = await Promise.allSettled([
        prismaService.healthCheck(),
        evonService.healthCheck(),
        timbreService.healthCheck(),
      ]);

      const toResult = (r: PromiseSettledResult<{ status: string; latencyMs: number }>) =>
        r.status === 'fulfilled' ? r.value : { status: 'unavailable', latencyMs: 0 };

      sendSuccess(res, {
        prisma: toResult(prisma),
        evon: toResult(evon),
        timbre: toResult(timbre),
        evonMode: evonService.isConfigured ? 'live-inference' : 'rule-based-fallback',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AIController();
