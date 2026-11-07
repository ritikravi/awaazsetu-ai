import { Request, Response, NextFunction } from 'express';
import { prismaService } from '../services/gnani/prisma.service';
import { timbreService, buildConfirmationText } from '../services/gnani/timbre.service';
import { AIProcessingLog } from '../models/AIProcessingLog.model';
import { deleteUploadedFile } from '../middleware/upload.middleware';
import { sendSuccess } from '../utils/helpers';
import { ValidationError } from '../utils/errorTypes';
import { AuthRequest } from '../types/express';
import { logger } from '../utils/logger';

export class VoiceController {
  // POST /api/voice/transcribe
  async transcribe(req: Request, res: Response, next: NextFunction) {
    const filePath = req.file?.path;
    try {
      if (!req.file || !filePath) {
        throw new ValidationError('Audio file is required');
      }

      const language = req.body.language as string | undefined;
      const mimeType = req.file.mimetype;

      const result = await prismaService.transcribe(filePath, mimeType, language);

      // Log AI operation
      await AIProcessingLog.create({
        provider: 'prisma',
        modelName: 'prisma-stt-v3',
        operation: 'transcription',
        status: 'success',
        processingTimeMs: result.processingTimeMs,
        requestId: result.requestId,
      });

      sendSuccess(res, {
        transcript: result.transcript,
        language: result.language,
        processingTimeMs: result.processingTimeMs,
        requestId: result.requestId,
      });
    } catch (error: any) {
      // Log failed attempt
      await AIProcessingLog.create({
        provider: 'prisma',
        modelName: 'prisma-stt-v3',
        operation: 'transcription',
        status: error.name === 'TimeoutError' ? 'timeout' : 'error',
        processingTimeMs: 0,
        errorMessage: error.message,
      }).catch(() => {});

      next(error);
    } finally {
      // Always clean up uploaded file
      if (filePath) {
        deleteUploadedFile(filePath);
      }
    }
  }

  // POST /api/voice/speak
  async speak(req: Request, res: Response, next: NextFunction) {
    try {
      const { text, language, voice, incidentId, category } = req.body;

      if (!text || typeof text !== 'string') {
        throw new ValidationError('Text is required');
      }

      // If generating incident confirmation, build the text automatically
      let finalText = text;
      if (incidentId && category) {
        const authReq = req as AuthRequest;
        finalText = buildConfirmationText({
          category,
          incidentId,
          language: language ?? authReq.user?.email ?? 'hi-IN',
        });
      }

      const result = await timbreService.synthesize(finalText, language, voice);

      await AIProcessingLog.create({
        incidentId,
        provider: 'timbre',
        modelName: 'timbre-v2.5',
        operation: 'tts_synthesis',
        status: 'success',
        processingTimeMs: result.processingTimeMs,
      }).catch(() => {});

      res.set({
        'Content-Type': result.mimeType,
        'Content-Length': result.audioBuffer.length,
        'Cache-Control': 'no-store',
      });

      res.status(200).send(result.audioBuffer);
    } catch (error: any) {
      await AIProcessingLog.create({
        provider: 'timbre',
        modelName: 'timbre-v2.5',
        operation: 'tts_synthesis',
        status: error.name === 'TimeoutError' ? 'timeout' : 'error',
        processingTimeMs: 0,
        errorMessage: error.message,
      }).catch(() => {});

      next(error);
    }
  }
}

export const voiceController = new VoiceController();
