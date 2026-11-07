"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeSchema = exports.speakSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../config/constants");
exports.speakSchema = zod_1.z.object({
    body: zod_1.z.object({
        text: zod_1.z.string().min(1).max(500).optional(),
        language: zod_1.z.enum(constants_1.SUPPORTED_LANGUAGES).optional(),
        voice: zod_1.z.string().optional(),
        incidentId: zod_1.z.string().optional(),
        category: zod_1.z.string().optional(),
        recommendedAction: zod_1.z.string().max(300).optional(),
    }).refine((data) => data.text || (data.incidentId && data.category), { message: 'Either text or incidentId+category is required' }),
});
exports.analyzeSchema = zod_1.z.object({
    body: zod_1.z.object({
        transcript: zod_1.z.string().min(5),
        language: zod_1.z.enum(constants_1.SUPPORTED_LANGUAGES).optional(),
    }),
});
//# sourceMappingURL=voice.validator.js.map