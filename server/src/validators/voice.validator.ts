import { z } from 'zod';
import { SUPPORTED_LANGUAGES } from '../config/constants';

export const speakSchema = z.object({
  body: z.object({
    text: z.string().min(1).max(500),
    language: z.enum(SUPPORTED_LANGUAGES).optional(),
    voice: z.string().optional(),
    incidentId: z.string().optional(),
    category: z.string().optional(),
  }),
});

export const analyzeSchema = z.object({
  body: z.object({
    transcript: z.string().min(5),
    language: z.enum(SUPPORTED_LANGUAGES).optional(),
  }),
});
