import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import { logger } from './logger';

/** Check if ffmpeg is available on this system */
function hasFfmpeg(): boolean {
  try {
    const result = spawnSync('ffmpeg', ['-version'], { timeout: 5000 });
    return result.status === 0;
  } catch {
    return false;
  }
}

const FFMPEG_AVAILABLE = hasFfmpeg();

if (!FFMPEG_AVAILABLE) {
  logger.warn('ffmpeg not found — audio will be sent as-is to Prisma (may affect quality)');
} else {
  logger.info('ffmpeg available — audio conversion enabled');
}

/**
 * Convert audio file to 16kHz mono WAV for Prisma STT.
 * Falls back to copying file as-is if ffmpeg unavailable.
 */
export function convertToWav(inputPath: string): Promise<string> {
  const outputPath = inputPath.replace(/\.[^.]+$/, '_converted.wav');

  if (!FFMPEG_AVAILABLE) {
    // No ffmpeg — just copy the file and hope Prisma accepts it
    fs.copyFileSync(inputPath, outputPath);
    return Promise.resolve(outputPath);
  }

  return new Promise((resolve, reject) => {
    const result = spawnSync('ffmpeg', [
      '-i', inputPath,
      '-ar', '16000',
      '-ac', '1',
      '-acodec', 'pcm_s16le',
      '-t', '28',
      '-f', 'wav',
      '-y',
      outputPath,
    ], { timeout: 30000 });

    if (result.status === 0) {
      resolve(outputPath);
    } else {
      const errMsg = result.stderr?.toString() ?? 'Unknown ffmpeg error';
      reject(new Error(`ffmpeg conversion failed: ${errMsg}`));
    }
  });
}
