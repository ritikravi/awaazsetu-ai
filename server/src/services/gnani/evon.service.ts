import axios from 'axios';
import { z } from 'zod';
import { config } from '../../config/env';
import { GNANI_CONFIG, INCIDENT_CATEGORIES, SEVERITY_LEVELS } from '../../config/constants';
import { logger } from '../../utils/logger';
import { ServiceUnavailableError, TimeoutError } from '../../utils/errorTypes';

export const IncidentExtractionSchema = z.object({
  category: z.string().min(2).max(50), // Allow dynamic categories beyond the 8 fixed ones
  description: z.string().min(5).max(500),
  location: z.object({ name: z.string(), verified: z.boolean() }),
  severity: z.enum(SEVERITY_LEVELS),
  urgencyReason: z.string().min(5).max(300),
  recommendedAction: z.string().min(5).max(300),
  language: z.string(),
  missingInformation: z.array(z.string()),
  confidence: z.number().min(0).max(1).optional(),
});

export type IncidentExtraction = z.infer<typeof IncidentExtractionSchema>;

type IncidentCategory = typeof INCIDENT_CATEGORIES[number];
type SeverityLevel = typeof SEVERITY_LEVELS[number];

interface CategoryRule {
  strongKeywords: string[];
  keywords: string[];
  category: IncidentCategory;
  defaultSeverity: SeverityLevel;
  urgencyReason: string;
  recommendedAction: string;
}

// Strong keywords = 3 points, regular = 1 point
// Score < 2 = no confident match → defaults to "Other"
const CATEGORY_RULES: CategoryRule[] = [
  {
    strongKeywords: ['pipeline','पाइपलाइन','paani ka leakage','water pipe','नल टूट','nal toot','water supply','paani supply'],
    keywords: ['पानी','paani','water','pipe','पाइप','रिसाव','leak','बह रहा','flooding','बाढ़','नल','nal','paani bah'],
    category: 'Water Leakage',
    defaultSeverity: 'High',
    urgencyReason: 'Water leakage causes road damage and public health risk',
    recommendedAction: 'Contact water department for urgent pipeline inspection and repair',
  },
  {
    strongKeywords: ['road broken','road toot','sadak toot','pothole','gaddha','gadda','road kharab','sarak kharab','road repair','sadak kharab hai','rasta toot','sadak toot gayi'],
    keywords: ['सड़क','sadak','road','गड्ढा','टूट गई','highway','NH','राजमार्ग','rasta','damaged road','bad road','sarak'],
    category: 'Road Damage',
    defaultSeverity: 'Medium',
    urgencyReason: 'Road damage poses risk to vehicles and pedestrians',
    recommendedAction: 'Report to PWD (Public Works Department) for road repair',
  },
  {
    strongKeywords: ['bijli ka taar','live wire','bijli giri','electric shock','transformer blast','pole gira','khamba gira','taar toot','bijli taar'],
    keywords: ['बिजली','bijli','electric','wire','तार','shock','current','pole','खंभा','voltage','short circuit'],
    category: 'Electrical Hazard',
    defaultSeverity: 'Critical',
    urgencyReason: 'Electrical hazards pose immediate risk to human life',
    recommendedAction: 'Contact electricity board immediately and cordon off the area',
  },
  {
    strongKeywords: ['kachra nahi utha','garbage collection','kuda nahi utha','waste disposal','dustbin full','safai nahi hui','safai nahi ho rahi'],
    keywords: ['कचरा','kachra','garbage','waste','गंदगी','dustbin','trash','कूड़ा','kuda','gandagi'],
    category: 'Waste Management',
    defaultSeverity: 'Medium',
    urgencyReason: 'Waste accumulation causes hygiene issues and disease risk',
    recommendedAction: 'Schedule garbage collection and increase sanitation visits',
  },
  {
    strongKeywords: ['nala jam','naala jam','drainage block','sewage overflow','paani bhar gaya','waterlogging','jal bhar gaya','naali jam'],
    keywords: ['नाला','nala','drain','drainage','blocked','जाम','overflow','sewage','सीवर','जलभराव','sewer','naali'],
    category: 'Drainage Problem',
    defaultSeverity: 'High',
    urgencyReason: 'Blocked drainage causes flooding and health hazards',
    recommendedAction: 'Clear drainage blockage and clean the nalas',
  },
  {
    strongKeywords: ['loot','robbery','assault','danga','riot','crime ho raha','police bulao','emergency','chor pakdo'],
    keywords: ['safety','सुरक्षा','अपराध','चोरी','दुर्घटना','fight','झगड़ा','police','पुलिस','danger','theft','chor'],
    category: 'Public Safety',
    defaultSeverity: 'High',
    urgencyReason: 'Public safety incident requires immediate attention',
    recommendedAction: 'Contact local police or emergency services immediately',
  },
  {
    strongKeywords: ['bridge toot','pul toot','building collapse','wall collapse','deewar giri','structure damage','pul kharab','imarat giri'],
    keywords: ['bridge','पुल','building','इमारत','collapse','गिर','wall','दीवार','structure','crack','pul','imarat'],
    category: 'Infrastructure Damage',
    defaultSeverity: 'High',
    urgencyReason: 'Infrastructure damage poses safety risk to public',
    recommendedAction: 'Report to municipal corporation for structural assessment',
  },
];

