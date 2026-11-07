"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatusSchema = exports.updateIncidentSchema = exports.createIncidentSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../config/constants");
exports.createIncidentSchema = zod_1.z.object({
    body: zod_1.z.object({
        category: zod_1.z.string().min(2).max(50), // Allow dynamic categories
        description: zod_1.z.string().min(10).max(500),
        location: zod_1.z.object({ name: zod_1.z.string().min(1), verified: zod_1.z.boolean().optional() }),
        severity: zod_1.z.enum(constants_1.SEVERITY_LEVELS),
        urgencyReason: zod_1.z.string().min(5).max(300),
        recommendedAction: zod_1.z.string().min(5).max(300),
        missingInformation: zod_1.z.array(zod_1.z.string()).optional(),
        originalTranscript: zod_1.z.string().min(1),
        correctedTranscript: zod_1.z.string().optional(),
        language: zod_1.z.string().default('hi-IN'),
        confidence: zod_1.z.number().min(0).max(1).optional(),
    }),
});
exports.updateIncidentSchema = zod_1.z.object({
    body: zod_1.z.object({
        description: zod_1.z.string().min(10).max(500).optional(),
        location: zod_1.z.object({ name: zod_1.z.string().min(1) }).optional(),
        category: zod_1.z.string().min(2).max(50).optional(), // Allow dynamic categories
        severity: zod_1.z.enum(constants_1.SEVERITY_LEVELS).optional(),
    }),
});
exports.updateStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(constants_1.INCIDENT_STATUSES),
        notes: zod_1.z.string().max(500).optional(),
    }),
});
//# sourceMappingURL=incident.validator.js.map