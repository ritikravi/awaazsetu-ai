# Gnani AI Model Integration Guide

## Overview

This document provides detailed implementation guidance for integrating all three Gnani AI technologies into AwaazSetu AI.

---

## 1. GNANI PRISMA - SPEECH TO TEXT

### 1.1 Service Overview

Prisma converts audio recordings into text transcripts, supporting multiple Indian languages.

**Official Documentation**: https://docs.gnani.ai/

### 1.2 API Configuration

```typescript
// server/src/config/gnani.config.ts
export const PRISMA_CONFIG = {
  apiEndpoint: process.env.PRISMA_API_ENDPOINT || 'https://api.vachana.ai/stt/v3',
  apiKeyId: process.env.PRISMA_API_KEY_ID,
  timeout: 30000,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFormats: ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm'],
  supportedLanguages: ['hi-IN', 'en-IN'],
  retryAttempts: 2,
  retryDelay: 1000
};
```

### 1.3 Implementation

**File**: `server/src/services/gnani/prisma.service.ts`

```typescript
import axios from 'axios';
import FormData from 'form-data';
import { PRISMA_CONFIG } from '../../config/gnani.config';
import { logger } from '../../utils/logger';

export interface PrismaTranscriptionRequest {
  audioFile: Buffer;
  mimeType: string;
  language?: string;
  filename: string;
}

export interface PrismaTranscriptionResponse {
  transcript: string;
  language: string;
  processingTimeMs: number;
  requestId?: string;
}

class PrismaService {
  private readonly apiEndpoint: string;
  private readonly apiKeyId: string;

  constructor() {
    this.apiEndpoint = PRISMA_CONFIG.apiEndpoint;
    this.apiKeyId = PRISMA_CONFIG.apiKeyId;

    if (!this.apiKeyId) {
      logger.error('Prisma API Key ID not configured');
    }
  }

  async transcribe(request: PrismaTranscriptionRequest): Promise<PrismaTranscriptionResponse> {
    const startTime = Date.now();

    try {
      // Validate file size
      if (request.audioFile.length > PRISMA_CONFIG.maxFileSize) {
        throw new Error(`File size exceeds maximum limit of ${PRISMA_CONFIG.maxFileSize} bytes`);
      }

      // Validate MIME type
      if (!PRISMA_CONFIG.supportedFormats.includes(request.mimeType)) {
        throw new Error(`Unsupported audio format: ${request.mimeType}`);
      }

      // Create form data
      const formData = new FormData();
      formData.append('audio_file', request.audioFile, {
        filename: request.filename,
        contentType: request.mimeType
      });

      if (request.language) {
        formData.append('language', request.language);
      }

      // Make API request
      logger.info('Sending audio to Prisma STT', {
        fileSize: request.audioFile.length,
        mimeType: request.mimeType,
        language: request.language
      });

      const response = await axios.post(this.apiEndpoint, formData, {
        headers: {
          'X-API-Key-ID': this.apiKeyId,
          ...formData.getHeaders()
        },
        timeout: PRISMA_CONFIG.timeout,
        maxContentLength: PRISMA_CONFIG.maxFileSize,
        maxBodyLength: PRISMA_CONFIG.maxFileSize
      });

      const processingTimeMs = Date.now() - startTime;

      // Parse response (adapt based on actual API response structure)
      const transcript = response.data.transcript || response.data.text || '';
      const detectedLanguage = response.data.language || request.language || 'hi-IN';
      const requestId = response.data.request_id || response.data.requestId;

      logger.info('Prisma transcription successful', {
        transcriptLength: transcript.length,
        processingTimeMs,
        requestId
      });

      return {
        transcript,
        language: detectedLanguage,
        processingTimeMs,
        requestId
      };

    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      
      logger.error('Prisma transcription failed', {
        error: error.message,
        processingTimeMs
      });

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Transcription timeout - audio file may be too long');
        }
        if (error.response) {
          throw new Error(`Prisma API error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
        }
      }

      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  async healthCheck(): Promise<{ status: string; latencyMs: number }> {
    const startTime = Date.now();
    try {
      // Implement a lightweight health check if API provides one
      // Otherwise, this could be a simple connectivity test
      const response = await axios.get(`${this.apiEndpoint}/health`, {
        headers: { 'X-API-Key-ID': this.apiKeyId },
        timeout: 5000
      }).catch(() => ({ status: 200 })); // Fallback if no health endpoint

      const latencyMs = Date.now() - startTime;
      return {
        status: response.status === 200 ? 'operational' : 'degraded',
        latencyMs
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      return {
        status: 'unavailable',
        latencyMs
      };
    }
  }
}