// ─── Helper functions ─────────────────────────────────────────────────────────

function detectSeverity(lower: string, defaultSeverity: SeverityLevel): SeverityLevel {
  if (/(?:jaan ka khatra|life risk|immediate danger|aag lagi|blast|gir gaya|maut|death|मौत|critical|emergency|turant|jaan jaane)/i.test(lower)) return 'Critical';
  if (/(?:bahut bada|very big|serious|major|accident|injury|chot|khoon|blood|bahut zyada|weeks?|hafte se|mahine se)/i.test(lower)) return 'High';
  if (/(?:chhota sa|small|minor|thoda|slight|kabhi kabhi|occasionally)/i.test(lower)) return 'Low';
  return defaultSeverity;
}

function buildDescription(transcript: string, category: IncidentCategory): string {
  const sentences = transcript.split(/[।.!?\n]+/).map((s) => s.trim()).filter((s) => s.length > 10);
  const problemKw = ['problem','broken','kharab','toot','jam','leak','bah','gir','damaged','खराब','टूट','समस्या','परेशानी'];
  const best = sentences.find((s) => problemKw.some((kw) => s.toLowerCase().includes(kw))) ?? sentences[0] ?? transcript;
  let desc = best.trim();
  if (desc.length > 250) {
    const cut = desc.lastIndexOf(' ', 250);
    desc = desc.substring(0, cut > 100 ? cut : 250) + '...';
  }
  if (desc.length < 15) desc = `${category} incident reported by user`;
  return desc;
}

function extractLocationFromText(text: string): { name: string; verified: boolean } {
  const patterns = [
    /(?:sector|sec)\s*[-]?\s*\d+[A-Z]?/i,
    /(?:ward|block|phase)\s*[-]?\s*\d+/i,
    /NH\s*[-]?\s*\d+/i,
    /([A-Za-z\u0900-\u097F]{2,20}(?:\s+[A-Za-z\u0900-\u097F]{2,20}){0,3})\s+(?:colony|nagar|vihar|mohalla|basti|मोहल्ला|नगर|बस्ती|कॉलोनी)/i,
    /([A-Za-z\u0900-\u097F]{2,20}(?:\s+[A-Za-z\u0900-\u097F]{2,20}){0,2})\s+(?:road|marg|sadak|sarak|lane|gali|रोड|मार्ग|सड़क|गली)/i,
    /(?:village|gaon|gram|गाँव|गांव|ग्राम)\s+([A-Za-z\u0900-\u097F]{2,25})/i,
    /([A-Za-z\u0900-\u097F]{2,25}(?:\s+[A-Za-z\u0900-\u097F]{2,20})?)\s+(?:ke\s+(?:paas|samne|nazdeek|peeche)|पास|सामने|नज़दीक)/i,
    /(?:near|at|in|on|beside)\s+([A-Za-z\u0900-\u097F][A-Za-z\u0900-\u097F\s]{2,30}?)(?:\s*[,।.\n]|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const loc = (match[1] || match[0]).trim().replace(/^(?:ke|ki|ka|mein|par|in|at|on|near)\s+/i, '');
      if (loc.length >= 3 && loc.length <= 60) return { name: loc, verified: false };
    }
  }
  return { name: 'Not specified', verified: false };
}

