# AwaazSetu AI - Architecture Diagrams

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                         USER LAYER                                   │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Citizen    │  │    Field     │  │    Admin     │              │
│  │   Mobile     │  │   Worker     │  │  Dashboard   │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                        │
└─────────┼─────────────────┼─────────────────┼────────────────────────┘
          │                 │                 │
          └─────────────────┴─────────────────┘
                            │
                            │ HTTPS/REST
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│                                                                       │
│                   REACT FRONTEND (Vercel)                            │
│                                                                       │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐          │
│  │ Voice Record  │  │   Incident    │  │   Dashboard   │          │
│  │  & Playback   │  │ Verification  │  │  & Analytics  │          │
│  └───────────────┘  └───────────────┘  └───────────────┘          │
│                                                                       │
└───────────────────────────┬───────────────────────────────────────────┘
                            │
                            │ JWT + REST API
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│                                                                       │
│              EXPRESS.JS API GATEWAY (Render)                         │
│                                                                       │
│  ┌──────────────────────────────────────────────────────┐           │
│  │            Middleware Pipeline                        │           │
│  │  [Auth] → [Validation] → [Rate Limit] → [Upload]    │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────┐ │
│  │   Auth     │  │   Voice    │  │    AI      │  │   Incident   │ │
│  │ Controller │  │ Controller │  │ Controller │  │  Controller  │ │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └──────┬───────┘ │
│        │               │               │                 │          │
│  ┌─────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐  ┌──────▼───────┐ │
│  │   Auth     │  │   Audio    │  │  Pipeline  │  │   Incident   │ │
│  │  Service   │  │  Service   │  │  Service   │  │   Service    │ │
│  └────────────┘  └────────────┘  └─────┬──────┘  └──────────────┘ │
│                                         │                            │
└─────────────────────────────────────────┼────────────────────────────┘
                                          │
                ┌─────────────────────────┼─────────────────────────┐
                │                         │                         │
                │                         │                         │
┌───────────────▼─────┐     ┌─────────────▼───────┐     ┌──────────▼────────┐
│                     │     │                     │     │                   │
│  GNANI PRISMA STT   │     │  GNANI EVON v3.3   │     │  GNANI TIMBRE TTS │
│                     │     │                     │     │                   │
│  ┌───────────────┐  │     │  ┌──────────────┐  │     │  ┌─────────────┐  │
│  │ Audio → Text  │  │     │  │  Reasoning & │  │     │  │ Text → Audio│  │
│  │ Transcription │  │     │  │  Extraction  │  │     │  │  Synthesis  │  │
│  └───────────────┘  │     │  └──────────────┘  │     │  └─────────────┘  │
│                     │     │                     │     │                   │
│  API: vachana.ai    │     │  Model: HF 30B     │     │  API: vachana.ai  │
│                     │     │  External Endpoint │     │                   │
└─────────────────────┘     └─────────────────────┘     └───────────────────┘
                │                       │                         │
                └───────────────────────┼─────────────────────────┘
                                        │
                                        │ Store Logs
                                        │
                          ┌─────────────▼──────────────┐
                          │                            │
                          │   MONGODB ATLAS            │
                          │                            │
                          │  ┌──────────────────────┐  │
                          │  │ Users Collection     │  │
                          │  ├──────────────────────┤  │
                          │  │ Incidents Collection │  │
                          │  ├──────────────────────┤  │
                          │  │ AI Logs Collection   │  │
                          │  ├──────────────────────┤  │
                          │  │ History Collection   │  │
                          │  └──────────────────────┘  │
                          │                            │
                          └────────────────────────────┘