export const prismaService = new PrismaService();
```

### 1.4 Testing Strategy

Create test audio samples:
- **Hindi clean**: Clear Hindi speech
- **Hinglish mixed**: Mixed Hindi-English
- **Noisy audio**: Background noise
- **Long audio**: Extended recordings

**Test Cases**:
1. Valid audio transcription
2. Language detection
3. File size validation
4. Format validation
5. Timeout handling
6. API error handling
7. Network failure recovery

---

## 2. GNANI EVON v3.3 - REASONING ENGINE

### 2.1 Model Overview

**Model**: gnani/gnani-evon-v3.3-30B-A3B  
**Platform**: Hugging Face  
**Size**: 30B parameters  
**Type**: Open-weight reasoning LLM

### 2.2 Deployment Architecture

**Important**: Evon is a 30B parameter model that requires:
- Compatible GPU (A100, H100, or equivalent)
- Minimum 48GB VRAM
- Separate inference endpoint

**Deployment Options**:
1. Hugging Face Inference API
2. Self-hosted GPU server
3. Cloud GPU instances (AWS, GCP, Azure)

### 2.3 Configuration

```typescript
// server/src/config/gnani.config.ts
export const EVON_CONFIG = {
  inferenceEndpoint: process.env.EVON_INFERENCE_ENDPOINT,
  modelId: 'gnani/gnani-evon-v3.3-30B-A3B',
  timeout: 15000,
  maxTokens: 1024,
  temperature: 0.7,
  retryAttempts: 1
};
```

### 2.4 Implementation

**File**: `server/src/services/gnani/evon.service.ts`

```typescript
import axios from 'axios';
import { z } from 'zod';
import { EVON_CONFIG } from '../../config/gnani.config';
import { logger } from '../../utils/logger';

// Zod schema for incident extraction validation
export const IncidentExtractionSchema = z.object({
  category: z.enum([
    'Water Leakage',
    'Road Damage',
    'Electrical Hazard',
    'Waste Management',
    'Drainage Problem',
    'Public Safety',
    'Infrastructure Damage',
    'Other'
  ]),
  description: z.string().min(10).max(500),
  location: z.object({
    name: z.string(),
    verified: z.boolean()
  }),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
  urgencyReason: z.string().min(10).max(300),
  recommendedAction: z.string().min(10).max(300),
  language: z.string(),
  missingInformation: z.array(z.string()),
  confidence: z.number().min(0).max(1).optional()
});

export type IncidentExtraction = z.infer<typeof IncidentExtractionSchema>;

export interface EvonAnalysisRequest {
  transcript: string;
  language: string;
}

class EvonService {
  private readonly inferenceEndpoint: string;
  private readonly isAvailable: boolean;

  constructor() {
    this.inferenceEndpoint = EVON_CONFIG.inferenceEndpoint;
    this.isAvailable = !!this.inferenceEndpoint;

    if (!this.isAvailable) {
      logger.warn('Evon inference endpoint not configured - reasoning features will be unavailable');
    }
  }

  private buildPrompt(transcript: string, language: string): string {
    return `You are an AI assistant that analyzes incident reports from frontline workers in India. The reports may be in Hindi, Hinglish, or English.

Your task is to extract structured information from the following transcript and output ONLY valid JSON with no additional text.

Transcript: "${transcript}"
Language: ${language}

Extract the following information:
1. Category: One of [Water Leakage, Road Damage, Electrical Hazard, Waste Management, Drainage Problem, Public Safety, Infrastructure Damage, Other]
2. Description: A clear English description of the problem (10-500 characters)
3. Location: The specific location mentioned (if any). Set verified: false if location is vague or not mentioned
4. Severity: One of [Low, Medium, High, Critical] based on urgency and impact
5. UrgencyReason: Explain why you assigned this severity level (10-300 characters)
6. RecommendedAction: What action should be taken (10-300 characters)
7. MissingInformation: Array of what information is missing (e.g., ["exact location", "time of occurrence"])
8. Confidence: Your confidence score (0.0 to 1.0)

Rules:
- NEVER invent or assume a specific location if not clearly stated
- If location is vague (e.g., "village road", "near temple"), mark verified: false
- Be conservative with severity - only mark Critical if there's immediate danger
- Identify what information is missing for a complete report
- Output ONLY valid JSON, no explanatory text

Output JSON format:
{
  "category": "...",
  "description": "...",
  "location": {
    "name": "...",
    "verified": false
  },
  "severity": "...",
  "urgencyReason": "...",
  "recommendedAction": "...",
  "language": "${language}",
  "missingInformation": [],
  "confidence": 0.85
}`;
  }