function extractMissingInfo(text: string, category: IncidentCategory, location: { name: string }): string[] {
  const missing: string[] = [];
  const lower = text.toLowerCase();
  if (location.name === 'Not specified') missing.push('Exact location or landmark');
  if (category === 'Water Leakage' && !lower.match(/(?:pipe|नल|पाइप|main|connection|line)/i)) missing.push('Type of pipeline (main line or connection)');
  if (category === 'Road Damage' && !lower.match(/(?:\d+|NH|highway|main|bypass)/i)) missing.push('Road name or number');
  if (category === 'Electrical Hazard' && !lower.match(/(?:pole|तार|wire|transformer)/i)) missing.push('Type of electrical hazard (wire, pole, transformer)');
  if (!lower.match(/(?:कब|when|since|से|दिन|day|week|हफ्ते|month|महीने|hours?|घंटे)/i)) missing.push('How long has this problem existed');
  return missing;
}

function extractDynamicCategory(transcript: string): { category: string; urgencyReason: string; recommendedAction: string } {
  const lower = transcript.toLowerCase();

  // Map common problem types to friendly category names
  const dynamicMappings = [
    { patterns: ['street light','light nahi','bulb fused','lamp post','street lamp','lights off','batti nahi'], category: 'Street Light Issue', urgency: 'Poor lighting poses safety risk at night', action: 'Contact municipality to repair/replace street lights' },
    { patterns: ['tree fell','ped gir','tree gir','branches','daali toot','jungle','overgrown'], category: 'Tree/Vegetation Issue', urgency: 'Fallen trees or overgrown vegetation can block roads and cause accidents', action: 'Contact horticulture department for tree removal or trimming' },
    { patterns: ['stray dog','awara kutta','dog bite','dog attack','animal','janwar','cow','suar'], category: 'Stray Animal Menace', urgency: 'Stray animals pose risk of bites and accidents', action: 'Contact municipal animal control department' },
    { patterns: ['park','garden','bagh','ground','playground','khel maidan','maidan'], category: 'Public Space Issue', urgency: 'Poor maintenance of public spaces affects community well-being', action: 'Report to parks department for maintenance' },
    { patterns: ['noise','shor','pollution','dhuan','smoke','factory','air quality'], category: 'Pollution Issue', urgency: 'Pollution affects public health and environment', action: 'File complaint with Pollution Control Board' },
    { patterns: ['hospital','clinic','doctor','medicine','health','beemar','dawai'], category: 'Healthcare Issue', urgency: 'Healthcare access issues affect public well-being', action: 'Contact district health officer or CMO' },
    { patterns: ['school','college','teacher','education','students','padhai'], category: 'Education Issue', urgency: 'Education quality issues affect student development', action: 'Contact district education officer' },
    { patterns: ['footpath','pavement','divider','railing','signboard','traffic light','signal'], category: 'Traffic Infrastructure', urgency: 'Traffic infrastructure damage can cause accidents', action: 'Report to traffic department or municipality' },
    { patterns: ['mobile network','internet','signal nahi','tower','connectivity','network problem'], category: 'Connectivity Issue', urgency: 'Poor connectivity affects communication and emergency services', action: 'Contact telecom provider or TRAI for connectivity issues' },
    { patterns: ['ration','food','pds','anaj','ration card','distribution'], category: 'Public Distribution Issue', urgency: 'Food distribution issues affect vulnerable populations', action: 'Contact district food supply officer or PDS office' },
  ];

  for (const mapping of dynamicMappings) {
    if (mapping.patterns.some(p => lower.includes(p))) {
      return { category: mapping.category, urgencyReason: mapping.urgency, recommendedAction: mapping.action };
    }
  }

  // Fallback — extract a noun phrase from the transcript as the category
  const words = transcript.split(/\s+/).filter(w => w.length > 3);
  const categoryName = words.slice(0, 3).join(' ').substring(0, 30) || 'Other Issue';
  return {
    category: categoryName,
    urgencyReason: 'Citizen reported an issue requiring attention',
    recommendedAction: 'Review and forward to appropriate government department',
  };
}

