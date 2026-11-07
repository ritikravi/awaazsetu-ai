import { z } from 'zod';
export declare const IncidentExtractionSchema: z.ZodObject<{
    category: z.ZodEnum<["Water Leakage", "Road Damage", "Electrical Hazard", "Waste Management", "Drainage Problem", "Public Safety", "Infrastructure Damage", "Other"]>;
    description: z.ZodString;
    location: z.ZodObject<{
        name: z.ZodString;
        verified: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        verified: boolean;
        name: string;
    }, {
        verified: boolean;
        name: string;
    }>;
    severity: z.ZodEnum<["Low", "Medium", "High", "Critical"]>;
    urgencyReason: z.ZodString;
    recommendedAction: z.ZodString;
    language: z.ZodString;
    missingInformation: z.ZodArray<z.ZodString, "many">;
    confidence: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    description: string;
    language: string;
    category: "Water Leakage" | "Road Damage" | "Electrical Hazard" | "Waste Management" | "Drainage Problem" | "Public Safety" | "Infrastructure Damage" | "Other";
    location: {
        verified: boolean;
        name: string;
    };
    severity: "Low" | "Medium" | "High" | "Critical";
    urgencyReason: string;
    recommendedAction: string;
    missingInformation: string[];
    confidence?: number | undefined;
}, {
    description: string;
    language: string;
    category: "Water Leakage" | "Road Damage" | "Electrical Hazard" | "Waste Management" | "Drainage Problem" | "Public Safety" | "Infrastructure Damage" | "Other";
    location: {
        verified: boolean;
        name: string;
    };
    severity: "Low" | "Medium" | "High" | "Critical";
    urgencyReason: string;
    recommendedAction: string;
    missingInformation: string[];
    confidence?: number | undefined;
}>;
export type IncidentExtraction = z.infer<typeof IncidentExtractionSchema>;
declare class EvonService {
    private readonly endpoint;
    constructor();
    get isConfigured(): boolean;
    private buildPrompt;
    analyzeIncident(transcript: string, language: string): Promise<IncidentExtraction>;
    healthCheck(): Promise<{
        status: string;
        latencyMs: number;
    }>;
}
export declare const evonService: EvonService;
export {};
//# sourceMappingURL=evon.service.d.ts.map