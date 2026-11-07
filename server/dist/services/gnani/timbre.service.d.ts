export interface TimbreSynthesisResult {
    audioBuffer: Buffer;
    mimeType: string;
    processingTimeMs: number;
}
export declare function buildConfirmationText(incident: {
    category: string;
    incidentId: string;
    language: string;
}): string;
declare class TimbreService {
    private readonly endpoint;
    private readonly apiKeyId;
    constructor();
    get isConfigured(): boolean;
    private sanitizeText;
    synthesize(text: string, language?: string, voice?: string): Promise<TimbreSynthesisResult>;
    healthCheck(): Promise<{
        status: string;
        latencyMs: number;
    }>;
}
export declare const timbreService: TimbreService;
export {};
//# sourceMappingURL=timbre.service.d.ts.map