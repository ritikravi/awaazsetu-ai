import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { config } from '../../config/env';
import { GNANI_CONFIG } from '../../config/constants';
import { logger } from '../../utils/logger';
import { ServiceUnavailableError, TimeoutError } from '../../utils/errorTypes';

// Gnani Prisma supports: WAV, MP3, OGG, FLAC, AAC, M4A
// Browser records webm — we send it as ogg (same codec, Prisma accepts it)
const SUPPORTED_MIME_TYPES: Record<string, string> = {
  'audio/wav':  'audio/wav',
  'audio/mp3':  'audio/mp3',
  'audio/mpeg': 'audio/mp3',
  'audio/ogg':  'audio/ogg',
  'audio/webm': 'audio/ogg',  // webm/opus → send as ogg
  'audio/flac': 'audio/flac',
  'audio/aac':  'audio/aac',
  'audio/mp4':  'audio/mp4',
  'audio/m4a':  'audio/m4a',
  'audio/x-m4a':'audio/m4a',
};

const MIME_TO_EXT: Record<string, string> = {
  'audio/wav':  'wav',
  'audio/mp3':  'mp3',
  'audio/mpeg': 'mp3',
  'audio/ogg':  'ogg',
  'audio/webm': 'ogg',
  'audio/flac': 'flac',
  'audio/aac':  'aac',
  'audio/mp4':  'mp4',
  'audio/m4a':  'm4a',
  'audio/x-m4a':'m4a',
};

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

    const resolvedMime = SUPPORTED_MIME_TYPES[mimeType] ?? SUPPORTED_MIME_TYPES['audio/ogg'];
    const ext = MIME_TO_EXT[mimeType] ?? 'ogg';
    const startTime = Date.now();

    try {
      const formData = new FormData();

      // Field name is 'audio_file' per Gnani docs
      formData.append('audio_file', fs.createReadStream(filePath), {
        filename: `recording.${ext}`,
        contentType: resolvedMime,
      });

      // Field name is 'language_code' per Gnani docs
      formData.append('language_code', language);

      // Use prisma-v3.0 for multi-language support
      formData.append('model', 'prisma-v3.0');

      // ITN for better output formatting
      formData.append('format', 'transcribe');

      logger.info('Sending audio to Gnani Prisma STT', {
        mimeType: resolvedMime,
        ext,
        language,
        endpoint: this.endpoint,
      });

      const response = await axios.post(this.endpoint, formData, {
        headers: {
          'X-API-Key-ID': this.apiKeyId,
          ...formData.getHeaders(),
        },
        timeout: GNANI_CONFIG.PRISMA.TIMEOUT,
      });

      const processingTimeMs = Date.now() - startTime;
      const data = response.data;

      logger.info('Prisma raw response', { data });

      const transcript: string = data.transcript ?? data.text ?? '';
      const detectedLanguage: string =
        data.detected_language_code ?? data.language ?? language;
      const requestId: string | undefined = data.request_id ?? data.requestId;

      logger.info('Prisma STT success', {
        processingTimeMs,
        transcriptLength: transcript.length,
        requestId,
        detectedLanguage,
      });

      return { transcript, language: detectedLanguage, processingTimeMs, requestId };
    } catch (error: any) {
      const processingTimeMs = Date.now() - startTime;
      logger.error('Prisma STT failed', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        processingTimeMs,
      });

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') throw new TimeoutError('Prisma STT timed out');
        if (error.response) {
          const status = error.response.status;
          const detail = error.response.data?.detail ?? error.response.data?.message ?? 'Unknown error';
          throw new ServiceUnavailableError(`Prisma API error ${status}: ${JSON.stringify(detail)}`);
        }
      }
      throw new ServiceUnavailableError(`Transcription failed: ${error.message}`);
    }
  }

  async healthCheck(): Promise<{ status: string; latencyMs: number }> {
    if (!this.isConfigured) return { status: 'unavailable', latencyMs: 0 };
    // Simple connectivity check — just verify the endpoint responds
    const start = Date.now();
    try {
      await axios.get('https://api.vachana.ai', { timeout: 5000 });
      return { status: 'operational', latencyMs: Date.now() - start };
    } catch {
      // If we get any response (even 404/401) the service is reachable
      return { status: 'operational', latencyMs: Date.now() - start };
    }
  }
}

export const prismaService = new PrismaService();
