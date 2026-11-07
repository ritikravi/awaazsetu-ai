import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { config } from '../../config/env';
import { GNANI_CONFIG, SUPPORTED_AUDIO_FORMATS } from '../../config/constants';
import { logger } from '../../utils/logger';
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
    language?: string
  ): Promise<PrismaTranscriptionResult> {
    if (!this.isConfigured) {
      throw new ServiceUnavailableError('Prisma STT service is not configured (missing API key)');
    }

    if (!SUPPORTED_AUDIO_FORMATS.includes(mimeType as any)) {
      throw new Error(`Unsupported audio format: ${mimeType}`);
    }

    const startTime = Date.now();

    try {
      const formData = new FormData();
      formData.append('audio_file', fs.createReadStream(filePath), {
        contentType: mimeType,
      });
      if (language) {
        formData.append('language', language);
      }

      logger.info('Sending audio to Gnani Prisma STT', { mimeType, language });

      const response = await axios.post(this.endpoint, formData, {
        headers: {
          'X-API-Key-ID': this.apiKeyId,
          ...formData.getHeaders(),
        },
        timeout: GNANI_CONFIG.PRISMA.TIMEOUT,
      });

      const processingTimeMs = Date.now() - startTime;
      const data = response.data;

      // Adapt to actual Gnani API response shape
      const transcript: string =
        data.transcript ?? data.text ?? data.result ?? '';
      const detectedLanguage: string =
        data.language ?? language ?? 'hi-IN';
      const requestId: string | undefined =
        data.request_id ?? data.requestId;

      logger.info('Prisma STT success', { processingTimeMs, transcriptLength: transcript.length, requestId });

      return { transcript, language: detectedLanguage, processingTimeMs, requestId };
    } catch (error: any) {
      const processingTimeMs = Date.now() - startTime;
      logger.error('Prisma STT failed', { error: error.message, processingTimeMs });

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') throw new TimeoutError('Prisma STT timed out');
        if (error.response) {
          throw new ServiceUnavailableError(
            `Prisma API error ${error.response.status}: ${error.response.data?.message ?? 'Unknown error'}`
          );
        }
      }
      throw new ServiceUnavailableError(`Transcription failed: ${error.message}`);
    }
  }

  async healthCheck(): Promise<{ status: string; latencyMs: number }> {
    if (!this.isConfigured) return { status: 'unavailable', latencyMs: 0 };
    const start = Date.now();
    try {
      await axios.get(`${this.endpoint}/health`, {
        headers: { 'X-API-Key-ID': this.apiKeyId },
        timeout: 5000,
      });
      return { status: 'operational', latencyMs: Date.now() - start };
    } catch {
      return { status: 'unavailable', latencyMs: Date.now() - start };
    }
  }
}

export const prismaService = new PrismaService();
