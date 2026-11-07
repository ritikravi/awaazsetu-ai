import { z } from 'zod';
export declare const speakSchema: z.ZodObject<{
    body: z.ZodEffects<z.ZodObject<{
        text: z.ZodOptional<z.ZodString>;
        language: z.ZodOptional<z.ZodEnum<["hi-IN", "en-IN"]>>;
        voice: z.ZodOptional<z.ZodString>;
        incidentId: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        text?: string | undefined;
        language?: "hi-IN" | "en-IN" | undefined;
        incidentId?: string | undefined;
        voice?: string | undefined;
        category?: string | undefined;
    }, {
        text?: string | undefined;
        language?: "hi-IN" | "en-IN" | undefined;
        incidentId?: string | undefined;
        voice?: string | undefined;
        category?: string | undefined;
    }>, {
        text?: string | undefined;
        language?: "hi-IN" | "en-IN" | undefined;
        incidentId?: string | undefined;
        voice?: string | undefined;
        category?: string | undefined;
    }, {
        text?: string | undefined;
        language?: "hi-IN" | "en-IN" | undefined;
        incidentId?: string | undefined;
        voice?: string | undefined;
        category?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        text?: string | undefined;
        language?: "hi-IN" | "en-IN" | undefined;
        incidentId?: string | undefined;
        voice?: string | undefined;
        category?: string | undefined;
    };
}, {
    body: {
        text?: string | undefined;
        language?: "hi-IN" | "en-IN" | undefined;
        incidentId?: string | undefined;
        voice?: string | undefined;
        category?: string | undefined;
    };
}>;
export declare const analyzeSchema: z.ZodObject<{
    body: z.ZodObject<{
        transcript: z.ZodString;
        language: z.ZodOptional<z.ZodEnum<["hi-IN", "en-IN"]>>;
    }, "strip", z.ZodTypeAny, {
        transcript: string;
        language?: "hi-IN" | "en-IN" | undefined;
    }, {
        transcript: string;
        language?: "hi-IN" | "en-IN" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        transcript: string;
        language?: "hi-IN" | "en-IN" | undefined;
    };
}, {
    body: {
        transcript: string;
        language?: "hi-IN" | "en-IN" | undefined;
    };
}>;
//# sourceMappingURL=voice.validator.d.ts.map