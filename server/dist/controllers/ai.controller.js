"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiController = exports.AIController = void 0;
const evon_service_1 = require("../services/gnani/evon.service");
const prisma_service_1 = require("../services/gnani/prisma.service");
const timbre_service_1 = require("../services/gnani/timbre.service");
const AIProcessingLog_model_1 = require("../models/AIProcessingLog.model");
const helpers_1 = require("../utils/helpers");
const errorTypes_1 = require("../utils/errorTypes");
class AIController {
    // POST /api/ai/analyze
    async analyze(req, res, next) {
        try {
            const { transcript, language } = req.body;
            if (!transcript || typeof transcript !== 'string') {
                throw new errorTypes_1.ValidationError('Transcript is required');
            }
            const lang = language ?? 'hi-IN';
            const startTime = Date.now();
            const result = await evon_service_1.evonService.analyzeIncident(transcript, lang);
            const processingTimeMs = Date.now() - startTime;
            // Tell the client exactly what engine was used — no deception
            const engineUsed = evon_service_1.evonService.isConfigured ? 'evon-v3.3' : 'rule-based';
            await AIProcessingLog_model_1.AIProcessingLog.create({
                provider: 'evon',
                modelName: evon_service_1.evonService.isConfigured ? 'gnani-evon-v3.3-30B' : 'rule-based-extractor',
                operation: 'incident_analysis',
                status: 'success',
                processingTimeMs,
            }).catch(() => { });
            (0, helpers_1.sendSuccess)(res, {
                ...result,
                _meta: {
                    engine: engineUsed,
                    processingTimeMs,
                    evonConfigured: evon_service_1.evonService.isConfigured,
                },
            });
        }
        catch (error) {
            await AIProcessingLog_model_1.AIProcessingLog.create({
                provider: 'evon',
                modelName: 'gnani-evon-v3.3-30B',
                operation: 'incident_analysis',
                status: error.name === 'TimeoutError' ? 'timeout' : 'error',
                processingTimeMs: 0,
                errorMessage: error.message,
            }).catch(() => { });
            next(error);
        }
    }
    // GET /api/ai/health
    async health(_req, res, next) {
        try {
            const [prisma, evon, timbre] = await Promise.allSettled([
                prisma_service_1.prismaService.healthCheck(),
                evon_service_1.evonService.healthCheck(),
                timbre_service_1.timbreService.healthCheck(),
            ]);
            const toResult = (r) => r.status === 'fulfilled' ? r.value : { status: 'unavailable', latencyMs: 0 };
            (0, helpers_1.sendSuccess)(res, {
                prisma: toResult(prisma),
                evon: toResult(evon),
                timbre: toResult(timbre),
                evonMode: evon_service_1.evonService.isConfigured ? 'live-inference' : 'rule-based-fallback',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AIController = AIController;
exports.aiController = new AIController();
//# sourceMappingURL=ai.controller.js.map