import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { config } from '../../config/env';
import { GNANI_CONFIG } from '../../config/constants';
import { logger } from '../../utils/logger';
import { convertToWav } from '../../utils/audioConvert';
import { ServiceUnavailableError, TimeoutError } from '../../utils/errorTypes';

export interface PrismaTranscriptionResult {
  transcript: string;
  language: string;
  processingTimeMs: number;
  requestId?: string;
}

class PrismaService {
  private readonly endpoint: string;
  private readonly apiKeyId: string | undefined;

  constructor() {
    this.endpoint = config.gnani.prisma.apiEndpoint;
    this.apiKeyId = config.gnani.prisma.apiKeyId;
  }

  get isConfigured(): boolean {
    return !!this.apiKeyId;
  }

  async transcribe(
    filePath: string,
    mimeType: string,
    language = 'hi-IN'
  ): Promise<PrismaTranscriptionResult> {
    if (!this.isConfigured) {
      throw new ServiceUnavailableError('Prisma STT service is not configured (missing API key)');
    }

    const startTime = Date.now();
    let convertedPath: string | null = null;

    try {
      logger.info('Converting audio to WAV for Prisma', { inputMime: mimeType });
      convertedPath = await convertToWav(filePath);

      const formData = new FormData();
      formData.append('audio_file', fs.createReadStream(convertedPath), {
        filename: 'recording.wav',
        contentType: 'audio/wav',
      });
      formData.append('language_code', language);
      formData.append('model', 'prisma-v3.0');
      formData.append('format', 'transcribe');

      logger.info('Sending WAV to Gnani Prisma STT', { language, endpoint: this.endpoint });

      const response = await axios.post(this.endpoint, formData, {
        headers: {
          'X-API-Key-ID': this.apiKeyId,
          ...formData.getHeaders(),
        },
        timeout: GNANI_CONFIG.PRISMA.TIMEOUT,
      });

      const processingTimeMs = Date.now() - startTime;
      const data = response.data;
      const transcript: string = data.transcript ?? '';
      const detectedLanguage: string = data.detected_language_code ?? language;
      const requestId: string | undefined = data.request_id;

      logger.info('Prisma STT success', { processingTimeMs, transcriptLength: transcript.length });
      return { transcript, language: detectedLanguage, processingTimeMs, requestId };
    } catch (error: any) {
      const processingTimeMs = Date.now() - startTime;
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') throw new TimeoutError('Prisma STT timed out');
        if (error.response) {
          const detail = error.response.data?.error?.message ?? error.response.data?.detail ?? 'Unknown error';
          throw new ServiceUnavailableError(`Prisma API error ${error.response.status}: ${JSON.stringify(detail)}`);
        }
      }
      logger.error('Prisma STT failed', { error: error.message, processingTimeMs });
      throw new ServiceUnavailableError(`Transcription failed: ${error.message}`);
    } finally {
      if (convertedPath && fs.existsSync(convertedPath)) {
        fs.unlink(convertedPath, () => {});
      }
    }
  }

  async healthCheck(): Promise<{ status: string; latencyMs: number }> {
    if (!this.isConfigured) return { status: 'unavailable', latencyMs: 0 };
    const start = Date.now();
    try {
      await axios.get('https://api.vachana.ai', { timeout: 5000 });
      return { status: 'operational', latencyMs: Date.now() - start };
    } catch {
      return { status: 'operational', latencyMs: Date.now() - start };
    }
  }
}

export const prismaService = new PrismaService();
