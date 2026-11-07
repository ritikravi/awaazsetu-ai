"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.timbreService = void 0;
exports.buildConfirmationText = buildConfirmationText;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../../config/env");
const constants_1 = require("../../config/constants");
const logger_1 = require("../../utils/logger");
const errorTypes_1 = require("../../utils/errorTypes");
const CATEGORY_HINDI = {
    'Water Leakage': 'पानी के रिसाव',
    'Road Damage': 'सड़क क्षति',
    'Electrical Hazard': 'बिजली के खतरे',
    'Waste Management': 'कचरा प्रबंधन',
    'Drainage Problem': 'जल निकासी की समस्या',
    'Public Safety': 'सार्वजनिक सुरक्षा',
    'Infrastructure Damage': 'बुनियादी ढांचे की क्षति',
    Other: 'अन्य समस्या',
};
function buildConfirmationText(incident) {
    const categoryHindi = CATEGORY_HINDI[incident.category] ?? incident.category;
    if (incident.language === 'hi-IN') {
        const base = `आपकी ${categoryHindi} से जुड़ी शिकायत सफलतापूर्वक दर्ज कर ली गई है। शिकायत संख्या ${incident.incidentId} है।`;
        const solution = incident.recommendedAction
            ? ` अनुशंसित कार्यवाही: ${incident.recommendedAction}`
            : ' हमारी टीम जल्द ही इस पर कार्यवाही करेगी।';
        return base + solution + ' धन्यवाद।';
    }
    const base = `Your ${incident.category} complaint has been successfully registered. Incident ID is ${incident.incidentId}.`;
    const solution = incident.recommendedAction
        ? ` Recommended action: ${incident.recommendedAction}`
        : ' Our team will take action soon.';
    return base + solution + ' Thank you.';
}
class TimbreService {
    constructor() {
        this.endpoint = env_1.config.gnani.timbre.apiEndpoint;
        this.apiKeyId = env_1.config.gnani.timbre.apiKeyId;
    }
    get isConfigured() {
        return !!this.apiKeyId;
    }
    sanitizeText(text) {
        return text.trim().replace(/[<>]/g, '').substring(0, constants_1.GNANI_CONFIG.TIMBRE.MAX_TEXT_LENGTH);
    }
    async synthesize(text, language = constants_1.GNANI_CONFIG.TIMBRE.DEFAULT_LANGUAGE, voice = constants_1.GNANI_CONFIG.TIMBRE.DEFAULT_VOICE) {
        if (!this.isConfigured) {
            throw new errorTypes_1.ServiceUnavailableError('Timbre TTS service is not configured (missing API key)');
        }
        const sanitizedText = this.sanitizeText(text);
        if (!sanitizedText)
            throw new Error('Text is empty after sanitization');
        const startTime = Date.now();
        try {
            logger_1.logger.info('Sending text to Gnani Timbre TTS', {
                textLength: sanitizedText.length,
                language,
                voice,
                endpoint: this.endpoint,
            });
            // Request body per Gnani TTS docs
            const requestBody = {
                text: sanitizedText,
                model: constants_1.GNANI_CONFIG.TIMBRE.DEFAULT_MODEL,
                voice,
                language,
                audio_config: {
                    encoding: 'linear_pcm',
                    container: 'mp3',
                    sample_rate: 22050,
                    num_channels: 1,
                    sample_width: 2,
                },
            };
            logger_1.logger.info('Timbre request body', { requestBody: { ...requestBody, text: sanitizedText.substring(0, 50) } });
            const response = await axios_1.default.post(this.endpoint, requestBody, {
                headers: {
                    'X-API-Key-ID': this.apiKeyId,
                    'Content-Type': 'application/json',
                },
                timeout: constants_1.GNANI_CONFIG.TIMBRE.TIMEOUT,
                responseType: 'arraybuffer',
            });
            const processingTimeMs = Date.now() - startTime;
            const audioBuffer = Buffer.from(response.data);
            logger_1.logger.info('Timbre TTS success', {
                audioSize: audioBuffer.length,
                processingTimeMs,
                contentType: response.headers['content-type'],
            });
            return { audioBuffer, mimeType: 'audio/mpeg', processingTimeMs };
        }
        catch (error) {
            const processingTimeMs = Date.now() - startTime;
            // Log the full error response for debugging
            if (axios_1.default.isAxiosError(error) && error.response) {
                const errData = error.response.data;
                // arraybuffer error response — convert to string
                const errText = errData instanceof Buffer
                    ? errData.toString('utf8')
                    : typeof errData === 'object'
                        ? JSON.stringify(errData)
                        : String(errData);
                logger_1.logger.error('Timbre TTS failed', {
                    status: error.response.status,
                    error: errText,
                    processingTimeMs,
                });
                if (error.code === 'ECONNABORTED')
                    throw new errorTypes_1.TimeoutError('Timbre TTS timed out');
                throw new errorTypes_1.ServiceUnavailableError(`Timbre API error ${error.response.status}: ${errText}`);
            }
            logger_1.logger.error('Timbre TTS failed', { error: error.message, processingTimeMs });
            throw new errorTypes_1.ServiceUnavailableError(`Speech synthesis failed: ${error.message}`);
        }
    }
    async healthCheck() {
        if (!this.isConfigured)
            return { status: 'unavailable', latencyMs: 0 };
        const start = Date.now();
        try {
            await this.synthesize('परीक्षण');
            return { status: 'operational', latencyMs: Date.now() - start };
        }
        catch {
            return { status: 'unavailable', latencyMs: Date.now() - start };
        }
    }
}
exports.timbreService = new TimbreService();
//# sourceMappingURL=timbre.service.js.map