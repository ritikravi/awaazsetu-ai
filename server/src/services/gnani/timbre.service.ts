import axios from 'axios';
import { config } from '../../config/env';
import { GNANI_CONFIG } from '../../config/constants';
import { logger } from '../../utils/logger';
import { ServiceUnavailableError, TimeoutError } from '../../utils/errorTypes';

export interface TimbreSynthesisResult {
  audioBuffer: Buffer;
  mimeType: string;
  processingTimeMs: number;
}

const CATEGORY_HINDI: Record<string, string> = {
  'Water Leakage': 'पानी के रिसाव',
  'Road Damage': 'सड़क क्षति',
  'Electrical Hazard': 'बिजली के खतरे',
  'Waste Management': 'कचरा प्रबंधन',
  'Drainage Problem': 'जल निकासी की समस्या',
  'Public Safety': 'सार्वजनिक सुरक्षा',
  'Infrastructure Damage': 'बुनियादी ढांचे की क्षति',
  Other: 'अन्य समस्या',
};

export function buildConfirmationText(incident: { category: string; incidentId: string; language: string }): string {
  const categoryHindi = CATEGORY_HINDI[incident.category] ?? incident.category;
  if (incident.language === 'hi-IN') {
    return `आपकी ${categoryHindi} से जुड़ी शिकायत सफलतापूर्वक दर्ज कर ली गई है। शिकायत संख्या ${incident.incidentId} है। हमारी टीम जल्द ही इस पर कार्यवाही करेगी। धन्यवाद।`;
  }
  return `Your ${incident.category} complaint has been successfully registered. Incident ID is ${incident.incidentId}. Our team will take action soon. Thank you.`;
}

class TimbreService {
  private readonly endpoint: string;
  private readonly apiKeyId: string | undefined;

  constructor() {
    this.endpoint = config.gnani.timbre.apiEndpoint;
    this.apiKeyId = config.gnani.timbre.apiKeyId;
  }

  get isConfigured(): boolean {
    return !!this.apiKeyId;
  }

  private sanitizeText(text: string): string {
    return text.trim().replace(/[<>]/g, '').substring(0, GNANI_CONFIG.TIMBRE.MAX_TEXT_LENGTH);
  }

  async synthesize(
    text: string,
    language = GNANI_CONFIG.TIMBRE.DEFAULT_LANGUAGE,
    voice = GNANI_CONFIG.TIMBRE.DEFAULT_VOICE
  ): Promise<TimbreSynthesisResult> {
    if (!this.isConfigured) {
      throw new ServiceUnavailableError('Timbre TTS service is not configured (missing API key)');
    }

    const sanitizedText = this.sanitizeText(text);
    if (!sanitizedText) throw new Error('Text is empty after sanitization');

    const startTime = Date.now();

    try {
      logger.info('Sending text to Gnani Timbre TTS', {
        textLength: sanitizedText.length,
        language,
        voice,
      });

      const response = await axios.post(
        this.endpoint,
        {
          text: sanitizedText,
          voice,
          model: GNANI_CONFIG.TIMBRE.DEFAULT_MODEL,
          language,
        },
        {
          headers: {
            'X-API-Key-ID': this.apiKeyId,
            'Content-Type': 'application/json',
          },
          timeout: GNANI_CONFIG.TIMBRE.TIMEOUT,
          responseType: 'arraybuffer',
        }
      );

      const processingTimeMs = Date.now() - startTime;
      const audioBuffer = Buffer.from(response.data);

      logger.info('Timbre TTS success', { audioSize: audioBuffer.length, processingTimeMs });

      return { audioBuffer, mimeType: 'audio/mpeg', processingTimeMs };
    } catch (error: any) {
      logger.error('Timbre TTS failed', { error: error.message });

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') throw new TimeoutError('Timbre TTS timed out');
        throw new ServiceUnavailableError(`Timbre API error: ${error.response?.status ?? 'unknown'}`);
      }
      throw new ServiceUnavailableError(`Speech synthesis failed: ${error.message}`);
    }
  }

  async healthCheck(): Promise<{ status: string; latencyMs: number }> {
    if (!this.isConfigured) return { status: 'unavailable', latencyMs: 0 };
    const start = Date.now();
    try {
      await this.synthesize('परीक्षण');
      return { status: 'operational', latencyMs: Date.now() - start };
    } catch {
      return { status: 'unavailable', latencyMs: Date.now() - start };
    }
  }
}

export const timbreService = new TimbreService();