  async analyzeIncident(request: EvonAnalysisRequest): Promise<IncidentExtraction> {
    if (!this.isAvailable) {
      throw new Error('Evon inference endpoint not configured');
    }

    const startTime = Date.now();

    try {
      const prompt = this.buildPrompt(request.transcript, request.language);

      logger.info('Sending transcript to Evon for analysis', {
        transcriptLength: request.transcript.length,
        language: request.language
      });

      // Call inference endpoint
      const response = await axios.post(
        this.inferenceEndpoint,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: EVON_CONFIG.maxTokens,
            temperature: EVON_CONFIG.temperature,
            return_full_text: false
          }
        },
        {
          timeout: EVON_CONFIG.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const processingTimeMs = Date.now() - startTime;

      // Extract JSON from response
      let generatedText = response.data.generated_text || response.data[0]?.generated_text || '';
      
      // Try to extract JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Evon response');
      }

      const extractedData = JSON.parse(jsonMatch[0]);

      // Validate against schema
      const validatedData = IncidentExtractionSchema.parse(extractedData);

      logger.info('Evon analysis successful', {
        category: validatedData.category,
        severity: validatedData.severity,
        confidence: validatedData.confidence,
        processingTimeMs
      });

      return validatedData;

    } catch (error) {
      const processingTimeMs = Date.now() - startTime;

      logger.error('Evon analysis failed', {
        error: error.message,
        processingTimeMs
      });

      if (error instanceof z.ZodError) {
        logger.error('Evon output validation failed', { errors: error.errors });
        throw new Error('Invalid incident extraction format');
      }

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Analysis timeout - inference took too long');
        }
        if (error.response) {
          throw new Error(`Evon API error: ${error.response.status}`);
        }
      }

      throw new Error(`Incident analysis failed: ${error.message}`);
    }
  }

  async healthCheck(): Promise<{ status: string; latencyMs: number }> {
    const startTime = Date.now();
    try {
      if (!this.isAvailable) {
        return { status: 'unavailable', latencyMs: 0 };
      }

      // Simple test inference
      const response = await axios.post(
        this.inferenceEndpoint,
        {
          inputs: 'Health check',
          parameters: { max_new_tokens: 10 }
        },
        { timeout: 5000 }
      );

      const latencyMs = Date.now() - startTime;
      return {
        status: response.status === 200 ? 'operational' : 'degraded',
        latencyMs
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      return { status: 'unavailable', latencyMs };
    }
  }
}

export const evonService = new EvonService();
```

### 2.5 Prompt Engineering Best Practices

**Key Principles**:
1. Clear instruction format
2. Explicit output structure
3. Conservative inference rules
4. Missing information detection
5. JSON-only output requirement

**Testing Prompts**:
- Test with various Hindi/Hinglish inputs
- Test with vague location references
- Test with missing information
- Test with ambiguous severity cases

---

## 3. GNANI TIMBRE - TEXT TO SPEECH

### 3.1 Service Overview

Timbre converts text into natural-sounding Hindi speech for incident confirmations.

### 3.2 API Configuration

```typescript
// server/src/config/gnani.config.ts
export const TIMBRE_CONFIG = {
  apiEndpoint: process.env.TIMBRE_API_ENDPOINT || 'https://api.vachana.ai/api/v1/tts/inference',
  apiKeyId: process.env.TIMBRE_API_KEY_ID,
  timeout: 20000,
  defaultVoice: 'Nalini',
  defaultModel: 'timbre-v2.5',
  defaultLanguage: 'hi-IN',
  maxTextLength: 500,
  outputFormat: 'mp3'
};
```

### 3.3 Implementation

**File**: `server/src/services/gnani/timbre.service.ts`

```typescript
import axios from 'axios';
import { TIMBRE_CONFIG } from '../../config/gnani.config';
import { logger } from '../../utils/logger';

export interface TimbreSynthesisRequest {
  text: string;
  language?: string;
  voice?: string;
  model?: string;
}

