import { z } from 'zod';
import { SUPPORTED_LANGUAGES } from '../config/constants';

export const speakSchema = z.object({
  body: z.object({
    text: z.string().min(1).max(500).optional(),
    language: z.enum(SUPPORTED_LANGUAGES).optional(),
    voice: z.string().optional(),
    incidentId: z.string().optional(),
    category: z.string().optional(),
    recommendedAction: z.string().max(300).optional(),
  }).refine(
    (data) => data.text || (data.incidentId && data.category),
    { message: 'Either text or incidentId+category is required' }
  ),
});

export const analyzeSchema = z.object({
  body: z.object({
    transcript: z.string().min(5),
    language: z.enum(SUPPORTED_LANGUAGES).optional(),
  }),
});
