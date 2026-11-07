"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToWav = convertToWav;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("./logger");
/** Check if ffmpeg is available on this system */
function hasFfmpeg() {
    try {
        const result = (0, child_process_1.spawnSync)('ffmpeg', ['-version'], { timeout: 5000 });
        return result.status === 0;
    }
    catch {
        return false;
    }
}
const FFMPEG_AVAILABLE = hasFfmpeg();
if (!FFMPEG_AVAILABLE) {
    logger_1.logger.warn('ffmpeg not found — audio will be sent as-is to Prisma (may affect quality)');
}
else {
    logger_1.logger.info('ffmpeg available — audio conversion enabled');
}
/**
 * Convert audio file to 16kHz mono WAV for Prisma STT.
 * Falls back to copying file as-is if ffmpeg unavailable.
 */
function convertToWav(inputPath) {
    const outputPath = inputPath.replace(/\.[^.]+$/, '_converted.wav');
    if (!FFMPEG_AVAILABLE) {
        // No ffmpeg — just copy the file and hope Prisma accepts it
        fs_1.default.copyFileSync(inputPath, outputPath);
        return Promise.resolve(outputPath);
    }
    return new Promise((resolve, reject) => {
        const result = (0, child_process_1.spawnSync)('ffmpeg', [
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
        }
        else {
            const errMsg = result.stderr?.toString() ?? 'Unknown ffmpeg error';
            reject(new Error(`ffmpeg conversion failed: ${errMsg}`));
        }
    });
}
//# sourceMappingURL=audioConvert.js.map