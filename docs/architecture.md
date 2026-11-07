# AwaazSetu AI - System Architecture Document

## Executive Summary

AwaazSetu AI is a voice-first intelligence platform that enables India's frontline workers and citizens to report infrastructure and operational problems using natural speech in Hindi, Hinglish, and regional languages.

### Core Value Proposition
"Speak naturally. Understand intelligently. Take action."

### Technology Integration
- **Gnani Prisma**: Speech-to-Text transcription
- **Gnani Evon v3.3**: AI reasoning and structured extraction
- **Gnani Timbre**: Text-to-Speech confirmation

---

## 1. FUNCTIONAL REQUIREMENTS

### 1.1 User Roles
- **Citizen/Field Worker**: Report incidents via voice
- **Administrator**: Monitor, manage, and analyze incidents

### 1.2 Core Features

#### Voice Recording & Transcription
- Multi-language audio recording (Hindi, Hinglish, regional)
- Real-time waveform visualization
- Audio playback before submission
- Language selection
- Prisma STT integration
- Transcript editing capability

#### AI-Powered Incident Intelligence
- Context understanding via Evon v3.3
- Automated incident categorization
- Location extraction
- Severity classification with reasoning
- Action recommendations
- Missing information detection
- Structured JSON output validation

#### Human Verification Loop
- Review AI-extracted information
- Edit description, location, category
- Confirm or reject classification
- Maintain audit trail of changes
- Clear distinction between AI-generated and user-confirmed data

#### Voice Confirmation
- Timbre TTS synthesis
- Multi-language audio confirmation
- Incident summary playback
- Audio player controls

#### Admin Dashboard
- Real-time incident statistics
- Category and severity distribution
- Timeline analytics
- Incident status management
- Resolution tracking
- Detailed incident history

### 1.3 Incident Categories
1. Water Leakage
2. Road Damage
3. Electrical Hazard
4. Waste Management
5. Drainage Problem
6. Public Safety
7. Infrastructure Damage
8. Other

### 1.4 Severity Levels
- Low
- Medium
- High
- Critical

### 1.5 Incident Statuses
- Submitted
- Under Review
- Assigned
- In Progress
- Resolved
- Rejected

---

## 2. SYSTEM ARCHITECTURE

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (React)                     │
│  - Voice Recording Interface                                 │
│  - Incident Verification UI                                  │
│  - Admin Dashboard                                           │
│  - Audio Playback                                            │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS/REST
┌──────────────────────▼──────────────────────────────────────┐
│                  API GATEWAY (Express)                       │
│  - Authentication Middleware                                 │
│  - Rate Limiting                                             │
│  - Request Validation                                        │
│  - Error Handling                                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
│   Auth       │ │ Incident │ │  Analytics │
│   Service    │ │ Service  │ │  Service   │
└──────────────┘ └────┬─────┘ └────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌───▼────┐ ┌─────▼──────┐
│   Prisma     │ │  Evon  │ │  Timbre    │
│   STT        │ │ Reason │ │   TTS      │
│   Adapter    │ │ Adapter│ │  Adapter   │
└──────────────┘ └────────┘ └────────────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │     MongoDB Database       │
        │  - Users                   │
        │  - Incidents               │
        │  - AI Processing Logs      │
        │  - Incident History        │
        └────────────────────────────┘
```

### 2.2 Service-Oriented Architecture

#### Core Services

**Authentication Service**
- User registration and login
- JWT token generation and validation
- Role-based access control
- Password hashing

**Audio Processing Service**
- File upload validation
- MIME type verification
- Size limit enforcement
- Temporary storage management
- Audio cleanup

**Prisma STT Service**
- Audio-to-text transcription
- Multi-language support
- Language detection
- API error handling
- Processing duration tracking

**Evon Reasoning Service**
- Transcript analysis
- Structured extraction
- Category classification
- Severity assessment
- Schema validation
- Confidence scoring

**Timbre TTS Service**
- Text-to-speech synthesis
- Multi-voice support
- Audio streaming
- Temporary file cleanup

**Incident Management Service**
- CRUD operations
- Status workflow management
- Verification tracking
- History logging
- Search and filtering

**Analytics Service**
- Statistical aggregation
- Time-series analysis
- Category distribution
- Performance metrics

### 2.3 Data Flow Architecture

```
User Voice Input
    │
    ▼
