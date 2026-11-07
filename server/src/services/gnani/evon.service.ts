import axios from 'axios';
import { z } from 'zod';
import { config } from '../../config/env';
import { GNANI_CONFIG, INCIDENT_CATEGORIES, SEVERITY_LEVELS } from '../../config/constants';
import { logger } from '../../utils/logger';
import { ServiceUnavailableError, TimeoutError } from '../../utils/errorTypes';

export const IncidentExtractionSchema = z.object({
  category: z.enum(INCIDENT_CATEGORIES),
  description: z.string().min(5).max(500),
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

// ─── Rule-based fallback extractor ───────────────────────────────────────────
// Used when Evon inference endpoint is not configured.
// Provides genuine keyword-based extraction (not fake data).
type IncidentCategory = typeof INCIDENT_CATEGORIES[number];
type SeverityLevel = typeof SEVERITY_LEVELS[number];

interface CategoryRule {
  keywords: string[];
  category: IncidentCategory;
  defaultSeverity: SeverityLevel;
  urgencyReason: string;
  recommendedAction: string;
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    keywords: ['पानी','paani','water','pipe','pipeline','पाइप','रिसाव','leak','बह','flood','बाढ़','नल','nal'],
    category: 'Water Leakage',
    defaultSeverity: 'High',
    urgencyReason: 'Water leakage causes road damage and public health risk',
    recommendedAction: 'Contact water department for urgent pipeline inspection and repair',
  },
  {
    keywords: ['सड़क','sadak','road','गड्ढा','pothole','टूट','damage','crack','highway','NH','राजमार्ग'],
    category: 'Road Damage',
    defaultSeverity: 'Medium',
    urgencyReason: 'Road damage poses risk to vehicles and pedestrians',
    recommendedAction: 'Report to PWD (Public Works Department) for road repair',
  },
  {
    keywords: ['बिजली','bijli','electric','wire','तार','shock','current','pole','खंभा','hazard','खतरा'],
    category: 'Electrical Hazard',
    defaultSeverity: 'Critical',
    urgencyReason: 'Electrical hazards pose immediate risk to human life',
    recommendedAction: 'Contact electricity board immediately and cordon off the area',
  },
  {
    keywords: ['कचरा','kachra','garbage','waste','गंदगी','dustbin','साफ','clean','trash','sewage'],
    category: 'Waste Management',
    defaultSeverity: 'Medium',
    urgencyReason: 'Waste accumulation causes hygiene issues and disease risk',
    recommendedAction: 'Schedule garbage collection and increase sanitation visits',
  },
  {
    keywords: ['नाला','nala','drain','drainage','blocked','जाम','overflow','sewage','सीवर','waterlog','जलभराव'],
    category: 'Drainage Problem',
    defaultSeverity: 'High',
    urgencyReason: 'Blocked drainage causes flooding and health hazards',
    recommendedAction: 'Clear drainage blockage and clean the nalas',
  },
  {
    keywords: ['safety','सुरक्षा','crime','अपराध','theft','चोरी','accident','दुर्घटना','fight','झगड़ा','police','पुलिस'],
    category: 'Public Safety',
    defaultSeverity: 'High',
    urgencyReason: 'Public safety incident requires immediate attention',
    recommendedAction: 'Contact local police or emergency services immediately',
  },
  {
    keywords: ['bridge','पुल','building','इमारत','collapse','गिर','wall','दीवार','structure','crack','टूट','damage'],
    category: 'Infrastructure Damage',
    defaultSeverity: 'High',
    urgencyReason: 'Infrastructure damage poses safety risk to public',
    recommendedAction: 'Report to municipal corporation for structural assessment',
  },
];

function extractLocationFromText(text: string): { name: string; verified: boolean } {
  // Look for location indicators in Hindi and English
  const locationPatterns = [
    /(?:near|के पास|पर|में|at|in)\s+([A-Za-z\u0900-\u097F\s]{3,30}?)(?:\s*[,।.]|$)/gi,
    /([A-Za-z\u0900-\u097F]+\s+(?:road|sarak|sadak|nagar|colony|ward|sector|chowk|bazaar|mandi|gali|village|gaon|gram))/gi,
    /(?:sector|ward|area|block|phase)\s*[-]?\s*\d+/gi,
    /NH[-]?\d+/gi,
  ];

  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match?.[0] && match[0].trim().length > 3) {
      return { name: match[0].trim(), verified: false };
    }
  }

  return { name: 'Not specified', verified: false };
}

