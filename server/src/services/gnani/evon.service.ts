import axios from 'axios';
import { z } from 'zod';
import { config } from '../../config/env';
import { GNANI_CONFIG, INCIDENT_CATEGORIES, SEVERITY_LEVELS } from '../../config/constants';
import { logger } from '../../utils/logger';
import { ServiceUnavailableError, TimeoutError } from '../../utils/errorTypes';

export const IncidentExtractionSchema = z.object({
  category: z.enum(INCIDENT_CATEGORIES),
  description: z.string().min(10).max(500),
  location: z.object({
    name: z.string(),
    verified: z.boolean(),
  }),
  severity: z.enum(SEVERITY_LEVELS),
  urgencyReason: z.string().min(5).max(300),
  recommendedAction: z.string().min(5).max(300),
  language: z.string(),
  missingInformation: z.array(z.string()),
  confidence: z.number().min(0).max(1).optional(),
});

export type IncidentExtraction = z.infer<typeof IncidentExtractionSchema>;

class EvonService {
  private readonly endpoint: string | undefined;

  constructor() {
    this.endpoint = config.gnani.evon.inferenceEndpoint;
    if (!this.endpoint) {
      logger.warn('Evon inference endpoint not configured — AI analysis will be unavailable');
    }
  }

  get isConfigured(): boolean {
    return !!this.endpoint;
  }

  private buildPrompt(transcript: string, language: string): string {
    return `You are an AI assistant for AwaazSetu, a platform where India's frontline workers report infrastructure problems. Reports come in Hindi, Hinglish, or English.

Analyze the following transcript and output ONLY a valid JSON object — no extra text, no markdown fences.

Transcript: "${transcript}"
Detected Language: ${language}

Rules:
- NEVER invent a location not mentioned in the transcript
- If location is vague (e.g., "near road", "village"), set location.verified = false
- Only set severity "Critical" if there is immediate danger to life or property
- List what key details are missing for a complete report in missingInformation array
- confidence should reflect how clearly the transcript describes the incident (0.0–1.0)

Output this exact JSON structure:
{
  "category": "<one of: Water Leakage | Road Damage | Electrical Hazard | Waste Management | Drainage Problem | Public Safety | Infrastructure Damage | Other>",
  "description": "<clear English summary of the problem, 10-500 chars>",
  "location": {
    "name": "<location name from transcript or 'Not specified'>",
    "verified": false
  },
  "severity": "<Low | Medium | High | Critical>",
  "urgencyReason": "<why this severity was assigned>",
  "recommendedAction": "<what should be done next>",
  "language": "${language}",
  "missingInformation": ["<missing detail 1>", "<missing detail 2>"],
  "confidence": 0.85
}`;
  }

  async analyzeIncident(transcript: string, language: string): Promise<IncidentExtraction> {
    if (!this.isConfigured || !this.endpoint) {
      throw new ServiceUnavailableError('Evon reasoning service is not configured');
    }

    const startTime = Date.now();

    try {
      const prompt = this.buildPrompt(transcript, language);
      logger.info('Sending transcript to Evon v3.3', { transcriptLength: transcript.length, language });

      const response = await axios.post(
        this.endpoint,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: GNANI_CONFIG.EVON.MAX_TOKENS,
            temperature: GNANI_CONFIG.EVON.TEMPERATURE,
            return_full_text: false,
          },
        },
        {
          timeout: GNANI_CONFIG.EVON.TIMEOUT,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const processingTimeMs = Date.now() - startTime;

      // HF Inference API returns array or object
      const generatedText: string =
        response.data?.[0]?.generated_text ??
        response.data?.generated_text ??
        response.data ?? '';

      // Extract JSON block from response
      const jsonMatch = String(generatedText).match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Evon response');
      }

      const raw = JSON.parse(jsonMatch[0]);
      const validated = IncidentExtractionSchema.parse(raw);

      logger.info('Evon analysis success', {
        category: validated.category,
        severity: validated.severity,
        confidence: validated.confidence,
        processingTimeMs,
      });

      return validated;
    } catch (error: any) {
      logger.error('Evon analysis failed', { error: error.message });

      if (error instanceof z.ZodError) {
        throw new ServiceUnavailableError('Evon returned invalid incident structure');
      }
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') throw new TimeoutError('Evon inference timed out');
        throw new ServiceUnavailableError(`Evon API error: ${error.response?.status ?? 'unknown'}`);
      }
      throw new ServiceUnavailableError(`Incident analysis failed: ${error.message}`);
    }
  }

  async healthCheck(): Promise<{ status: string; latencyMs: number }> {
    if (!this.isConfigured) return { status: 'unavailable', latencyMs: 0 };
    const start = Date.now();
    try {
      await axios.post(
        this.endpoint!,
        { inputs: 'test', parameters: { max_new_tokens: 5 } },
        { timeout: 5000 }
      );
      return { status: 'operational', latencyMs: Date.now() - start };
    } catch {
      return { status: 'unavailable', latencyMs: Date.now() - start };
    }
  }
}

export const evonService = new EvonService();