Audio Recording (Web Audio API)
    │
    ▼
Audio Upload (Multer)
    │
    ▼
Prisma STT Service
    │
    ▼
Transcript Text
    │
    ▼
Evon Reasoning Service
    │
    ▼
Structured Incident JSON
    │
    ▼
Schema Validation (Zod)
    │
    ▼
Human Verification UI
    │
    ▼
User Confirmation
    │
    ▼
MongoDB Persistence
    │
    ▼
Timbre TTS Service
    │
    ▼
Audio Confirmation
    │
    ▼
Dashboard Update
```

---

## 3. COMPONENT ARCHITECTURE

### 3.1 Frontend Components

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── voice/
│   │   ├── VoiceRecorder.tsx
│   │   ├── Waveform.tsx
│   │   ├── AudioPlayer.tsx
│   │   └── LanguageSelector.tsx
│   ├── incident/
│   │   ├── IncidentCard.tsx
│   │   ├── IncidentForm.tsx
│   │   ├── IncidentVerification.tsx
│   │   ├── CategoryBadge.tsx
│   │   └── SeverityBadge.tsx
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   ├── IncidentChart.tsx
│   │   ├── RecentIncidents.tsx
│   │   └── AnalyticsPanel.tsx
│   └── common/
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
├── pages/
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── VoiceReport.tsx
│   ├── IncidentDetail.tsx
│   ├── IncidentHistory.tsx
│   └── AdminDashboard.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useVoiceRecorder.ts
│   ├── useIncidents.ts
│   └── useAudioPlayer.ts
├── services/
│   ├── api.ts
│   ├── auth.service.ts
│   ├── incident.service.ts
│   ├── voice.service.ts
│   └── analytics.service.ts
├── context/
│   └── AuthContext.tsx
└── utils/
    ├── audioUtils.ts
    ├── formatters.ts
    └── validators.ts
```

### 3.2 Backend Architecture

```
src/
├── config/
│   ├── database.ts
│   ├── env.ts
│   └── constants.ts
├── controllers/
│   ├── auth.controller.ts
│   ├── voice.controller.ts
│   ├── incident.controller.ts
│   ├── ai.controller.ts
│   └── dashboard.controller.ts
├── routes/
│   ├── auth.routes.ts
│   ├── voice.routes.ts
│   ├── incident.routes.ts
│   ├── ai.routes.ts
│   └── dashboard.routes.ts
├── services/
│   ├── auth.service.ts
│   ├── audio.service.ts
│   ├── incident.service.ts
│   ├── analytics.service.ts
│   └── gnani/
│       ├── prisma.service.ts
│       ├── evon.service.ts
│       └── timbre.service.ts
├── models/
│   ├── User.model.ts
│   ├── Incident.model.ts
│   ├── AIProcessingLog.model.ts
│   └── IncidentHistory.model.ts
├── middleware/
│   ├── auth.middleware.ts
│   ├── validate.middleware.ts
│   ├── upload.middleware.ts
│   ├── errorHandler.middleware.ts
│   └── rateLimiter.middleware.ts
├── validators/
│   ├── auth.validator.ts
│   ├── incident.validator.ts
│   └── voice.validator.ts
├── utils/
│   ├── logger.ts
│   ├── errorTypes.ts
│   └── helpers.ts
├── types/
│   ├── express.d.ts
│   ├── incident.types.ts
│   └── gnani.types.ts
├── app.ts
└── server.ts
```

---

## 4. DATABASE SCHEMA

### 4.1 Collections Design

#### Users Collection
```typescript
{
  _id: ObjectId,
  name: string,
  email: string (unique, indexed),
  passwordHash: string,
  role: 'citizen' | 'admin',
  preferredLanguage: string,
  createdAt: Date,
  updatedAt: Date
}
```

