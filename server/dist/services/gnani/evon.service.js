"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evonService = exports.IncidentExtractionSchema = void 0;
const axios_1 = __importDefault(require("axios"));
const zod_1 = require("zod");
const env_1 = require("../../config/env");
const constants_1 = require("../../config/constants");
const logger_1 = require("../../utils/logger");
const errorTypes_1 = require("../../utils/errorTypes");
exports.IncidentExtractionSchema = zod_1.z.object({
    category: zod_1.z.enum(constants_1.INCIDENT_CATEGORIES),
    description: zod_1.z.string().min(5).max(500),
    location: zod_1.z.object({
        name: zod_1.z.string(),
        verified: zod_1.z.boolean(),
    }),
    severity: zod_1.z.enum(constants_1.SEVERITY_LEVELS),
    urgencyReason: zod_1.z.string().min(5).max(300),
    recommendedAction: zod_1.z.string().min(5).max(300),
    language: zod_1.z.string(),
    missingInformation: zod_1.z.array(zod_1.z.string()),
    confidence: zod_1.z.number().min(0).max(1).optional(),
});
const CATEGORY_RULES = [
    {
        keywords: ['पानी', 'paani', 'water', 'pipe', 'pipeline', 'पाइप', 'रिसाव', 'leak', 'बह', 'flood', 'बाढ़', 'नल', 'nal'],
        category: 'Water Leakage',
        defaultSeverity: 'High',
        urgencyReason: 'Water leakage causes road damage and public health risk',
        recommendedAction: 'Contact water department for urgent pipeline inspection and repair',
    },
    {
        keywords: ['सड़क', 'sadak', 'road', 'गड्ढा', 'pothole', 'टूट', 'damage', 'crack', 'highway', 'NH', 'राजमार्ग'],
        category: 'Road Damage',
        defaultSeverity: 'Medium',
        urgencyReason: 'Road damage poses risk to vehicles and pedestrians',
        recommendedAction: 'Report to PWD (Public Works Department) for road repair',
    },
    {
        keywords: ['बिजली', 'bijli', 'electric', 'wire', 'तार', 'shock', 'current', 'pole', 'खंभा', 'hazard', 'खतरा'],
        category: 'Electrical Hazard',
        defaultSeverity: 'Critical',
        urgencyReason: 'Electrical hazards pose immediate risk to human life',
        recommendedAction: 'Contact electricity board immediately and cordon off the area',
    },
    {
        keywords: ['कचरा', 'kachra', 'garbage', 'waste', 'गंदगी', 'dustbin', 'साफ', 'clean', 'trash', 'sewage'],
        category: 'Waste Management',
        defaultSeverity: 'Medium',
        urgencyReason: 'Waste accumulation causes hygiene issues and disease risk',
        recommendedAction: 'Schedule garbage collection and increase sanitation visits',
    },
    {
        keywords: ['नाला', 'nala', 'drain', 'drainage', 'blocked', 'जाम', 'overflow', 'sewage', 'सीवर', 'waterlog', 'जलभराव'],
        category: 'Drainage Problem',
        defaultSeverity: 'High',
        urgencyReason: 'Blocked drainage causes flooding and health hazards',
        recommendedAction: 'Clear drainage blockage and clean the nalas',
    },
    {
        keywords: ['safety', 'सुरक्षा', 'crime', 'अपराध', 'theft', 'चोरी', 'accident', 'दुर्घटना', 'fight', 'झगड़ा', 'police', 'पुलिस'],
        category: 'Public Safety',
        defaultSeverity: 'High',
        urgencyReason: 'Public safety incident requires immediate attention',
        recommendedAction: 'Contact local police or emergency services immediately',
    },
    {
        keywords: ['bridge', 'पुल', 'building', 'इमारत', 'collapse', 'गिर', 'wall', 'दीवार', 'structure', 'crack', 'टूट', 'damage'],
        category: 'Infrastructure Damage',
        defaultSeverity: 'High',
        urgencyReason: 'Infrastructure damage poses safety risk to public',
        recommendedAction: 'Report to municipal corporation for structural assessment',
    },
];
function extractLocationFromText(text) {
    // Pattern 1: Location BEFORE ke paas/ke samne etc — most common Hindi pattern
    const hindiLocationPhrases = [
        /([A-Za-z\u0900-\u097F]{2,25}(?:\s+[A-Za-z\u0900-\u097F]{2,20})?)\s+(?:ke\s+(?:paas|samne|nazdeek|peeche|aage|baad|niche)|ke\s+(?:पास|सामने|नज़दीक|पीछे|आगे)|पर|में|मोड़|चौराहे)/i,
        /(?:near|at|in|on|beside|outside|front\s+of|behind)\s+([A-Za-z\u0900-\u097F][A-Za-z\u0900-\u097F\s]{2,30}?)(?:\s*[,।.\n]|$)/i,
    ];
    // Pattern 2: Named locations — Sector X, Ward X, NH-X, Block X
    const namedPatterns = [
        /(?:sector|sec)\s*[-]?\s*\d+[A-Z]?/i,
        /(?:ward|block|phase)\s*[-]?\s*\d+/i,
        /NH\s*[-]?\s*\d+/i,
        /plot\s*(?:no\.?\s*)?\d+/i,
    ];
    // Pattern 3: Colony/Area/Mohalla names (Hindi + English)
    const areaPattern = /([A-Za-z\u0900-\u097F]{2,20}(?:\s+[A-Za-z\u0900-\u097F]{2,20}){0,3})\s+(?:colony|nagar|vihar|enclave|layout|nagaram|mohalla|mohallah|basti|मोहल्ला|नगर|बस्ती|कॉलोनी|विहार)/i;
    // Pattern 4: Road/Street names
    const roadPattern = /([A-Za-z\u0900-\u097F]{2,20}(?:\s+[A-Za-z\u0900-\u097F]{2,20}){0,2})\s+(?:road|street|marg|path|sadak|sarak|lane|gali|gallee|रोड|मार्ग|सड़क|गली)/i;
    // Pattern 5: Landmark with "wala/wali" (very common in Hindi speech)
    const landmarkPattern = /([A-Za-z\u0900-\u097F]{2,20}(?:\s+[A-Za-z\u0900-\u097F]{2,15})?)\s+(?:wala|wali|waale|waali|वाला|वाली|वाले)/i;
    // Pattern 6: Village/Town names
    const villagePattern = /(?:village|gaon|gram|गाँव|गांव|ग्राम)\s+([A-Za-z\u0900-\u097F]{2,25})/i;
    // Pattern 7: "Hamare ghar ke paas", "Meri gali mein" etc — extract what follows
    const relativePattern = /(?:hamare|mere|apne|hamari|meri|apni|humare)\s+(?:ghar|gali|mohalle|area|colony|sector|ward|plot)\s+(?:ke?\s+)?(?:paas|samne|mein|mein|par|ka|ki|ke)?\s*([A-Za-z\u0900-\u097F][A-Za-z\u0900-\u097F\s]{2,25}?)(?:\s*[,।.\n]|$)/i;
    const allPatterns = [
        ...namedPatterns,
        areaPattern,
        roadPattern,
        villagePattern,
        landmarkPattern,
        ...hindiLocationPhrases,
        relativePattern,
    ];
    for (const pattern of allPatterns) {
        const match = text.match(pattern);
        if (match) {
            // Get the most specific group
            const location = (match[1] || match[0]).trim().replace(/^(?:ke|ki|ka|mein|par|in|at|on|near)\s+/i, '');
            if (location.length >= 3 && location.length <= 60) {
                return { name: location, verified: false };
            }
        }
    }
    return { name: 'Not specified', verified: false };
}
function extractMissingInfo(text, category, location) {
    const missing = [];
    const lower = text.toLowerCase();
    // Only flag missing location if we couldn't extract it
    if (location.name === 'Not specified') {
        missing.push('Exact location or landmark');
    }
    if (category === 'Water Leakage' && !lower.match(/(?:pipe|नल|पाइप|main|connection|line|लाइन)/i)) {
        missing.push('Type of pipeline (main line or connection)');
    }
    if (category === 'Road Damage' && !lower.match(/(?:\d+|NH|highway|main|bypass|flyover)/i)) {
        missing.push('Road name or number');
    }
    if (category === 'Electrical Hazard' && !lower.match(/(?:pole|तार|wire|transformer|substation)/i)) {
        missing.push('Type of electrical hazard (wire, pole, transformer)');
    }
    if (!lower.match(/(?:कब|when|since|से|पहले|दिन|day|week|हफ्ते|month|महीने|hours?|घंटे)/i)) {
        missing.push('How long has this problem existed');
    }
    return missing;
}
function runRuleBasedExtraction(transcript, language) {
    const lower = transcript.toLowerCase();
    // Find best matching category
    let bestMatch = null;
    let bestScore = 0;
    for (const rule of CATEGORY_RULES) {
        const score = rule.keywords.filter((kw) => lower.includes(kw.toLowerCase())).length;
        if (score > bestScore) {
            bestScore = score;
            bestMatch = rule;
        }
    }
    const matched = bestMatch ?? { ...CATEGORY_RULES[7], category: 'Other' }; // default Other
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
    const missing = extractMissingInfo(transcript, matched.category, location);
    // Confidence based on keyword match strength
    const confidence = Math.min(0.5 + bestScore * 0.1, 0.85);
    logger_1.logger.info('Rule-based extraction used (Evon not configured)', {
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
    constructor() {
        this.endpoint = env_1.config.gnani.evon.inferenceEndpoint;
        if (!this.endpoint) {
            logger_1.logger.warn('Evon inference endpoint not configured — using rule-based extraction fallback');
        }
    }
    get isConfigured() {
        return !!this.endpoint;
    }
    buildPrompt(transcript, language) {
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
    async analyzeIncident(transcript, language) {
        // If no Evon endpoint, use rule-based extraction
        if (!this.isConfigured || !this.endpoint) {
            return runRuleBasedExtraction(transcript, language);
        }
        const startTime = Date.now();
        try {
            const prompt = this.buildPrompt(transcript, language);
            logger_1.logger.info('Sending transcript to Evon v3.3', {
                transcriptLength: transcript.length,
                language,
            });
            const response = await axios_1.default.post(this.endpoint, {
                inputs: prompt,
                parameters: {
                    max_new_tokens: constants_1.GNANI_CONFIG.EVON.MAX_TOKENS,
                    temperature: constants_1.GNANI_CONFIG.EVON.TEMPERATURE,
                    return_full_text: false,
                },
            }, {
                timeout: constants_1.GNANI_CONFIG.EVON.TIMEOUT,
                headers: { 'Content-Type': 'application/json' },
            });
            const processingTimeMs = Date.now() - startTime;
            const generatedText = response.data?.[0]?.generated_text ??
                response.data?.generated_text ??
                String(response.data ?? '');
            const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
            if (!jsonMatch)
                throw new Error('No valid JSON found in Evon response');
            const validated = exports.IncidentExtractionSchema.parse(JSON.parse(jsonMatch[0]));
            logger_1.logger.info('Evon analysis success', {
                category: validated.category,
                severity: validated.severity,
                processingTimeMs,
            });
            return validated;
        }
        catch (error) {
            logger_1.logger.error('Evon analysis failed, falling back to rule-based', { error: error.message });
            if (error instanceof zod_1.z.ZodError) {
                // Evon returned invalid JSON — fall back
                return runRuleBasedExtraction(transcript, language);
            }
            if (axios_1.default.isAxiosError(error)) {
                if (error.code === 'ECONNABORTED')
                    throw new errorTypes_1.TimeoutError('Evon inference timed out');
                throw new errorTypes_1.ServiceUnavailableError(`Evon API error: ${error.response?.status ?? 'unknown'}`);
            }
            throw new errorTypes_1.ServiceUnavailableError(`Incident analysis failed: ${error.message}`);
        }
    }
    async healthCheck() {
        if (!this.isConfigured)
            return { status: 'rule-based', latencyMs: 0 };
        const start = Date.now();
        try {
            await axios_1.default.post(this.endpoint, { inputs: 'test', parameters: { max_new_tokens: 5 } }, { timeout: 5000 });
            return { status: 'operational', latencyMs: Date.now() - start };
        }
        catch {
            return { status: 'unavailable', latencyMs: Date.now() - start };
        }
    }
}
exports.evonService = new EvonService();
//# sourceMappingURL=evon.service.js.map