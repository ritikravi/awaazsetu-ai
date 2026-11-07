import { z } from 'zod';
import { INCIDENT_CATEGORIES, SEVERITY_LEVELS, INCIDENT_STATUSES } from '../config/constants';

export const createIncidentSchema = z.object({
  body: z.object({
    category: z.enum(INCIDENT_CATEGORIES),
    description: z.string().min(10).max(500),
    location: z.object({ name: z.string().min(1), verified: z.boolean().optional() }),
    severity: z.enum(SEVERITY_LEVELS),
    urgencyReason: z.string().min(5).max(300),
    recommendedAction: z.string().min(5).max(300),
    missingInformation: z.array(z.string()).optional(),
    originalTranscript: z.string().min(1),
    correctedTranscript: z.string().optional(),
    language: z.string().default('hi-IN'),
    confidence: z.number().min(0).max(1).optional(),
  }),
});

export const updateIncidentSchema = z.object({
  body: z.object({
    description: z.string().min(10).max(500).optional(),
    location: z.object({ name: z.string().min(1) }).optional(),
    category: z.enum(INCIDENT_CATEGORIES).optional(),
    severity: z.enum(SEVERITY_LEVELS).optional(),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(INCIDENT_STATUSES),
    notes: z.string().max(500).optional(),
  }),
});