#### Incidents Collection
```typescript
{
  _id: ObjectId,
  incidentId: string (unique, indexed),
  userId: ObjectId (ref: User, indexed),
  
  // Incident Data
  category: string,
  description: string,
  location: {
    name: string,
    verified: boolean,
    coordinates?: { lat: number, lng: number }
  },
  severity: 'Low' | 'Medium' | 'High' | 'Critical',
  urgencyReason: string,
  recommendedAction: string,
  missingInformation: string[],
  
  // Processing Data
  originalTranscript: string,
  correctedTranscript?: string,
  language: string,
  confidence?: number,
  
  // Verification Data
  verificationStatus: 'pending' | 'verified' | 'rejected',
  verifiedAt?: Date,
  userEdits: {
    field: string,
    originalValue: any,
    newValue: any,
    editedAt: Date
  }[],
  
  // Workflow
  status: 'Submitted' | 'Under Review' | 'Assigned' | 'In Progress' | 'Resolved' | 'Rejected',
  assignedTo?: ObjectId,
  resolutionNotes?: string,
  resolvedAt?: Date,
  
  createdAt: Date (indexed),
  updatedAt: Date
}
```

#### AIProcessingLog Collection
```typescript
{
  _id: ObjectId,
  incidentId: string (indexed),
  provider: 'prisma' | 'evon' | 'timbre',
  model: string,
  operation: string,
  status: 'success' | 'error' | 'timeout',
  processingTimeMs: number,
  errorMessage?: string,
  requestId?: string,
  metadata?: any,
  createdAt: Date (indexed)
}
```

#### IncidentHistory Collection
```typescript
{
  _id: ObjectId,
  incidentId: string (indexed),
  previousStatus: string,
  newStatus: string,
  changedBy: ObjectId (ref: User),
  notes?: string,
  createdAt: Date (indexed)
}
```

### 4.2 Indexes
- Users: `email` (unique)
- Incidents: `incidentId` (unique), `userId`, `status`, `createdAt`, `severity`
- AIProcessingLog: `incidentId`, `createdAt`
- IncidentHistory: `incidentId`, `createdAt`

---

## 5. API CONTRACT

### 5.1 Authentication APIs

**POST /api/auth/register**
```json
Request:
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "citizen | admin",
  "preferredLanguage": "string"
}

Response: 201
{
  "success": true,
  "data": {
    "user": { "id", "name", "email", "role" },
    "token": "string"
  }
}
```

**POST /api/auth/login**
```json
Request:
{
  "email": "string",
  "password": "string"
}

Response: 200
{
  "success": true,
  "data": {
    "user": { "id", "name", "email", "role" },
    "token": "string"
  }
}
```

**GET /api/auth/me**
```json
Headers: Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "user": { "id", "name", "email", "role", "preferredLanguage" }
  }
}
```

### 5.2 Voice APIs

**POST /api/voice/transcribe**
```
Content-Type: multipart/form-data
Headers: Authorization: Bearer <token>

Form Data:
- audio: File
- language: string (optional)

Response: 200
{
  "success": true,
  "data": {
    "transcript": "string",
    "language": "string",
    "processingTimeMs": number,
    "requestId": "string"
  }
}
```

**POST /api/voice/speak**
```json
Headers: Authorization: Bearer <token>

Request:
{
  "text": "string",
  "language": "string",
  "voice": "string"
}

Response: 200 (audio/mpeg)
Binary audio data
```

### 5.3 AI APIs

**POST /api/ai/analyze**
```json
Headers: Authorization: Bearer <token>

Request:
{
  "transcript": "string",
  "language": "string"
}

Response: 200
{
  "success": true,
  "data": {
    "category": "string",
    "description": "string",
    "location": {
      "name": "string",
      "verified": boolean
    },
    "severity": "string",
    "urgencyReason": "string",
    "recommendedAction": "string",
    "missingInformation": ["string"],
    "confidence": number
  }
}
```

**GET /api/ai/health**
```json
Response: 200
{
  "success": true,
  "data": {
    "prisma": { "status": "operational", "latency": number },
    "evon": { "status": "operational", "latency": number },
    "timbre": { "status": "operational", "latency": number }
  }
}
```

### 5.4 Incident APIs

**POST /api/incidents**
```json
Headers: Authorization: Bearer <token>

Request:
{
  "category": "string",
  "description": "string",
  "location": { "name": "string" },
  "severity": "string",
  "urgencyReason": "string",
  "recommendedAction": "string",
  "originalTranscript": "string",
  "language": "string",
  "confidence": number
}

Response: 201
{
  "success": true,
  "data": {
    "incident": { /* full incident object */ }
  }
}
```