```

---

## 2. Voice-to-Incident Pipeline Flow

```
START: User opens Voice Report page
│
├─ STEP 1: VOICE RECORDING
│  │
│  ├─ User clicks microphone button
│  ├─ Browser requests microphone permission
│  ├─ MediaRecorder API starts recording
│  ├─ Live waveform visualization
│  ├─ Recording timer active
│  ├─ User speaks in Hindi/Hinglish
│  ├─ User stops recording
│  └─ Audio blob created
│
├─ STEP 2: AUDIO PREVIEW
│  │
│  ├─ Audio player displays
│  ├─ User can replay recording
│  ├─ User can re-record if needed
│  ├─ User selects language (optional)
│  └─ User confirms and uploads
│
├─ STEP 3: PRISMA TRANSCRIPTION
│  │
│  ├─ Frontend: POST /api/voice/transcribe
│  ├─ Backend: Upload middleware validates file
│  │   ├─ Check MIME type
│  │   ├─ Check file size (< 10MB)
│  │   └─ Accept if valid
│  ├─ Audio Service: Process file
│  ├─ Prisma Service: Call Gnani Prisma API
│  │   ├─ POST https://api.vachana.ai/stt/v3
│  │   ├─ Header: X-API-Key-ID
│  │   ├─ Form data: audio_file
│  │   └─ Response: transcript + language
│  ├─ Log to AIProcessingLog
│  └─ Return transcript to frontend
│
├─ STEP 4: TRANSCRIPT REVIEW
│  │
│  ├─ Display transcript to user
│  ├─ User can edit transcript
│  ├─ Track if edited (correctedTranscript)
│  └─ User proceeds to analysis
│
├─ STEP 5: EVON ANALYSIS
│  │
│  ├─ Frontend: POST /api/ai/analyze
│  ├─ Backend: Receive transcript
│  ├─ Evon Service: Build prompt
│  │   ├─ System instructions
│  │   ├─ Transcript text
│  │   ├─ Expected JSON structure
│  │   └─ Constraints (no invention)
│  ├─ Evon Service: Call inference endpoint
│  │   ├─ POST to external GPU endpoint
│  │   ├─ Model: gnani-evon-v3.3-30B
│  │   ├─ Timeout: 15 seconds
│  │   └─ Response: Generated text
│  ├─ Evon Service: Extract JSON
│  ├─ Evon Service: Validate with Zod schema
│  │   ├─ Check category enum
│  │   ├─ Check severity enum
│  │   ├─ Validate required fields
│  │   └─ Validate confidence (0-1)
│  ├─ Log to AIProcessingLog
│  └─ Return structured incident data
│
├─ STEP 6: HUMAN VERIFICATION
│  │
│  ├─ Display AI-extracted information:
│  │   ├─ Category badge
│  │   ├─ Description
│  │   ├─ Location (with verified flag)
│  │   ├─ Severity badge
│  │   ├─ Urgency reason
│  │   ├─ Recommended action
│  │   ├─ Missing information
│  │   └─ Confidence score
│  ├─ User can edit any field
│  ├─ Track user edits in userEdits array
│  ├─ User confirms or rejects
│  └─ If confirmed, proceed
│
├─ STEP 7: INCIDENT CREATION
│  │
│  ├─ Frontend: POST /api/incidents
│  ├─ Backend: Validate request (Zod)
│  ├─ Incident Service: Create document
│  │   ├─ Generate incidentId (INC-2026-XXXXX)
│  │   ├─ Link to userId
│  │   ├─ Store original transcript
│  │   ├─ Store corrected transcript (if edited)
│  │   ├─ Store AI-extracted data
│  │   ├─ Store user edits
│  │   ├─ Set verificationStatus: verified
│  │   ├─ Set status: Submitted
│  │   └─ Save to MongoDB
│  ├─ Create AIProcessingLog entry
│  └─ Return created incident
│
├─ STEP 8: VOICE CONFIRMATION
│  │
│  ├─ Frontend: Request confirmation audio
│  ├─ Backend: Generate confirmation text
│  │   ├─ Use incident data
│  │   ├─ Template in Hindi
│  │   └─ "आपकी शिकायत दर्ज हो गई है..."
│  ├─ Timbre Service: Synthesize speech
│  │   ├─ POST https://api.vachana.ai/api/v1/tts/inference
│  │   ├─ Header: X-API-Key-ID
│  │   ├─ Body: { text, voice: "Nalini", language: "hi-IN" }
│  │   └─ Response: Audio buffer (MP3)
│  ├─ Stream audio to client
│  ├─ Log to AIProcessingLog
│  └─ Frontend: Display audio player
│
├─ STEP 9: CONFIRMATION PLAYBACK
│  │
│  ├─ Audio player UI appears
│  ├─ User plays Hindi confirmation
│  ├─ Success message displays
│  └─ Option to view incident or submit another
│
└─ END: Incident successfully submitted

