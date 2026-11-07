import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        role: z.ZodOptional<z.ZodEnum<["citizen", "admin"]>>;
        preferredLanguage: z.ZodOptional<z.ZodEnum<["hi-IN", "en-IN"]>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        email: string;
        password: string;
        role?: "citizen" | "admin" | undefined;
        preferredLanguage?: "hi-IN" | "en-IN" | undefined;
    }, {
        name: string;
        email: string;
        password: string;
        role?: "citizen" | "admin" | undefined;
        preferredLanguage?: "hi-IN" | "en-IN" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        email: string;
        password: string;
        role?: "citizen" | "admin" | undefined;
        preferredLanguage?: "hi-IN" | "en-IN" | undefined;
    };
}, {
    body: {
        name: string;
        email: string;
        password: string;
        role?: "citizen" | "admin" | undefined;
        preferredLanguage?: "hi-IN" | "en-IN" | undefined;
    };
}>;
export declare const loginSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        password: string;
    }, {
        email: string;
        password: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
        password: string;
    };
}, {
    body: {
        email: string;
        password: string;
    };
}>;
//# sourceMappingURL=auth.validator.d.ts.map