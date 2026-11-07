/**
 * Convert audio file to 16kHz mono WAV for Prisma STT.
 * Falls back to copying file as-is if ffmpeg unavailable.
 */
export declare function convertToWav(inputPath: string): Promise<string>;
//# sourceMappingURL=audioConvert.d.ts.map