export interface TimbreSynthesisResponse {
  audioBuffer: Buffer;
  mimeType: string;
  processingTimeMs: number;
}

class TimbreService {
  private readonly apiEndpoint: string;
  private readonly apiKeyId: string;

  constructor() {
    this.apiEndpoint = TIMBRE_CONFIG.apiEndpoint;
    this.apiKeyId = TIMBRE_CONFIG.apiKeyId;

    if (!this.apiKeyId) {
      logger.error('Timbre API Key ID not configured');
    }
  }

  private sanitizeText(text: string): string {
    // Remove potentially problematic characters
    return text
      .trim()
      .replace(/[<>]/g, '')
      .substring(0, TIMBRE_CONFIG.maxTextLength);
  }

  async synthesize(request: TimbreSynthesisRequest): Promise<TimbreSynthesisResponse> {
    const startTime = Date.now();

    try {
      const sanitizedText = this.sanitizeText(request.text);

      if (sanitizedText.length === 0) {
        throw new Error('Text is empty after sanitization');
      }

      logger.info('Sending text to Timbre TTS', {
        textLength: sanitizedText.length,
        voice: request.voice || TIMBRE_CONFIG.defaultVoice,
        language: request.language || TIMBRE_CONFIG.defaultLanguage
      });

      const response = await axios.post(
        this.apiEndpoint,
        {
          text: sanitizedText,
          voice: request.voice || TIMBRE_CONFIG.defaultVoice,
          model: request.model || TIMBRE_CONFIG.defaultModel,
          language: request.language || TIMBRE_CONFIG.defaultLanguage
        },
        {
          headers: {
            'X-API-Key-ID': this.apiKeyId,
            'Content-Type': 'application/json'
          },
          timeout: TIMBRE_CONFIG.timeout,
          responseType: 'arraybuffer'
        }
      );

      const processingTimeMs = Date.now() - startTime;
      const audioBuffer = Buffer.from(response.data);

      logger.info('Timbre synthesis successful', {
        audioSize: audioBuffer.length,
        processingTimeMs
      });

      return {
        audioBuffer,
        mimeType: 'audio/mpeg',
        processingTimeMs
      };

    } catch (error) {
      const processingTimeMs = Date.now() - startTime;

      logger.error('Timbre synthesis failed', {
        error: error.message,
        processingTimeMs
      });

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Speech synthesis timeout');
        }
        if (error.response) {
          throw new Error(`Timbre API error: ${error.response.status}`);
        }
      }

      throw new Error(`Speech synthesis failed: ${error.message}`);
    }
  }

  async healthCheck(): Promise<{ status: string; latencyMs: number }> {
    const startTime = Date.now();
    try {
      // Test with minimal text
      await this.synthesize({ text: 'परीक्षण' });
      const latencyMs = Date.now() - startTime;
      return { status: 'operational', latencyMs };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      return { status: 'unavailable', latencyMs };
    }
  }
}

export const timbreService = new TimbreService();
```

### 3.4 Confirmation Message Templates

```typescript
// server/src/utils/confirmationTemplates.ts

export function generateIncidentConfirmation(incident: any): string {
  const templates = {
    'hi-IN': `आपकी ${getCategoryInHindi(incident.category)} से जुड़ी शिकायत सफलतापूर्वक दर्ज कर ली गई है। शिकायत संख्या ${incident.incidentId}। जल्द ही इस पर कार्यवाही की जाएगी।`,
    'en-IN': `Your ${incident.category} complaint has been successfully registered. Incident ID: ${incident.incidentId}. Action will be taken soon.`
  };

  return templates[incident.language] || templates['hi-IN'];
}

function getCategoryInHindi(category: string): string {
  const translations = {
    'Water Leakage': 'पानी के रिसाव',
    'Road Damage': 'सड़क क्षति',
    'Electrical Hazard': 'बिजली का खतरा',
    'Waste Management': 'कचरा प्रबंधन',
    'Drainage Problem': 'जल निकासी की समस्या',
    'Public Safety': 'सार्वजनिक सुरक्षा',
    'Infrastructure Damage': 'बुनियादी ढांचे की क्षति',
    'Other': 'अन्य'
  };

  return translations[category] || category;
}
```

---

## 4. INTEGRATION WORKFLOW

### 4.1 Complete Voice-to-Incident Pipeline

```typescript
// server/src/services/incident-pipeline.service.ts