PARALLEL: Dashboard Updates
│
├─ Admin dashboard refreshes
├─ Statistics increment
├─ New incident appears in table
└─ Charts update
```

---

## 3. Data Flow Diagram

```
┌──────────────┐
│   USER       │
│  (Speaks)    │
└──────┬───────┘
       │
       │ Voice Recording
       ▼
┌──────────────┐
│  Audio Blob  │ ──────┐
└──────────────┘       │
                       │ Upload
                       ▼
                ┌──────────────┐
                │   PRISMA     │
                │     STT      │
                └──────┬───────┘
                       │
                       │ Transcript
                       ▼
                ┌──────────────┐
                │  Transcript  │ ──────┐
                │   (Text)     │       │
                └──────────────┘       │ Send
                                       ▼
                                ┌──────────────┐
                                │   EVON v3.3  │
                                │   Reasoning  │
                                └──────┬───────┘
                                       │
                                       │ Structured JSON
                                       ▼
                                ┌──────────────┐
                                │   Incident   │
                                │   Extraction │
                                └──────┬───────┘
                                       │
                                       │ Display
                                       ▼
┌──────────────┐                ┌──────────────┐
│   USER       │ ◄──────────────│ Verification │
│  (Verifies)  │   Review UI    │      UI      │
└──────┬───────┘                └──────────────┘
       │
       │ Confirm
       ▼
┌──────────────┐
│   MongoDB    │
│   Incident   │
└──────┬───────┘
       │
       │ Confirmation Text
       ▼
┌──────────────┐
│   TIMBRE     │
│     TTS      │
└──────┬───────┘
       │
       │ Audio
       ▼
┌──────────────┐
│   USER       │
│  (Listens)   │
└──────────────┘
```

---

## 4. Database Schema Diagram

```
┌─────────────────────────────────────────────────────┐
│                    USERS                             │
├─────────────────────────────────────────────────────┤
│ _id: ObjectId (PK)                                   │
│ name: String                                         │
│ email: String (Unique, Indexed)                      │
│ passwordHash: String                                 │
│ role: Enum['citizen', 'admin']                       │
│ preferredLanguage: String                            │
│ createdAt: Date                                      │
│ updatedAt: Date                                      │
└────────────┬────────────────────────────────────────┘
             │
             │ 1:N relationship
             │
┌────────────▼────────────────────────────────────────┐
│                   INCIDENTS                          │
├─────────────────────────────────────────────────────┤
│ _id: ObjectId (PK)                                   │
│ incidentId: String (Unique, Indexed)                 │
│ userId: ObjectId (FK → Users, Indexed)               │
│                                                      │
│ ── Incident Data ──                                  │
│ category: String                                     │
│ description: String                                  │
│ location: { name, verified, coordinates? }           │
│ severity: Enum['Low','Medium','High','Critical']     │
│ urgencyReason: String                                │
│ recommendedAction: String                            │
│ missingInformation: [String]                         │
│                                                      │
│ ── Processing Data ──                                │
│ originalTranscript: String                           │
│ correctedTranscript: String?                         │
│ language: String                                     │
│ confidence: Number?                                  │
│                                                      │
│ ── Verification Data ──                              │
│ verificationStatus: Enum['pending','verified',...]   │
│ verifiedAt: Date?                                    │
│ userEdits: [{field, originalValue, newValue, ...}]   │
│                                                      │
│ ── Workflow ──                                       │
│ status: Enum['Submitted','Under Review',...]         │
│ assignedTo: ObjectId?                                │
│ resolutionNotes: String?                             │
│ resolvedAt: Date?                                    │
│                                                      │
│ createdAt: Date (Indexed)                            │
│ updatedAt: Date                                      │
└────────────┬────────────────────────────────────────┘
             │
             │ 1:N relationship
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌───────────────┐  ┌─────────────────┐
│ AI Processing │  │ Incident History│
│     Logs      │  │                 │
├───────────────┤  ├─────────────────┤
│ _id: ObjectId │  │ _id: ObjectId   │
│ incidentId    │  │ incidentId      │
│ provider      │  │ previousStatus  │
│ model         │  │ newStatus       │
│ operation     │  │ changedBy       │
│ status        │  │ notes           │
│ processingMs  │  │ createdAt       │
│ errorMsg?     │  └─────────────────┘
│ requestId?    │
│ createdAt     │
└───────────────┘

