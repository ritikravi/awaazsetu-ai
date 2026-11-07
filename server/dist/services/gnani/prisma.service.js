"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaService = void 0;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const fs_1 = __importDefault(require("fs"));
const env_1 = require("../../config/env");
const constants_1 = require("../../config/constants");
const logger_1 = require("../../utils/logger");
const audioConvert_1 = require("../../utils/audioConvert");
const errorTypes_1 = require("../../utils/errorTypes");
class PrismaService {
    constructor() {
        this.endpoint = env_1.config.gnani.prisma.apiEndpoint;
        this.apiKeyId = env_1.config.gnani.prisma.apiKeyId;
    }
    get isConfigured() {
        return !!this.apiKeyId;
    }
    async transcribe(filePath, mimeType, language = 'hi-IN') {
        if (!this.isConfigured) {
            throw new errorTypes_1.ServiceUnavailableError('Prisma STT service is not configured (missing API key)');
        }
        const startTime = Date.now();
        let convertedPath = null;
        try {
            logger_1.logger.info('Converting audio to WAV for Prisma', { inputMime: mimeType });
            convertedPath = await (0, audioConvert_1.convertToWav)(filePath);
            const formData = new form_data_1.default();
            formData.append('audio_file', fs_1.default.createReadStream(convertedPath), {
                filename: 'recording.wav',
                contentType: 'audio/wav',
            });
            formData.append('language_code', language);
            formData.append('model', 'prisma-v3.0');
            formData.append('format', 'transcribe');
            logger_1.logger.info('Sending WAV to Gnani Prisma STT', { language, endpoint: this.endpoint });
            const response = await axios_1.default.post(this.endpoint, formData, {
                headers: {
                    'X-API-Key-ID': this.apiKeyId,
                    ...formData.getHeaders(),
                },
                timeout: constants_1.GNANI_CONFIG.PRISMA.TIMEOUT,
            });
            const processingTimeMs = Date.now() - startTime;
            const data = response.data;
            const transcript = data.transcript ?? '';
            const detectedLanguage = data.detected_language_code ?? language;
            const requestId = data.request_id;
            logger_1.logger.info('Prisma STT success', { processingTimeMs, transcriptLength: transcript.length });
            return { transcript, language: detectedLanguage, processingTimeMs, requestId };
        }
        catch (error) {
            const processingTimeMs = Date.now() - startTime;
            if (axios_1.default.isAxiosError(error)) {
                if (error.code === 'ECONNABORTED')
                    throw new errorTypes_1.TimeoutError('Prisma STT timed out');
                if (error.response) {
                    const detail = error.response.data?.error?.message ?? error.response.data?.detail ?? 'Unknown error';
                    throw new errorTypes_1.ServiceUnavailableError(`Prisma API error ${error.response.status}: ${JSON.stringify(detail)}`);
                }
            }
            logger_1.logger.error('Prisma STT failed', { error: error.message, processingTimeMs });
            throw new errorTypes_1.ServiceUnavailableError(`Transcription failed: ${error.message}`);
        }
        finally {
            if (convertedPath && fs_1.default.existsSync(convertedPath)) {
                fs_1.default.unlink(convertedPath, () => { });
            }
        }
    }
    async healthCheck() {
        if (!this.isConfigured)
            return { status: 'unavailable', latencyMs: 0 };
        const start = Date.now();
        try {
            await axios_1.default.get('https://api.vachana.ai', { timeout: 5000 });
            return { status: 'operational', latencyMs: Date.now() - start };
        }
        catch {
            return { status: 'operational', latencyMs: Date.now() - start };
        }
    }
}
exports.prismaService = new PrismaService();
//# sourceMappingURL=prisma.service.js.map