function runRuleBasedExtraction(transcript: string, language: string): IncidentExtraction {
  const lower = transcript.toLowerCase();
  let bestMatch: CategoryRule | null = null;
  let bestScore = 0;

  for (const rule of CATEGORY_RULES) {
    const strong = rule.strongKeywords.filter((kw) => lower.includes(kw.toLowerCase())).length * 3;
    const normal = rule.keywords.filter((kw) => lower.includes(kw.toLowerCase())).length;
    const score = strong + normal;
    if (score > bestScore) { bestScore = score; bestMatch = rule; }
  }

  const description = buildDescription(transcript, 'Other');
  const location = extractLocationFromText(transcript);
  const severity = detectSeverity(lower, 'Medium');
  const confidence = Math.min(0.4 + bestScore * 0.08, 0.88);

  // Use matched rule if confident, otherwise use dynamic category extraction
  let category: string;
  let urgencyReason: string;
  let recommendedAction: string;
  let finalSeverity: SeverityLevel;

  if (bestMatch && bestScore >= 2) {
    category = bestMatch.category;
    urgencyReason = bestMatch.urgencyReason;
    recommendedAction = bestMatch.recommendedAction;
    finalSeverity = detectSeverity(lower, bestMatch.defaultSeverity);
  } else {
    // No standard category matched — dynamically detect
    const dynamic = extractDynamicCategory(transcript);
    category = dynamic.category;
    urgencyReason = dynamic.urgencyReason;
    recommendedAction = dynamic.recommendedAction;
    finalSeverity = detectSeverity(lower, 'Medium');
  }

  const missing = extractMissingInfo(transcript, category as IncidentCategory, location);

  logger.info('Rule-based extraction', { category, severity: finalSeverity, score: bestScore, confidence });

  return {
    category: (category as IncidentCategory) ?? 'Other',
    description,
    location,
    severity: finalSeverity,
    urgencyReason,
    recommendedAction,
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
    if (!this.endpoint) logger.warn('Evon inference endpoint not configured — using rule-based extraction fallback');
  }

  get isConfigured(): boolean { return !!this.endpoint; }

  private buildPrompt(transcript: string, language: string): string {
    return `You are an AI assistant for AwaazSetu, a platform where India's frontline workers report infrastructure problems. Reports come in Hindi, Hinglish, or English.

Analyze the following transcript and output ONLY a valid JSON object — no extra text, no markdown fences.

Transcript: "${transcript}"
Detected Language: ${language}

Output this exact JSON:
{
  "category": "<Water Leakage|Road Damage|Electrical Hazard|Waste Management|Drainage Problem|Public Safety|Infrastructure Damage|Other>",
  "description": "<clear English summary, 10-500 chars>",
  "location": { "name": "<location or Not specified>", "verified": false },
  "severity": "<Low|Medium|High|Critical>",
  "urgencyReason": "<why this severity>",
  "recommendedAction": "<what should be done>",
  "language": "${language}",
  "missingInformation": [],
  "confidence": 0.85
}`;
  }

  async analyzeIncident(transcript: string, language: string): Promise<IncidentExtraction> {
    if (!this.isConfigured || !this.endpoint) {
      return runRuleBasedExtraction(transcript, language);
    }
    const startTime = Date.now();
    try {
      const response = await axios.post(this.endpoint, {
        inputs: this.buildPrompt(transcript, language),
        parameters: { max_new_tokens: GNANI_CONFIG.EVON.MAX_TOKENS, temperature: GNANI_CONFIG.EVON.TEMPERATURE, return_full_text: false },
      }, { timeout: GNANI_CONFIG.EVON.TIMEOUT, headers: { 'Content-Type': 'application/json' } });

      const text: string = response.data?.[0]?.generated_text ?? response.data?.generated_text ?? String(response.data ?? '');
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No valid JSON in Evon response');

      const validated = IncidentExtractionSchema.parse(JSON.parse(jsonMatch[0]));
      logger.info('Evon analysis success', { category: validated.category, processingTimeMs: Date.now() - startTime });
      return validated;
    } catch (error: any) {
      logger.error('Evon failed, falling back to rule-based', { error: error.message });
      if (error instanceof z.ZodError) return runRuleBasedExtraction(transcript, language);
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
      await axios.post(this.endpoint!, { inputs: 'test', parameters: { max_new_tokens: 5 } }, { timeout: 5000 });
      return { status: 'operational', latencyMs: Date.now() - start };
    } catch {
      return { status: 'unavailable', latencyMs: Date.now() - start };
    }
  }
}

export const evonService = new EvonService();
