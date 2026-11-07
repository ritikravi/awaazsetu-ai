import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { config } from '../../config/env';
import { GNANI_CONFIG } from '../../config/constants';
import { logger } from '../../utils/logger';
import { ServiceUnavailableError, TimeoutError } from '../../utils/errorTypes';

export interface PrismaTranscriptionResult {
  transcript: string;
  language: string;
  processingTimeMs: number;
  requestId?: string;
}

/** Convert any browser audio (webm/ogg/etc.) to 16kHz mono WAV using ffmpeg, max 28 seconds */
function convertToWav(inputPath: string): Promise<string> {
  const outputPath = inputPath.replace(/\.[^.]+$/, '_converted.wav');
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFrequency(16000)
      .audioChannels(1)
      .audioCodec('pcm_s16le')
      .format('wav')
      .duration(28) // Trim to 28s — Prisma limit is 30s
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(new Error(`ffmpeg conversion failed: ${err.message}`)))
      .save(outputPath);
  });
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
      // Convert browser audio to 16kHz mono WAV for reliable Prisma compatibility
      logger.info('Converting audio to WAV for Prisma', { inputMime: mimeType, filePath });
      convertedPath = await convertToWav(filePath);
      logger.info('Audio converted to WAV', { convertedPath });

      const formData = new FormData();

      // Field names per Gnani API docs
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

      logger.info('Prisma raw response', { data });

      const transcript: string = data.transcript ?? '';
      const detectedLanguage: string = data.detected_language_code ?? language;
      const requestId: string | undefined = data.request_id;

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
          const detail =
            error.response.data?.error?.message ??
            error.response.data?.detail ??
            error.response.data?.message ??
            'Unknown error';
          throw new ServiceUnavailableError(`Prisma API error ${status}: ${JSON.stringify(detail)}`);
        }
      }
      throw new ServiceUnavailableError(`Transcription failed: ${error.message}`);
    } finally {
      // Clean up the converted WAV file
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