Indexes:
────────
Users: email (unique)
Incidents: incidentId (unique), userId, status, severity, createdAt
AIProcessingLog: incidentId, createdAt
IncidentHistory: incidentId, createdAt
```

---

## 5. Frontend Component Hierarchy

```
App.tsx
│
├── AuthContext.Provider
│
└── Router
    │
    ├── Landing Page
    │   ├── Hero Section
    │   ├── Features Section
    │   ├── How It Works
    │   ├── Technology Section
    │   └── CTA Section
    │
    ├── Auth Routes
    │   ├── Login Page
    │   │   └── LoginForm
    │   └── Register Page
    │       └── RegisterForm
    │
    └── Protected Routes
        │
        ├── Dashboard Layout
        │   ├── Navbar
        │   ├── Sidebar
        │   └── Content Area
        │
        ├── User Dashboard
        │   ├── StatCard × 4
        │   ├── Quick Actions
        │   └── Recent Incidents
        │
        ├── Voice Report Page
        │   ├── LanguageSelector
        │   ├── VoiceRecorder
        │   │   ├── Microphone Button
        │   │   ├── Waveform
        │   │   └── Timer
        │   ├── AudioPlayer
        │   ├── TranscriptEditor
        │   ├── IncidentVerification
        │   │   ├── CategoryBadge
        │   │   ├── SeverityBadge
        │   │   ├── Editable Fields
        │   │   └── Confirm Button
        │   └── Confirmation Audio
        │
        ├── Incident History
        │   ├── Filters
        │   ├── IncidentCard × N
        │   └── Pagination
        │
        ├── Incident Detail
        │   ├── Header Info
        │   ├── Details Panel
        │   ├── Timeline
        │   └── Actions
        │
        └── Admin Dashboard
            ├── Statistics Panel
            │   └── StatCard × 5
            ├── Analytics Panel
            │   ├── CategoryChart
            │   ├── SeverityChart
            │   ├── StatusChart
            │   └── TimelineChart
            └── Recent Incidents Table
                ├── Filters
                ├── Table
                └── Pagination
```

---

## 6. API Request Flow

```
CLIENT                    SERVER                     AI SERVICE
  │                         │                           │
  ├─ 1. POST /auth/login ──►│                           │
  │                         ├─ Validate credentials    │
  │                         ├─ Hash check (bcrypt)     │
  │                         ├─ Generate JWT            │
  │◄── JWT token ───────────┤                           │
  │                         │                           │
  ├─ 2. POST /voice/transcribe                          │
  │    + Bearer token ──────►│                           │
  │                         ├─ Verify JWT               │
  │                         ├─ Validate audio           │
  │                         ├─ Call Prisma ────────────►│
  │                         │                           ├─ Transcribe
  │                         │◄── transcript ────────────┤
  │◄── transcript ──────────┤                           │
  │                         │                           │
  ├─ 3. POST /ai/analyze                                │
  │    + Bearer token ──────►│                           │
  │                         ├─ Verify JWT               │
  │                         ├─ Call Evon ──────────────►│
  │                         │                           ├─ Reason
  │                         │                           ├─ Extract
  │                         │◄── JSON ───────────────────┤
  │                         ├─ Validate (Zod)           │
  │◄── incident data ───────┤                           │
  │                         │                           │
  ├─ 4. POST /incidents                                 │
  │    + Bearer token ──────►│                           │
  │                         ├─ Verify JWT               │
  │                         ├─ Validate data            │
  │                         ├─ Save to MongoDB          │
  │◄── created incident ────┤                           │
  │                         │                           │
  ├─ 5. POST /voice/speak                               │
  │    + Bearer token ──────►│                           │
  │                         ├─ Verify JWT               │
  │                         ├─ Generate text            │
  │                         ├─ Call Timbre ────────────►│
  │                         │                           ├─ Synthesize
  │                         │◄── audio ──────────────────┤
  │◄── audio stream ────────┤                           │
  │                         │                           │
```

---

## 7. Security Architecture

```
┌─────────────────────────────────────────────────────┐
│              SECURITY LAYERS                         │
└─────────────────────────────────────────────────────┘

