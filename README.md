# 🎙️ AwaazSetu AI

**Voice-to-Action Intelligence Platform for India's Frontline Workforce**

> *Speak naturally. Understand intelligently. Take action.*

Built for the **Great Indian AI Internship Challenge 2026 by Gnani AI**

---

## 🌟 What is AwaazSetu AI?

AwaazSetu AI lets frontline workers, citizens and field personnel report infrastructure problems using **natural Hindi/Hinglish speech** — no forms, no typing, no English required.

A user speaks → **Gnani Prisma** transcribes → **Gnani Evon v3.3** extracts a structured incident → human verifies → saved to MongoDB → **Gnani Timbre** speaks a Hindi confirmation back.

---

## 🤖 Gnani AI Integration

| Model | Purpose | Endpoint |
|-------|---------|----------|
| **Prisma** | Hindi/Hinglish speech → text | `api.vachana.ai/stt/v3` |
| **Evon v3.3** | Transcript → structured incident JSON | `gnani-evon-v3.3-30B-A3B` |
| **Timbre** | Confirmation text → Hindi audio | `api.vachana.ai/api/v1/tts/inference` |

---

## 🏗️ Tech Stack

**Frontend**: React 18 · TypeScript · Vite · Tailwind CSS · TanStack Query · Recharts · Lucide  
**Backend**: Node.js · Express · TypeScript · MongoDB Atlas · Mongoose · JWT · Zod  
**AI**: Gnani Prisma · Gnani Evon v3.3 · Gnani Timbre  
**Deploy**: Vercel (frontend) · Render (backend) · MongoDB Atlas  

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Gnani AI API keys (Prisma + Timbre)

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/awaazsetu-ai.git
cd awaazsetu-ai

# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### 2. Configure Backend
```bash
cd server
cp .env.example .env
# Edit .env — add MongoDB URI, JWT secret, Gnani keys
```

### 3. Seed Demo Data
```bash
cd server
npx ts-node src/scripts/seed.ts
```

### 4. Run
```bash
# Terminal 1 — Backend (port 5001)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

Open http://localhost:5173

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Citizen | `demo@awaazsetu.ai` | `Demo@1234` |
| Admin | `admin@awaazsetu.ai` | `Admin@1234` |

---

## 📁 Project Structure

```
awaazsetu-ai/
├── client/                    # React frontend (Vite)
│   └── src/
│       ├── pages/             # Landing, Login, Register, Dashboard,
│       │                      # VoiceReport, IncidentDetail, AdminDashboard
│       ├── components/        # SeverityBadge, StatusBadge, ProtectedRoute
│       ├── layouts/           # DashboardLayout (sidebar + topbar)
│       ├── context/           # AuthContext (JWT state)
│       ├── hooks/             # useVoiceRecorder (MediaRecorder API)
│       └── types/             # Shared TypeScript types
│
├── server/                    # Express backend
│   └── src/
│       ├── models/            # User, Incident, AIProcessingLog, IncidentHistory
│       ├── controllers/       # auth, voice, ai, incident, dashboard
│       ├── services/
│       │   └── gnani/         # prisma.service, evon.service, timbre.service
│       ├── middleware/        # auth, validate, upload, rateLimiter, errorHandler
│       └── scripts/           # seed.ts (demo data)
│
└── docs/                      # Architecture, API reference, deployment guide
```

---

## 🔌 API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register user |
| POST | `/api/auth/login` | — | Login, get JWT |
| GET | `/api/auth/me` | JWT | Get current user |
| POST | `/api/voice/transcribe` | JWT | Audio → text (Prisma) |
| POST | `/api/voice/speak` | JWT | Text → audio (Timbre) |
| POST | `/api/ai/analyze` | JWT | Transcript → incident (Evon) |
| GET | `/api/ai/health` | — | AI services status |
| POST | `/api/incidents` | JWT | Create incident |
| GET | `/api/incidents` | JWT | List incidents |
| GET | `/api/incidents/:id` | JWT | Get + history |
| PATCH | `/api/incidents/:id` | JWT | Edit fields |
| PATCH | `/api/incidents/:id/status` | Admin | Update workflow status |
| GET | `/api/dashboard/stats` | JWT | KPI counts |
| GET | `/api/dashboard/analytics` | JWT | Charts data |
| GET | `/health` | — | Server health |

Full docs: [docs/api-reference.md](docs/api-reference.md)

---

## 🔐 Security

- JWT authentication (24h expiry)
- bcrypt password hashing (10 rounds)
- Rate limiting: 100 req/15min global, 10/15min on auth
- Zod input validation on every endpoint
- Multer file validation (MIME type + 10MB limit)
- Helmet.js security headers
- CORS restricted to frontend origin
- No API keys in client code

---

## 📊 Features

### For Citizens / Field Workers
- 🎤 Voice recording with live waveform
- 🌐 Hindi & Hinglish language support
- ✏️ Transcript editing before AI analysis
- ✅ Human verification of AI extraction
- 🔊 Hindi voice confirmation (Timbre)
- 📋 Personal incident history

### For Administrators
- 📈 Real-time dashboard with KPIs
- 📊 Charts: category, severity, status, timeline
- 🔄 Status workflow management
- 📝 Resolution notes
- 📋 Full incident audit history

---

## 📖 Documentation

| Doc | Description |
|-----|-------------|
| [Architecture](docs/architecture.md) | System design, data flow, DB schema |
| [API Reference](docs/api-reference.md) | All endpoints with examples |
| [Model Integration](docs/model-integration.md) | Gnani AI implementation guide |
| [Deployment](docs/deployment.md) | Vercel + Render + Atlas setup |
| [Testing](docs/testing.md) | Test results and test cases |

---

## 🎬 60-Second Demo Script

1. **0:00** — Open app, show landing page explaining 3 Gnani models
2. **0:10** — Login as demo citizen
3. **0:15** — Click "Report Incident", select Hindi
4. **0:20** — Record: *"गांव की सड़क पर पानी की पाइपलाइन फूट गई है"*
5. **0:30** — Show Prisma transcript appearing
6. **0:35** — Click Analyze — show Evon extracting: Water Leakage, High, location
7. **0:45** — Review & confirm the incident
8. **0:50** — Play Timbre Hindi audio confirmation
9. **0:55** — Switch to Admin, show dashboard updated with new incident

---

## ⚠️ Graceful Degradation

The app runs without Gnani keys. Each service degrades independently:

| Missing | Effect |
|---------|--------|
| Prisma key | STT fails gracefully, user sees clear error |
| Evon endpoint | AI analysis unavailable, user can enter manually |
| Timbre key | No audio confirmation, incident still submits |

Check service status: `GET /api/ai/health`

---

## 🏆 Competition Notes

- ✅ All 3 Gnani models meaningfully integrated (not decorative)
- ✅ Not a chatbot — purpose-built voice-first incident platform
- ✅ Solves real problem: literacy/language barriers for frontline workers
- ✅ Production-quality: TypeScript, validation, auth, rate limiting, logging
- ✅ Human-in-the-loop verification workflow
- ✅ Complete with seeded demo data and deployment configs

---

## 👤 Author

Built solo for the Great Indian AI Internship Challenge 2026 by Gnani AI.

---

*AwaazSetu — आवाज़ सेतु — Voice Bridge*
