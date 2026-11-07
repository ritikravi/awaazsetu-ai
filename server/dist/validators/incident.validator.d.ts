import { z } from 'zod';
export declare const createIncidentSchema: z.ZodObject<{
    body: z.ZodObject<{
        category: z.ZodString;
        description: z.ZodString;
        location: z.ZodObject<{
            name: z.ZodString;
            verified: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            verified?: boolean | undefined;
        }, {
            name: string;
            verified?: boolean | undefined;
        }>;
        severity: z.ZodEnum<["Low", "Medium", "High", "Critical"]>;
        urgencyReason: z.ZodString;
        recommendedAction: z.ZodString;
        missingInformation: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        originalTranscript: z.ZodString;
        correctedTranscript: z.ZodOptional<z.ZodString>;
        language: z.ZodDefault<z.ZodString>;
        confidence: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        language: string;
        category: string;
        recommendedAction: string;
        location: {
            name: string;
            verified?: boolean | undefined;
        };
        severity: "Low" | "Medium" | "High" | "Critical";
        urgencyReason: string;
        originalTranscript: string;
        missingInformation?: string[] | undefined;
        confidence?: number | undefined;
        correctedTranscript?: string | undefined;
    }, {
        description: string;
        category: string;
        recommendedAction: string;
        location: {
            name: string;
            verified?: boolean | undefined;
        };
        severity: "Low" | "Medium" | "High" | "Critical";
        urgencyReason: string;
        originalTranscript: string;
        language?: string | undefined;
        missingInformation?: string[] | undefined;
        confidence?: number | undefined;
        correctedTranscript?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        description: string;
        language: string;
        category: string;
        recommendedAction: string;
        location: {
            name: string;
            verified?: boolean | undefined;
        };
        severity: "Low" | "Medium" | "High" | "Critical";
        urgencyReason: string;
        originalTranscript: string;
        missingInformation?: string[] | undefined;
        confidence?: number | undefined;
        correctedTranscript?: string | undefined;
    };
}, {
    body: {
        description: string;
        category: string;
        recommendedAction: string;
        location: {
            name: string;
            verified?: boolean | undefined;
        };
        severity: "Low" | "Medium" | "High" | "Critical";
        urgencyReason: string;
        originalTranscript: string;
        language?: string | undefined;
        missingInformation?: string[] | undefined;
        confidence?: number | undefined;
        correctedTranscript?: string | undefined;
    };
}>;
export declare const updateIncidentSchema: z.ZodObject<{
    body: z.ZodObject<{
        description: z.ZodOptional<z.ZodString>;
        location: z.ZodOptional<z.ZodObject<{
            name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
        }, {
            name: string;
        }>>;
        category: z.ZodOptional<z.ZodString>;
        severity: z.ZodOptional<z.ZodEnum<["Low", "Medium", "High", "Critical"]>>;
    }, "strip", z.ZodTypeAny, {
        description?: string | undefined;
        category?: string | undefined;
        location?: {
            name: string;
        } | undefined;
        severity?: "Low" | "Medium" | "High" | "Critical" | undefined;
    }, {
        description?: string | undefined;
        category?: string | undefined;
        location?: {
            name: string;
        } | undefined;
        severity?: "Low" | "Medium" | "High" | "Critical" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        description?: string | undefined;
        category?: string | undefined;
        location?: {
            name: string;
        } | undefined;
        severity?: "Low" | "Medium" | "High" | "Critical" | undefined;
    };
}, {
    body: {
        description?: string | undefined;
        category?: string | undefined;
        location?: {
            name: string;
        } | undefined;
        severity?: "Low" | "Medium" | "High" | "Critical" | undefined;
    };
}>;
export declare const updateStatusSchema: z.ZodObject<{
    body: z.ZodObject<{
        status: z.ZodEnum<["Submitted", "Under Review", "Assigned", "In Progress", "Resolved", "Rejected"]>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "Submitted" | "Under Review" | "Assigned" | "In Progress" | "Resolved" | "Rejected";
        notes?: string | undefined;
    }, {
        status: "Submitted" | "Under Review" | "Assigned" | "In Progress" | "Resolved" | "Rejected";
        notes?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        status: "Submitted" | "Under Review" | "Assigned" | "In Progress" | "Resolved" | "Rejected";
        notes?: string | undefined;
    };
}, {
    body: {
        status: "Submitted" | "Under Review" | "Assigned" | "In Progress" | "Resolved" | "Rejected";
        notes?: string | undefined;
    };
}>;
//# sourceMappingURL=incident.validator.d.ts.map