**GET /api/incidents**
```
Headers: Authorization: Bearer <token>
Query Params: page, limit, status, category, severity

Response: 200
{
  "success": true,
  "data": {
    "incidents": [],
    "pagination": {
      "total": number,
      "page": number,
      "pages": number
    }
  }
}
```

**GET /api/incidents/:id**
```json
Response: 200
{
  "success": true,
  "data": {
    "incident": { /* full incident with history */ }
  }
}
```

**PATCH /api/incidents/:id**
```json
Request:
{
  "description": "string",
  "location": { "name": "string" },
  "category": "string",
  "severity": "string"
}

Response: 200
{
  "success": true,
  "data": {
    "incident": { /* updated incident */ }
  }
}
```

**PATCH /api/incidents/:id/status**
```json
Request:
{
  "status": "string",
  "notes": "string"
}

Response: 200
{
  "success": true,
  "data": {
    "incident": { /* updated incident */ }
  }
}
```

### 5.5 Dashboard APIs

**GET /api/dashboard/stats**
```json
Response: 200
{
  "success": true,
  "data": {
    "totalIncidents": number,
    "newIncidents": number,
    "pendingVerification": number,
    "highPriority": number,
    "resolved": number
  }
}
```

**GET /api/dashboard/analytics**
```json
Query Params: startDate, endDate

Response: 200
{
  "success": true,
  "data": {
    "categoryDistribution": [{ "category": "string", "count": number }],
    "severityDistribution": [{ "severity": "string", "count": number }],
    "statusDistribution": [{ "status": "string", "count": number }],
    "timeline": [{ "date": "string", "count": number }]
  }
}
```

---

## 6. AI INTEGRATION PLAN

### 6.1 Prisma STT Integration

**Configuration**
```typescript
{
  apiEndpoint: 'https://api.vachana.ai/stt/v3',
  apiKeyHeader: 'X-API-Key-ID',
  supportedFormats: ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedLanguages: ['hi-IN', 'en-IN'],
  timeout: 30000
}
```

**Implementation Strategy**
1. Audio validation and preprocessing
2. Multipart form upload
3. API response parsing
4. Error handling and retries
5. Processing time tracking
6. Request ID logging

**Error Scenarios**
- Invalid audio format
- File size exceeded
- Network timeout
- API rate limit
- Unsupported language
- Transcription failure

### 6.2 Evon v3.3 Integration

**Model Details**
- Model: gnani/gnani-evon-v3.3-30B-A3B
- Host: Hugging Face
- Size: 30B parameters
- Context: Multi-turn reasoning

**Deployment Strategy**
- Separate inference endpoint (not bundled with MERN backend)
- Compatible GPU environment required
- REST API wrapper for inference
- Configurable endpoint URL
- Fallback graceful degradation

**Prompt Engineering**
```
System: You are an AI assistant that analyzes incident reports in Hindi and Hinglish.
Extract structured information from the transcript.

User: <transcript>

Expected JSON output:
{
  "category": "...",
  "description": "...",
  "location": { "name": "...", "verified": false },
  "severity": "...",
  "urgencyReason": "...",
  "recommendedAction": "...",
  "missingInformation": [],
  "confidence": 0.0-1.0
}
```

**Schema Validation**
- Zod schema enforcement
- Required field validation
- Enum constraint checking
- Confidence score validation
- Missing information array

**Performance Targets**
- Inference time: < 5 seconds
- Timeout: 15 seconds
- Retry: 1 attempt

### 6.3 Timbre TTS Integration

**Configuration**
```typescript
{
  apiEndpoint: 'https://api.vachana.ai/api/v1/tts/inference',
  apiKeyHeader: 'X-API-Key-ID',
  defaultVoice: 'Nalini',
  defaultModel: 'timbre-v2.5',
  defaultLanguage: 'hi-IN',
  maxTextLength: 500,
  timeout: 20000
}
```

**Implementation Strategy**
1. Text sanitization
2. API request with voice selection
3. Audio stream handling
4. Temporary file management
5. Client streaming
6. Automatic cleanup

**Audio Delivery**
- Stream audio to client
- Temporary file storage
- Scheduled cleanup
- Error fallback

---

## 7. SECURITY ARCHITECTURE