import { prismaService } from './gnani/prisma.service';
import { evonService } from './gnani/evon.service';
import { timbreService } from './gnani/timbre.service';
import { AIProcessingLog } from '../models/AIProcessingLog.model';
import { generateIncidentConfirmation } from '../utils/confirmationTemplates';

export class IncidentPipelineService {
  async processVoiceIncident(audioFile: Buffer, mimeType: string, filename: string) {
    const results = {
      transcript: null,
      analysis: null,
      confirmation: null,
      logs: []
    };

    try {
      // Step 1: Transcribe audio with Prisma
      const transcription = await prismaService.transcribe({
        audioFile,
        mimeType,
        filename
      });

      results.transcript = transcription;

      await AIProcessingLog.create({
        provider: 'prisma',
        model: 'prisma-stt-v3',
        operation: 'transcription',
        status: 'success',
        processingTimeMs: transcription.processingTimeMs,
        requestId: transcription.requestId
      });

      // Step 2: Analyze transcript with Evon
      const analysis = await evonService.analyzeIncident({
        transcript: transcription.transcript,
        language: transcription.language
      });

      results.analysis = analysis;

      await AIProcessingLog.create({
        provider: 'evon',
        model: 'evon-v3.3-30B',
        operation: 'incident_analysis',
        status: 'success',
        processingTimeMs: Date.now() // Calculate actual time
      });

      return results;

    } catch (error) {
      await AIProcessingLog.create({
        provider: error.service || 'unknown',
        operation: 'pipeline',
        status: 'error',
        errorMessage: error.message
      });

      throw error;
    }
  }

  async generateConfirmation(incident: any): Promise<Buffer> {
    try {
      const confirmationText = generateIncidentConfirmation(incident);
      
      const synthesis = await timbreService.synthesize({
        text: confirmationText,
        language: incident.language
      });

      await AIProcessingLog.create({
        incidentId: incident.incidentId,
        provider: 'timbre',
        model: 'timbre-v2.5',
        operation: 'tts_synthesis',
        status: 'success',
        processingTimeMs: synthesis.processingTimeMs
      });

      return synthesis.audioBuffer;

    } catch (error) {
      await AIProcessingLog.create({
        incidentId: incident.incidentId,
        provider: 'timbre',
        operation: 'tts_synthesis',
        status: 'error',
        errorMessage: error.message
      });

      throw error;
    }
  }
}

export const incidentPipelineService = new IncidentPipelineService();
```

---

## 5. ERROR HANDLING & RESILIENCE

### 5.1 Timeout Strategy

| Service | Timeout | Retry | Strategy |
|---------|---------|-------|----------|
| Prisma  | 30s     | 2     | Exponential backoff |
| Evon    | 15s     | 1     | Fail fast |
| Timbre  | 20s     | 2     | Exponential backoff |

### 5.2 Graceful Degradation

If Evon is unavailable:
- Display clear error message
- Do not fabricate analysis
- Allow manual incident entry
- Log service unavailability

### 5.3 Monitoring & Logging

Log all AI operations:
- Request parameters
- Processing time
- Success/failure status
- Error messages
- Request IDs

---

## 6. ENVIRONMENT VARIABLES

```bash
# .env
# Gnani Prisma STT
PRISMA_API_ENDPOINT=https://api.vachana.ai/stt/v3
PRISMA_API_KEY_ID=your_prisma_api_key

# Gnani Evon Reasoning
EVON_INFERENCE_ENDPOINT=https://your-evon-endpoint.com/v1/inference

# Gnani Timbre TTS
TIMBRE_API_ENDPOINT=https://api.vachana.ai/api/v1/tts/inference
TIMBRE_API_KEY_ID=your_timbre_api_key
```

---

## 7. TESTING CHECKLIST

- [ ] Prisma transcribes Hindi audio correctly
- [ ] Prisma transcribes Hinglish audio correctly
- [ ] Prisma handles noisy audio gracefully
- [ ] Evon extracts structured incident information
- [ ] Evon classifies severity correctly
- [ ] Evon identifies missing information
- [ ] Evon output validates against Zod schema
- [ ] Timbre generates Hindi audio confirmation
- [ ] Timbre audio is clear and natural
- [ ] Health checks work for all services
- [ ] Timeout handling works correctly
- [ ] Error messages are user-friendly
- [ ] Processing logs are created
- [ ] Complete pipeline executes successfully

---

**Next**: Proceed with implementation after architecture approval.
