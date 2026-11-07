"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceController = exports.VoiceController = void 0;
const prisma_service_1 = require("../services/gnani/prisma.service");
const timbre_service_1 = require("../services/gnani/timbre.service");
const AIProcessingLog_model_1 = require("../models/AIProcessingLog.model");
const upload_middleware_1 = require("../middleware/upload.middleware");
const helpers_1 = require("../utils/helpers");
const errorTypes_1 = require("../utils/errorTypes");
const logger_1 = require("../utils/logger");
class VoiceController {
    // POST /api/voice/transcribe
    async transcribe(req, res, next) {
        const filePath = req.file?.path;
        try {
            if (!req.file || !filePath) {
                throw new errorTypes_1.ValidationError('Audio file is required');
            }
            const language = req.body.language || 'hi-IN';
            const mimeType = req.file.mimetype;
            const result = await prisma_service_1.prismaService.transcribe(filePath, mimeType, language);
            await AIProcessingLog_model_1.AIProcessingLog.create({
                provider: 'prisma',
                modelName: 'prisma-v3.0',
                operation: 'transcription',
                status: 'success',
                processingTimeMs: result.processingTimeMs,
                requestId: result.requestId,
            }).catch(() => { });
            (0, helpers_1.sendSuccess)(res, {
                transcript: result.transcript,
                language: result.language,
                processingTimeMs: result.processingTimeMs,
                requestId: result.requestId,
            });
        }
        catch (error) {
            await AIProcessingLog_model_1.AIProcessingLog.create({
                provider: 'prisma',
                modelName: 'prisma-v3.0',
                operation: 'transcription',
                status: error.name === 'TimeoutError' ? 'timeout' : 'error',
                processingTimeMs: 0,
                errorMessage: error.message,
            }).catch(() => { });
            next(error);
        }
        finally {
            if (filePath)
                (0, upload_middleware_1.deleteUploadedFile)(filePath);
        }
    }
    // POST /api/voice/speak
    async speak(req, res, next) {
        try {
            const { text, language, voice, incidentId, category } = req.body;
            if (!text && !(incidentId && category)) {
                throw new errorTypes_1.ValidationError('Either text or incidentId+category is required');
            }
            // Build confirmation text if incidentId provided
            const lang = language || 'hi-IN';
            const finalText = (incidentId && category)
                ? (0, timbre_service_1.buildConfirmationText)({ category, incidentId, language: lang, recommendedAction: req.body.recommendedAction })
                : String(text);
            logger_1.logger.info('TTS synthesis requested', {
                textLength: finalText.length,
                language: lang,
                voice: voice || 'Nalini',
                incidentId,
            });
            const result = await timbre_service_1.timbreService.synthesize(finalText, lang, voice);
            await AIProcessingLog_model_1.AIProcessingLog.create({
                incidentId,
                provider: 'timbre',
                modelName: 'timbre-v2.5',
                operation: 'tts_synthesis',
                status: 'success',
                processingTimeMs: result.processingTimeMs,
            }).catch(() => { });
            res.set({
                'Content-Type': 'audio/mpeg',
                'Content-Length': result.audioBuffer.length.toString(),
                'Cache-Control': 'no-store',
            });
            res.status(200).send(result.audioBuffer);
        }
        catch (error) {
            await AIProcessingLog_model_1.AIProcessingLog.create({
                provider: 'timbre',
                modelName: 'timbre-v2.5',
                operation: 'tts_synthesis',
                status: error.name === 'TimeoutError' ? 'timeout' : 'error',
                processingTimeMs: 0,
                errorMessage: error.message,
            }).catch(() => { });
            next(error);
        }
    }
}
exports.VoiceController = VoiceController;
exports.voiceController = new VoiceController();
//# sourceMappingURL=voice.controller.js.map