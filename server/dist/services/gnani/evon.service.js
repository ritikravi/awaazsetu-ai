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
    location: zod_1.z.object({ name: zod_1.z.string(), verified: zod_1.z.boolean() }),
    severity: zod_1.z.enum(constants_1.SEVERITY_LEVELS),
    urgencyReason: zod_1.z.string().min(5).max(300),
    recommendedAction: zod_1.z.string().min(5).max(300),
    language: zod_1.z.string(),
    missingInformation: zod_1.z.array(zod_1.z.string()),
    confidence: zod_1.z.number().min(0).max(1).optional(),
});
// Strong keywords = 3 points, regular = 1 point
// Score < 2 = no confident match → defaults to "Other"
const CATEGORY_RULES = [
    {
        strongKeywords: ['pipeline', 'पाइपलाइन', 'paani ka leakage', 'water pipe', 'नल टूट', 'nal toot', 'water supply', 'paani supply'],
        keywords: ['पानी', 'paani', 'water', 'pipe', 'पाइप', 'रिसाव', 'leak', 'बह रहा', 'flooding', 'बाढ़', 'नल', 'nal', 'paani bah'],
        category: 'Water Leakage',
        defaultSeverity: 'High',
        urgencyReason: 'Water leakage causes road damage and public health risk',
        recommendedAction: 'Contact water department for urgent pipeline inspection and repair',
    },
    {
        strongKeywords: ['road broken', 'road toot', 'sadak toot', 'pothole', 'gaddha', 'gadda', 'road kharab', 'sarak kharab', 'road repair', 'sadak kharab hai', 'rasta toot', 'sadak toot gayi'],
        keywords: ['सड़क', 'sadak', 'road', 'गड्ढा', 'टूट गई', 'highway', 'NH', 'राजमार्ग', 'rasta', 'damaged road', 'bad road', 'sarak'],
        category: 'Road Damage',
        defaultSeverity: 'Medium',
        urgencyReason: 'Road damage poses risk to vehicles and pedestrians',
        recommendedAction: 'Report to PWD (Public Works Department) for road repair',
    },
    {
        strongKeywords: ['bijli ka taar', 'live wire', 'bijli giri', 'electric shock', 'transformer blast', 'pole gira', 'khamba gira', 'taar toot', 'bijli taar'],
        keywords: ['बिजली', 'bijli', 'electric', 'wire', 'तार', 'shock', 'current', 'pole', 'खंभा', 'voltage', 'short circuit'],
        category: 'Electrical Hazard',
        defaultSeverity: 'Critical',
        urgencyReason: 'Electrical hazards pose immediate risk to human life',
        recommendedAction: 'Contact electricity board immediately and cordon off the area',
    },
    {
        strongKeywords: ['kachra nahi utha', 'garbage collection', 'kuda nahi utha', 'waste disposal', 'dustbin full', 'safai nahi hui', 'safai nahi ho rahi'],
        keywords: ['कचरा', 'kachra', 'garbage', 'waste', 'गंदगी', 'dustbin', 'trash', 'कूड़ा', 'kuda', 'gandagi'],
        category: 'Waste Management',
        defaultSeverity: 'Medium',
        urgencyReason: 'Waste accumulation causes hygiene issues and disease risk',
        recommendedAction: 'Schedule garbage collection and increase sanitation visits',
    },
    {
        strongKeywords: ['nala jam', 'naala jam', 'drainage block', 'sewage overflow', 'paani bhar gaya', 'waterlogging', 'jal bhar gaya', 'naali jam'],
        keywords: ['नाला', 'nala', 'drain', 'drainage', 'blocked', 'जाम', 'overflow', 'sewage', 'सीवर', 'जलभराव', 'sewer', 'naali'],
        category: 'Drainage Problem',
        defaultSeverity: 'High',
        urgencyReason: 'Blocked drainage causes flooding and health hazards',
        recommendedAction: 'Clear drainage blockage and clean the nalas',
    },
    {
        strongKeywords: ['loot', 'robbery', 'assault', 'danga', 'riot', 'crime ho raha', 'police bulao', 'emergency', 'chor pakdo'],
        keywords: ['safety', 'सुरक्षा', 'अपराध', 'चोरी', 'दुर्घटना', 'fight', 'झगड़ा', 'police', 'पुलिस', 'danger', 'theft', 'chor'],
        category: 'Public Safety',
        defaultSeverity: 'High',
        urgencyReason: 'Public safety incident requires immediate attention',
        recommendedAction: 'Contact local police or emergency services immediately',
    },
    {
        strongKeywords: ['bridge toot', 'pul toot', 'building collapse', 'wall collapse', 'deewar giri', 'structure damage', 'pul kharab', 'imarat giri'],
        keywords: ['bridge', 'पुल', 'building', 'इमारत', 'collapse', 'गिर', 'wall', 'दीवार', 'structure', 'crack', 'pul', 'imarat'],
        category: 'Infrastructure Damage',
        defaultSeverity: 'High',
        urgencyReason: 'Infrastructure damage poses safety risk to public',
        recommendedAction: 'Report to municipal corporation for structural assessment',
    },
];
// ─── Helper functions ─────────────────────────────────────────────────────────
function detectSeverity(lower, defaultSeverity) {
    if (/(?:jaan ka khatra|life risk|immediate danger|aag lagi|blast|gir gaya|maut|death|मौत|critical|emergency|turant|jaan jaane)/i.test(lower))
        return 'Critical';
    if (/(?:bahut bada|very big|serious|major|accident|injury|chot|khoon|blood|bahut zyada|weeks?|hafte se|mahine se)/i.test(lower))
        return 'High';
    if (/(?:chhota sa|small|minor|thoda|slight|kabhi kabhi|occasionally)/i.test(lower))
        return 'Low';
    return defaultSeverity;
}
function buildDescription(transcript, category) {
    const sentences = transcript.split(/[।.!?\n]+/).map((s) => s.trim()).filter((s) => s.length > 10);
    const problemKw = ['problem', 'broken', 'kharab', 'toot', 'jam', 'leak', 'bah', 'gir', 'damaged', 'खराब', 'टूट', 'समस्या', 'परेशानी'];
    const best = sentences.find((s) => problemKw.some((kw) => s.toLowerCase().includes(kw))) ?? sentences[0] ?? transcript;
    let desc = best.trim();
    if (desc.length > 250) {
        const cut = desc.lastIndexOf(' ', 250);
        desc = desc.substring(0, cut > 100 ? cut : 250) + '...';
    }
    if (desc.length < 15)
        desc = `${category} incident reported by user`;
    return desc;
}
function extractLocationFromText(text) {
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
            if (loc.length >= 3 && loc.length <= 60)
                return { name: loc, verified: false };
        }
    }
    return { name: 'Not specified', verified: false };
}
function extractMissingInfo(text, category, location) {
    const missing = [];
    const lower = text.toLowerCase();
    if (location.name === 'Not specified')
        missing.push('Exact location or landmark');
    if (category === 'Water Leakage' && !lower.match(/(?:pipe|नल|पाइप|main|connection|line)/i))
        missing.push('Type of pipeline (main line or connection)');
    if (category === 'Road Damage' && !lower.match(/(?:\d+|NH|highway|main|bypass)/i))
        missing.push('Road name or number');
    if (category === 'Electrical Hazard' && !lower.match(/(?:pole|तार|wire|transformer)/i))
        missing.push('Type of electrical hazard (wire, pole, transformer)');
    if (!lower.match(/(?:कब|when|since|से|दिन|day|week|हफ्ते|month|महीने|hours?|घंटे)/i))
        missing.push('How long has this problem existed');
    return missing;
}
function runRuleBasedExtraction(transcript, language) {
    const lower = transcript.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;
    for (const rule of CATEGORY_RULES) {
        const strong = rule.strongKeywords.filter((kw) => lower.includes(kw.toLowerCase())).length * 3;
        const normal = rule.keywords.filter((kw) => lower.includes(kw.toLowerCase())).length;
        const score = strong + normal;
        if (score > bestScore) {
            bestScore = score;
            bestMatch = rule;
        }
    }
    // Score < 2 = no confident match → Other
    const matched = (bestMatch && bestScore >= 2) ? bestMatch : {
        strongKeywords: [], keywords: [],
        category: 'Other',
        defaultSeverity: 'Medium',
        urgencyReason: 'Incident does not clearly match standard infrastructure categories',
        recommendedAction: 'Review the complaint and assign to the appropriate department',
    };
    const description = buildDescription(transcript, matched.category);
    const location = extractLocationFromText(transcript);
    const severity = detectSeverity(lower, matched.defaultSeverity);
    const missing = extractMissingInfo(transcript, matched.category, location);
    const confidence = Math.min(0.4 + bestScore * 0.08, 0.88);
    logger_1.logger.info('Rule-based extraction', {
        category: matched.category, severity, score: bestScore, confidence,
    });
    return { category: matched.category, description, location, severity, urgencyReason: matched.urgencyReason, recommendedAction: matched.recommendedAction, language, missingInformation: missing, confidence };
}
// ─────────────────────────────────────────────────────────────────────────────
class EvonService {
    constructor() {
        this.endpoint = env_1.config.gnani.evon.inferenceEndpoint;
        if (!this.endpoint)
            logger_1.logger.warn('Evon inference endpoint not configured — using rule-based extraction fallback');
    }
    get isConfigured() { return !!this.endpoint; }
    buildPrompt(transcript, language) {
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
    async analyzeIncident(transcript, language) {
        if (!this.isConfigured || !this.endpoint) {
            return runRuleBasedExtraction(transcript, language);
        }
        const startTime = Date.now();
        try {
            const response = await axios_1.default.post(this.endpoint, {
                inputs: this.buildPrompt(transcript, language),
                parameters: { max_new_tokens: constants_1.GNANI_CONFIG.EVON.MAX_TOKENS, temperature: constants_1.GNANI_CONFIG.EVON.TEMPERATURE, return_full_text: false },
            }, { timeout: constants_1.GNANI_CONFIG.EVON.TIMEOUT, headers: { 'Content-Type': 'application/json' } });
            const text = response.data?.[0]?.generated_text ?? response.data?.generated_text ?? String(response.data ?? '');
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch)
                throw new Error('No valid JSON in Evon response');
            const validated = exports.IncidentExtractionSchema.parse(JSON.parse(jsonMatch[0]));
            logger_1.logger.info('Evon analysis success', { category: validated.category, processingTimeMs: Date.now() - startTime });
            return validated;
        }
        catch (error) {
            logger_1.logger.error('Evon failed, falling back to rule-based', { error: error.message });
            if (error instanceof zod_1.z.ZodError)
                return runRuleBasedExtraction(transcript, language);
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