Layer 1: Network Security
┌─────────────────────────────────────────────────────┐
│ ▪ HTTPS only (TLS 1.2+)                              │
│ ▪ CORS configuration (whitelist origins)             │
│ ▪ Rate limiting (100 req/15min per IP)               │
│ ▪ Request size limits (10MB uploads)                 │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
Layer 2: Application Security
┌─────────────────────────────────────────────────────┐
│ ▪ Helmet.js security headers                         │
│ ▪ Input sanitization (XSS prevention)                │
│ ▪ NoSQL injection prevention (Mongoose)              │
│ ▪ File upload validation (MIME + size)               │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
Layer 3: Authentication & Authorization
┌─────────────────────────────────────────────────────┐
│ ▪ JWT tokens (HS256, 24h expiration)                 │
│ ▪ bcrypt password hashing (10 rounds)                │
│ ▪ Role-based access control (RBAC)                   │
│ ▪ Protected route middleware                         │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
Layer 4: Data Security
┌─────────────────────────────────────────────────────┐
│ ▪ Environment variable secrets                       │
│ ▪ MongoDB access control                             │
│ ▪ No API keys in client code                         │
│ ▪ Temporary file cleanup                             │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
Layer 5: Audit & Monitoring
┌─────────────────────────────────────────────────────┐
│ ▪ Comprehensive logging (Winston)                    │
│ ▪ AI operation tracking                              │
│ ▪ User action audit trail                            │
│ ▪ Error tracking and alerting                        │
└─────────────────────────────────────────────────────┘
```

---

## 8. Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                  PRODUCTION ENVIRONMENT              │
└─────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│   VERCEL CDN     │         │   RENDER CLOUD   │
│                  │         │                  │
│  React Frontend  │◄────────► Express Backend  │
│  - Static files  │  HTTPS  │  - REST API      │
│  - Edge caching  │         │  - JWT auth      │
│  - Auto SSL      │         │  - AI services   │
└──────────────────┘         └────────┬─────────┘
                                      │
                                      │ TLS
                                      │
                             ┌────────▼─────────┐
                             │  MONGODB ATLAS   │
                             │                  │
                             │  - Cloud DB      │
                             │  - Auto backup   │
                             │  - Monitoring    │
                             └──────────────────┘

External Services:
┌─────────────────────────────────────────────────────┐
│ Gnani Prisma API    ──► https://api.vachana.ai      │
│ Gnani Timbre API    ──► https://api.vachana.ai      │
│ Evon Inference      ──► External GPU endpoint        │
└─────────────────────────────────────────────────────┘

CI/CD:
┌─────────────────────────────────────────────────────┐
│ GitHub Repository                                    │
│   │                                                  │
│   ├──► Push to main                                 │
│   │                                                  │
│   ├──► Vercel auto-deploy (frontend)                │
│   │                                                  │
│   └──► Render auto-deploy (backend)                 │
└─────────────────────────────────────────────────────┘
```

---

## 9. Error Handling Flow

```
                    ┌─────────────┐
                    │   REQUEST   │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Validation  │
                    │ Middleware  │
                    └──────┬──────┘
                           │
                  ┌────────┴────────┐
                  │                 │
            Valid │                 │ Invalid
                  │                 │
                  ▼                 ▼
         ┌─────────────┐    ┌──────────────┐
         │  Process    │    │ 400 Bad      │
         │  Request    │    │ Request      │
         └──────┬──────┘    └──────────────┘
                │
        ┌───────┴────────┐
        │                │
   Success              Error
        │                │
        ▼                ▼
┌──────────────┐  ┌──────────────┐
│ 200 OK       │  │ Try/Catch    │
│ Response     │  │ Block        │
└──────────────┘  └──────┬───────┘
                         │
                ┌────────┴────────┐
                │                 │
        Known Error         Unknown Error
                │                 │
                ▼                 ▼
        ┌──────────────┐  ┌──────────────┐
        │ Specific     │  │ 500 Internal │
        │ Error Code   │  │ Server Error │
        └──────────────┘  └──────────────┘
                │                 │
                └────────┬────────┘
                         │
                         ▼
                 ┌──────────────┐
                 │ Log Error    │
                 │ (Winston)    │
                 └──────┬───────┘
                        │
                        ▼
                 ┌──────────────┐
                 │ Return JSON  │
                 │ Error Resp   │
                 └──────────────┘
```

---

This completes the comprehensive architecture diagrams for AwaazSetu AI!