### 7.1 Authentication & Authorization
- JWT-based authentication
- 24-hour token expiration
- bcrypt password hashing (rounds: 10)
- Role-based access control (RBAC)
- Protected route middleware

### 7.2 API Security
- Helmet.js security headers
- CORS configuration
- Rate limiting (100 requests/15 min per IP)
- Request size limits
- Input sanitization
- SQL/NoSQL injection prevention

### 7.3 File Upload Security
- MIME type validation
- File size limits (10MB)
- Extension whitelist
- Temporary storage
- Automatic cleanup
- No executable uploads

### 7.4 Data Security
- Environment variable secrets
- No API keys in client code
- MongoDB access control
- Encrypted connections (TLS)
- Audit logging
- PII handling compliance

### 7.5 Error Handling
- No sensitive data in error messages
- Structured error logging
- Client-safe error responses
- Stack trace suppression in production

---

## 8. DEVELOPMENT MILESTONES

### Phase 2: Project Initialization (Day 1)
- Initialize MERN project structure
- Configure TypeScript
- Setup ESLint and Prettier
- Configure environment variables
- Initialize MongoDB connection
- Setup logging

### Phase 3: Backend Auth & Models (Day 2)
- User model and authentication
- JWT implementation
- Protected routes
- Incident model
- Database indexes
- API foundation

### Phase 4: Prisma Integration (Day 3)
- Prisma service adapter
- Audio upload handling
- Transcription endpoint
- Error handling
- Testing with sample audio

### Phase 5: Evon Integration (Day 4)
- Evon service adapter
- Inference endpoint setup
- Structured extraction
- Schema validation
- Testing with transcripts

### Phase 6: Timbre Integration (Day 5)
- Timbre service adapter
- TTS endpoint
- Audio streaming
- Temporary file management
- Testing with Hindi text

### Phase 7: Frontend Development (Day 6-8)
- React app setup
- Authentication UI
- Voice recording interface
- Incident verification UI
- Audio playback
- Responsive design

### Phase 8: Dashboard & Analytics (Day 9)
- Admin dashboard
- Statistics aggregation
- Charts and visualizations
- Incident management
- Status workflow

### Phase 9: Testing & QA (Day 10-11)
- Unit tests
- Integration tests
- End-to-end testing
- Security testing
- Performance testing
- Multi-language testing

### Phase 10: Deployment & Documentation (Day 12-13)
- Vercel deployment (frontend)
- Render deployment (backend)
- MongoDB Atlas setup
- Environment configuration
- Documentation completion
- Demo preparation

---

## 9. RISK REGISTER

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Gnani API rate limits | High | Medium | Implement caching, request queuing |
| Evon inference latency | High | Medium | Set realistic timeouts, show progress |
| Audio quality issues | Medium | High | Provide recording guidelines, validation |
| Language detection accuracy | Medium | Medium | Allow manual language selection |
| Large file uploads | Medium | Medium | Enforce 10MB limit, compression |
| MongoDB connection issues | High | Low | Connection pooling, retry logic |
| JWT token security | High | Low | Short expiration, secure storage |
| Evon deployment complexity | High | Medium | External endpoint, clear documentation |
| Multi-language UI support | Medium | Medium | i18n framework, phase approach |
| Mobile responsiveness | Medium | Low | Mobile-first design, testing |

---

## 10. NON-FUNCTIONAL REQUIREMENTS

### Performance
- Page load: < 3 seconds
- API response: < 2 seconds (excluding AI)
- Prisma STT: < 10 seconds
- Evon reasoning: < 5 seconds
- Timbre TTS: < 8 seconds

### Scalability
- Support 100 concurrent users
- Handle 1000 incidents/day
- Database pagination
- Stateless backend design

### Reliability
- 99% uptime target
- Graceful AI service degradation
- Error recovery
- Automatic retries

### Usability
- Mobile-responsive
- Accessible (WCAG awareness)
- Hindi/English UI
- Intuitive voice interface

### Maintainability
- Clean code architecture
- Comprehensive documentation
- Type safety (TypeScript)
- Modular services

---

## CONCLUSION

This architecture provides a robust foundation for AwaazSetu AI, demonstrating meaningful integration of all three Gnani AI technologies while maintaining production-quality standards for the Great Indian AI Internship Challenge 2026.

**Next Steps**: Await approval to proceed with Phase 2 implementation.
