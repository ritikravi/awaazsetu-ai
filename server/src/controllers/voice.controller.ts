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

      const language = (req.body.language as string) || 'hi-IN';
      const mimeType = req.file.mimetype;

      const result = await prismaService.transcribe(filePath, mimeType, language);

      await AIProcessingLog.create({
        provider: 'prisma',
        modelName: 'prisma-v3.0',
        operation: 'transcription',
        status: 'success',
        processingTimeMs: result.processingTimeMs,
        requestId: result.requestId,
      }).catch(() => {});

      sendSuccess(res, {
        transcript: result.transcript,
        language: result.language,
        processingTimeMs: result.processingTimeMs,
        requestId: result.requestId,
      });
    } catch (error: any) {
      await AIProcessingLog.create({
        provider: 'prisma',
        modelName: 'prisma-v3.0',
        operation: 'transcription',
        status: error.name === 'TimeoutError' ? 'timeout' : 'error',
        processingTimeMs: 0,
        errorMessage: error.message,
      }).catch(() => {});
      next(error);
    } finally {
      if (filePath) deleteUploadedFile(filePath);
    }
  }

  // POST /api/voice/speak
  async speak(req: Request, res: Response, next: NextFunction) {
    try {
      const { text, language, voice, incidentId, category } = req.body;

      if (!text && !(incidentId && category)) {
        throw new ValidationError('Either text or incidentId+category is required');
      }

      // Build confirmation text if incidentId provided
      const lang = language || 'hi-IN';
      const finalText = (incidentId && category)
        ? buildConfirmationText({ category, incidentId, language: lang, recommendedAction: req.body.recommendedAction })
        : String(text);

      logger.info('TTS synthesis requested', {
        textLength: finalText.length,
        language: lang,
        voice: voice || 'Nalini',
        incidentId,
      });

      const result = await timbreService.synthesize(finalText, lang, voice);

      await AIProcessingLog.create({
        incidentId,
        provider: 'timbre',
        modelName: 'timbre-v2.5',
        operation: 'tts_synthesis',
        status: 'success',
        processingTimeMs: result.processingTimeMs,
      }).catch(() => {});

      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': result.audioBuffer.length.toString(),
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