function extractMissingInfo(text: string, category: IncidentCategory): string[] {
  const missing: string[] = [];
  const lower = text.toLowerCase();

  if (!lower.match(/(?:sector|ward|colony|nagar|road|gali|gaon|village|near|पास|में|पर)/i)) {
    missing.push('Exact location or landmark');
  }
  if (category === 'Water Leakage' && !lower.match(/(?:pipe|नल|पाइप|main|connection)/i)) {
    missing.push('Type of pipeline (main line or connection)');
  }
  if (category === 'Road Damage' && !lower.match(/(?:\d+|NH|highway|main|bypass)/i)) {
    missing.push('Road name or highway number');
  }
  if (!lower.match(/(?:कब|when|since|से|पहले|दिन|day|week|हफ्ते|month|महीने)/i)) {
    missing.push('How long has this problem existed');
  }

  return missing;
}

function runRuleBasedExtraction(transcript: string, language: string): IncidentExtraction {
  const lower = transcript.toLowerCase();

  // Find best matching category
  let bestMatch: CategoryRule | null = null;
  let bestScore = 0;

  for (const rule of CATEGORY_RULES) {
    const score = rule.keywords.filter((kw) => lower.includes(kw.toLowerCase())).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = rule;
    }
  }

  const matched = bestMatch ?? { ...CATEGORY_RULES[7], category: 'Other' as IncidentCategory }; // default Other

  // Build a clean description — limit to 200 chars, trim to sentence boundary
  let description = transcript.trim();
  if (description.length > 200) {
    // Try to cut at a natural boundary
    const cutAt = description.lastIndexOf(' ', 200);
    description = description.substring(0, cutAt > 100 ? cutAt : 200) + '...';
  }
  if (description.length < 15) {
    description = `${matched.category} incident reported`;
  }

  const location = extractLocationFromText(transcript);
  const missing = extractMissingInfo(transcript, matched.category);

  // Confidence based on keyword match strength
  const confidence = Math.min(0.5 + bestScore * 0.1, 0.85);

  logger.info('Rule-based extraction used (Evon not configured)', {
    category: matched.category,
    severity: matched.defaultSeverity,
    keywordsMatched: bestScore,
    confidence,
  });

  return {
    category: matched.category,
    description,
    location,
    severity: matched.defaultSeverity,
    urgencyReason: matched.urgencyReason,
    recommendedAction: matched.recommendedAction,
    language,
    missingInformation: missing,
    confidence,
  };
}
// ─────────────────────────────────────────────────────────────────────────────

class EvonService {
  private readonly endpoint: string | undefined;

  constructor() {
    this.endpoint = config.gnani.evon.inferenceEndpoint;
    if (!this.endpoint) {
      logger.warn(
        'Evon inference endpoint not configured — using rule-based extraction fallback'
      );
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
  "location": { "name": "<location from transcript or Not specified>", "verified": false },
  "severity": "<Low | Medium | High | Critical>",
  "urgencyReason": "<why this severity was assigned>",
  "recommendedAction": "<what should be done next>",
  "language": "${language}",
  "missingInformation": ["<missing detail 1>"],
  "confidence": 0.85
}`;
  }

  async analyzeIncident(transcript: string, language: string): Promise<IncidentExtraction> {
    // If no Evon endpoint, use rule-based extraction
    if (!this.isConfigured || !this.endpoint) {
      return runRuleBasedExtraction(transcript, language);
    }

    const startTime = Date.now();
    try {
      const prompt = this.buildPrompt(transcript, language);
      logger.info('Sending transcript to Evon v3.3', {
        transcriptLength: transcript.length,
        language,
      });

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
      const generatedText: string =
        response.data?.[0]?.generated_text ??
        response.data?.generated_text ??
        String(response.data ?? '');

      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No valid JSON found in Evon response');

      const validated = IncidentExtractionSchema.parse(JSON.parse(jsonMatch[0]));

      logger.info('Evon analysis success', {
        category: validated.category,
        severity: validated.severity,
        processingTimeMs,
      });

      return validated;
    } catch (error: any) {
      logger.error('Evon analysis failed, falling back to rule-based', { error: error.message });

      if (error instanceof z.ZodError) {
        // Evon returned invalid JSON — fall back
        return runRuleBasedExtraction(transcript, language);
      }
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') throw new TimeoutError('Evon inference timed out');
        throw new ServiceUnavailableError(`Evon API error: ${error.response?.status ?? 'unknown'}`);
      }
      throw new ServiceUnavailableError(`Incident analysis failed: ${error.message}`);
    }
  }

  async healthCheck(): Promise<{ status: string; latencyMs: number }> {
    if (!this.isConfigured) return { status: 'rule-based', latencyMs: 0 };
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
