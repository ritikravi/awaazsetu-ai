export interface PrismaTranscriptionResult {
    transcript: string;
    language: string;
    processingTimeMs: number;
    requestId?: string;
}
declare class PrismaService {
    private readonly endpoint;
    private readonly apiKeyId;
    constructor();
    get isConfigured(): boolean;
    transcribe(filePath: string, mimeType: string, language?: string): Promise<PrismaTranscriptionResult>;
    healthCheck(): Promise<{
        status: string;
        latencyMs: number;
    }>;
}
export declare const prismaService: PrismaService;
export {};
//# sourceMappingURL=prisma.service.d.ts.map