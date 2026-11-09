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
      const loc = (match[1] || match[0]).trim().replace(/^(?:ke|ki|ka|mein|par|in|at|on|near)\s+/i, '').trim();
      // Filter out non-location text (conjunctions, pronouns, short words)
      const invalidWords = /^(and|or|but|so|the|a|an|is|was|मैं|मेरे|हम|यह|वह|और|तो|जो|कि|हूं|हूँ|tha|hai|hoon)\b/i;
      if (loc.length >= 4 && loc.length <= 60 && !invalidWords.test(loc) && !/^\d+$/.test(loc)) {
        return { name: loc, verified: false };
      }
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

function extractDynamicCategory(transcript: string): { category: string; urgencyReason: string; recommendedAction: string; isValidComplaint: boolean } {
  const lower = transcript.toLowerCase();

  // Check if this is actually a problem/complaint
  const complaintWords = [
    // Infrastructure complaint words
    'problem','nahi hai','nahi chal','kharab','toot','jam','bhar','gir','leak',
    'complaint','shikayat','pareshani','dikkat','mushkil','band','broken','damaged',
    'nahi ata','nahi milta','fix','repair','समस्या','परेशानी','दिक्कत','टूट','खराब','शिकायत',
    // Harm/injury words — always a valid complaint
    'kata','kaata','bite','attack','hurt','chot lagi','ghav','injury','accident',
    'gir gaya','gir gayi','laga','lagi','dard','khoon','blood','pain',
    'काटा','चोट','घाव','दर्द','खून',
    // Action/report words
    'report','batana','bata raha','complaint karna','help','madad','koi sune',
    'dekhna chahiye','hona chahiye','sahi karo','thik karo','band karo',
  ];
  const hasComplaintIntent = complaintWords.some(kw => lower.includes(kw));

  if (!hasComplaintIntent) {
    return { category: 'Other', urgencyReason: 'The description does not clearly indicate an infrastructure problem', recommendedAction: 'Please describe the specific problem you want to report (e.g. road damage, water leakage, etc.)', isValidComplaint: false };
  }

  const dynamicMappings = [
    { patterns: ['street light','light nahi','lamp band','batti nahi','andhera','roshni nahi','light off','bulb fused'], category: 'Street Light Issue', urgency: 'Poor lighting poses safety risk at night', action: 'Contact municipality to repair/replace street lights' },
    { patterns: ['stray dog','awara kutta','dog bite','dog attack','awara janwar','kutta kata','kutta kaata','kutte ne kata','kutte ne kaata','cow on road','janwar ne kata','billi ne kata','animal bite','jaanwar'], category: 'Stray Animal Menace', urgency: 'Stray animals pose risk of bites and accidents', action: 'Contact municipal animal control department immediately. Go to nearest hospital for anti-rabies injection if bitten' },
    { patterns: ['tree fell','ped gira','tree gira','daali toot','pedo ko','tree blocking road','overgrown'], category: 'Tree/Vegetation Issue', urgency: 'Fallen tree can block road and cause accidents', action: 'Contact horticulture department for tree removal' },
    { patterns: ['footpath toot','pavement kharab','divider toot','railing gir','signboard missing','traffic signal band'], category: 'Traffic Infrastructure', urgency: 'Damaged traffic infrastructure causes accidents', action: 'Report to Traffic Police and municipal corporation' },
    { patterns: ['dhuan aa raha','smoke nahi','pollution ho raha','factory se dhuan','air quality','chemical smell','badbu'], category: 'Pollution Issue', urgency: 'Pollution affects public health', action: 'File complaint with State Pollution Control Board' },
    { patterns: ['transformer blast','bijli nahi aa rahi','power cut','load shedding','bijli band','no electricity'], category: 'Power Outage', urgency: 'Extended power outage affects essential services', action: 'Contact electricity distribution company helpline (1800-xxx-xxxx)' },
    { patterns: ['paani kharab','dirty water','paani mein smell','paani peene layak nahi','water contaminated'], category: 'Water Quality Issue', urgency: 'Contaminated water is a serious public health risk', action: 'Contact water supply department and get water tested immediately' },
    { patterns: ['park broken','jhula toot','bench toot','maidan mein','playground damaged'], category: 'Public Space Issue', urgency: 'Damaged public space poses safety risk to children', action: 'Report to parks department for immediate maintenance' },
    { patterns: ['mobile nahi chal','internet nahi','network nahi','tower problem','signal nahi'], category: 'Connectivity Issue', urgency: 'Poor connectivity affects communication and emergency services', action: 'Contact telecom provider or file complaint with TRAI' },
    { patterns: ['hospital band','doctor nahi','medicine nahi','dispensary closed','ambulance nahi','health center'], category: 'Healthcare Access Issue', urgency: 'Healthcare access issues affect public well-being', action: 'Contact District Medical Officer (CMO) or 108 helpline' },
  ];

  for (const mapping of dynamicMappings) {
    if (mapping.patterns.some(p => lower.includes(p))) {
      return { category: mapping.category, urgencyReason: mapping.urgency, recommendedAction: mapping.action, isValidComplaint: true };
    }
  }

  return { category: 'Other', urgencyReason: 'Citizen reported an issue requiring government attention', recommendedAction: 'Review complaint and forward to the appropriate government department', isValidComplaint: true };
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
  let isInvalidComplaint = false;

  if (bestMatch && bestScore >= 2) {
    category = bestMatch.category;
    urgencyReason = bestMatch.urgencyReason;
    recommendedAction = bestMatch.recommendedAction;
    finalSeverity = detectSeverity(lower, bestMatch.defaultSeverity);
  } else {
    const dynamic = extractDynamicCategory(transcript);
    category = dynamic.category;
    urgencyReason = dynamic.urgencyReason;
    recommendedAction = dynamic.recommendedAction;
    finalSeverity = detectSeverity(lower, 'Medium');
    isInvalidComplaint = !dynamic.isValidComplaint;
  }

  const missing = extractMissingInfo(transcript, category as IncidentCategory, location);
  if (isInvalidComplaint) {
    missing.push('Please describe the specific infrastructure problem (road, water, electricity, etc.)');
  }

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
  private readonly endpointType: 'openai' | 'huggingface' | 'none';

  constructor() {
    this.endpoint = config.gnani.evon.inferenceEndpoint;

    // Detect endpoint type from URL pattern
    if (!this.endpoint) {
      this.endpointType = 'none';
      logger.warn('Evon inference endpoint not configured — using rule-based extraction fallback');
    } else if (this.endpoint.includes('/v1/chat/completions') || this.endpoint.includes('/v1/completions')) {
      this.endpointType = 'openai';
      logger.info('Evon endpoint type: OpenAI-compatible (llama-server / vLLM)');
    } else {
      this.endpointType = 'huggingface';
      logger.info('Evon endpoint type: HuggingFace Inference API');
    }
  }

  get isConfigured(): boolean { return this.endpointType !== 'none'; }

  private buildSystemPrompt(): string {
    return `You are an AI assistant for AwaazSetu, a civic complaint platform for India's frontline workers. You understand Hindi, Hinglish, and English.

Your task: analyze the user's complaint transcript and output ONLY a valid JSON object. No extra text, no markdown.

Output schema:
{
  "category": "<Water Leakage|Road Damage|Electrical Hazard|Waste Management|Drainage Problem|Public Safety|Infrastructure Damage|Street Light Issue|Stray Animal Menace|Power Outage|Water Quality Issue|Traffic Infrastructure|Other>",
  "description": "<clear English summary of the problem, 20-300 chars>",
  "location": { "name": "<exact location mentioned, or Not specified>", "verified": false },
  "severity": "<Low|Medium|High|Critical>",
  "urgencyReason": "<1-2 sentences: why this severity level>",
  "recommendedAction": "<specific actionable step with department name>",
  "language": "<detected language code>",
  "missingInformation": ["<what info is missing for a complete report>"],
  "confidence": <0.0-1.0>
}

Rules:
- NEVER invent a location. If unclear, use "Not specified"
- Critical only if immediate danger to life
- confidence reflects how clearly the complaint was described
- recommendedAction must name the specific government department`;
  }

  private buildUserPrompt(transcript: string, language: string): string {
    return `Transcript: "${transcript}"\nDetected language: ${language}\n\nExtract the incident details and output JSON:`;
  }

  private async callOpenAI(transcript: string, language: string): Promise<string> {
    const response = await axios.post(
      this.endpoint!,
      {
        model: 'gnani-evon-v3.3',
        messages: [
          { role: 'system', content: this.buildSystemPrompt() },
          { role: 'user', content: this.buildUserPrompt(transcript, language) },
        ],
        temperature: GNANI_CONFIG.EVON.TEMPERATURE,
        max_tokens: GNANI_CONFIG.EVON.MAX_TOKENS,
      },
      {
        timeout: GNANI_CONFIG.EVON.TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true', // bypass ngrok browser warning page
        },
      }
    );

    const choice = response.data?.choices?.[0];
    // llama-server with reasoning model returns reasoning_content separately
    // The actual answer is in message.content
    const content: string = choice?.message?.content ?? choice?.text ?? '';
    const reasoning: string = choice?.message?.reasoning_content ?? '';

    // If content has JSON, use it. Otherwise check if reasoning has JSON (some models put it there)
    if (content.trim()) return content;
    if (reasoning.trim()) return reasoning;
    return '';
  }

  private async callHuggingFace(transcript: string, language: string): Promise<string> {
    const fullPrompt = `${this.buildSystemPrompt()}\n\n${this.buildUserPrompt(transcript, language)}`;
    const response = await axios.post(
      this.endpoint!,
      {
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: GNANI_CONFIG.EVON.MAX_TOKENS,
          temperature: GNANI_CONFIG.EVON.TEMPERATURE,
          return_full_text: false,
        },
      },
      { timeout: GNANI_CONFIG.EVON.TIMEOUT, headers: { 'Content-Type': 'application/json' } }
    );
    return response.data?.[0]?.generated_text ?? response.data?.generated_text ?? String(response.data ?? '');
  }

  async analyzeIncident(transcript: string, language: string): Promise<IncidentExtraction> {
    if (!this.isConfigured || !this.endpoint) {
      return runRuleBasedExtraction(transcript, language);
    }

    const startTime = Date.now();
    try {
      logger.info('Sending to Evon', { endpointType: this.endpointType, transcriptLength: transcript.length });

      let rawText: string;
      if (this.endpointType === 'openai') {
        rawText = await this.callOpenAI(transcript, language);
      } else {
        rawText = await this.callHuggingFace(transcript, language);
      }

      // Extract JSON from response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.error('No JSON found in Evon response', { rawText: rawText.substring(0, 200) });
        throw new Error('No valid JSON in Evon response');
      }

      const validated = IncidentExtractionSchema.parse(JSON.parse(jsonMatch[0]));
      logger.info('Evon inference success', {
        category: validated.category,
        severity: validated.severity,
        confidence: validated.confidence,
        processingTimeMs: Date.now() - startTime,
      });
      return validated;
    } catch (error: any) {
      logger.error('Evon inference failed', { error: error.message });

      if (error instanceof z.ZodError) {
        logger.error('Evon output failed schema validation', { errors: error.errors });
        return runRuleBasedExtraction(transcript, language);
      }
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') throw new TimeoutError('Evon inference timed out');
        // 404 means endpoint is misconfigured or ngrok tunnel expired — fall back gracefully
        if (error.response?.status === 404 || error.response?.status === 502 || error.response?.status === 503) {
          logger.warn('Evon endpoint unreachable, falling back to rule-based', { status: error.response?.status });
          return runRuleBasedExtraction(transcript, language);
        }
        throw new ServiceUnavailableError(`Evon API error: ${error.response?.status ?? 'unknown'}`);
      }
      throw new ServiceUnavailableError(`Incident analysis failed: ${error.message}`);
    }
  }

  async healthCheck(): Promise<{ status: string; latencyMs: number; mode: string }> {
    if (!this.isConfigured) return { status: 'rule-based', latencyMs: 0, mode: 'rule-based-fallback' };

    const start = Date.now();
    try {
      // Lightweight health check
      const healthUrl = this.endpoint!.replace('/v1/chat/completions', '/health').replace('/v1/completions', '/health');
      await axios.get(healthUrl, { timeout: 5000 }).catch(() =>
        // If no health endpoint, try a minimal inference
        axios.post(this.endpoint!, { inputs: 'hi', parameters: { max_new_tokens: 1 } }, { timeout: 8000 })
      );
      return { status: 'operational', latencyMs: Date.now() - start, mode: this.endpointType };
    } catch {
      return { status: 'unavailable', latencyMs: Date.now() - start, mode: this.endpointType };
    }
  }
}

export const evonService = new EvonService();
