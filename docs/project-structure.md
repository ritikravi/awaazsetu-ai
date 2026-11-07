# AwaazSetu AI - Project Structure

## Complete Directory Structure

```
awaazsetu-ai/
│
├── client/                          # React Frontend Application
│   ├── public/
│   │   ├── favicon.ico
│   │   └── logo.png
│   │
│   ├── src/
│   │   ├── components/              # React Components
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   │
│   │   │   ├── voice/
│   │   │   │   ├── VoiceRecorder.tsx
│   │   │   │   ├── Waveform.tsx
│   │   │   │   ├── AudioPlayer.tsx
│   │   │   │   ├── LanguageSelector.tsx
│   │   │   │   └── TranscriptEditor.tsx
│   │   │   │
│   │   │   ├── incident/
│   │   │   │   ├── IncidentCard.tsx
│   │   │   │   ├── IncidentForm.tsx
│   │   │   │   ├── IncidentVerification.tsx
│   │   │   │   ├── CategoryBadge.tsx
│   │   │   │   ├── SeverityBadge.tsx
│   │   │   │   └── IncidentStatusBadge.tsx
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── StatCard.tsx
│   │   │   │   ├── IncidentChart.tsx
│   │   │   │   ├── CategoryChart.tsx
│   │   │   │   ├── SeverityChart.tsx
│   │   │   │   ├── TimelineChart.tsx
│   │   │   │   └── RecentIncidents.tsx
│   │   │   │
│   │   │   └── common/
│   │   │       ├── Navbar.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       ├── Footer.tsx
│   │   │       ├── LoadingSpinner.tsx
│   │   │       ├── ErrorBoundary.tsx
│   │   │       ├── Button.tsx
│   │   │       ├── Input.tsx
│   │   │       └── Card.tsx
│   │   │
│   │   ├── pages/                   # Page Components
│   │   │   ├── Landing.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── VoiceReport.tsx
│   │   │   ├── IncidentDetail.tsx
│   │   │   ├── IncidentHistory.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── Settings.tsx
│   │   │
│   │   ├── layouts/                 # Layout Components
│   │   │   ├── MainLayout.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── AuthLayout.tsx
│   │   │
│   │   ├── hooks/                   # Custom React Hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useVoiceRecorder.ts
│   │   │   ├── useAudioPlayer.ts
│   │   │   ├── useIncidents.ts
│   │   │   └── useAnalytics.ts
│   │   │
│   │   ├── services/                # API Services
│   │   │   ├── api.ts              # Axios instance
│   │   │   ├── auth.service.ts
│   │   │   ├── voice.service.ts
│   │   │   ├── incident.service.ts
│   │   │   └── analytics.service.ts
│   │   │
│   │   ├── context/                 # React Context
│   │   │   └── AuthContext.tsx
│   │   │
│   │   ├── utils/                   # Utility Functions
│   │   │   ├── audioUtils.ts
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── constants.ts
│   │   │
│   │   ├── types/                   # TypeScript Types
│   │   │   ├── user.types.ts
│   │   │   ├── incident.types.ts
│   │   │   └── api.types.ts
│   │   │
│   │   ├── App.tsx                  # Main App Component
│   │   ├── main.tsx                 # Entry Point
│   │   ├── index.css                # Global Styles
│   │   └── vite-env.d.ts
│   │
│   ├── .env.example
│   ├── .eslintrc.json
│   ├── .prettierrc
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/                          # Node.js Backend Application
│   ├── src/
│   │   ├── config/                  # Configuration Files
│   │   │   ├── database.ts
│   │   │   ├── env.ts
│   │   │   ├── gnani.config.ts
│   │   │   └── constants.ts
│   │   │
│   │   ├── controllers/             # Route Controllers
│   │   │   ├── auth.controller.ts
│   │   │   ├── voice.controller.ts
│   │   │   ├── ai.controller.ts
│   │   │   ├── incident.controller.ts
│   │   │   └── dashboard.controller.ts
│   │   │
│   │   ├── routes/                  # API Routes
│   │   │   ├── auth.routes.ts
│   │   │   ├── voice.routes.ts
│   │   │   ├── ai.routes.ts
│   │   │   ├── incident.routes.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── services/                # Business Logic Services
│   │   │   ├── auth.service.ts
│   │   │   ├── audio.service.ts
│   │   │   ├── incident.service.ts
│   │   │   ├── analytics.service.ts
│   │   │   ├── incident-pipeline.service.ts
│   │   │   │
│   │   │   └── gnani/               # Gnani AI Adapters
│   │   │       ├── prisma.service.ts
│   │   │       ├── evon.service.ts
│   │   │       └── timbre.service.ts
│   │   │
│   │   ├── models/                  # Mongoose Models
│   │   │   ├── User.model.ts
│   │   │   ├── Incident.model.ts
│   │   │   ├── AIProcessingLog.model.ts
│   │   │   └── IncidentHistory.model.ts
│   │   │
│   │   ├── middleware/              # Express Middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validate.middleware.ts
│   │   │   ├── upload.middleware.ts
│   │   │   ├── rateLimiter.middleware.ts
│   │   │   └── errorHandler.middleware.ts
│   │   │
│   │   ├── validators/              # Zod Validators
│   │   │   ├── auth.validator.ts
│   │   │   ├── incident.validator.ts
│   │   │   └── voice.validator.ts
│   │   │
│   │   ├── utils/                   # Utility Functions
│   │   │   ├── logger.ts
│   │   │   ├── errorTypes.ts
│   │   │   ├── helpers.ts
│   │   │   └── confirmationTemplates.ts
│   │   │
│   │   ├── types/                   # TypeScript Types
│   │   │   ├── express.d.ts
│   │   │   ├── incident.types.ts
│   │   │   └── gnani.types.ts
│   │   │
│   │   ├── app.ts                   # Express App Setup
│   │   └── server.ts                # Server Entry Point
│   │
│   ├── uploads/                     # Temporary Audio Files
│   │   └── .gitkeep
│   │
│   ├── .env.example
│   ├── .eslintrc.json
│   ├── .prettierrc
│   ├── package.json
│   ├── tsconfig.json
│   └── nodemon.json
│
├── docs/                            # Documentation
│   ├── architecture.md              # System Architecture
│   ├── api-reference.md             # API Documentation
│   ├── model-integration.md         # Gnani AI Integration Guide
│   ├── development-plan.md          # Development Timeline
│   ├── testing.md                   # Testing Strategy
│   ├── deployment.md                # Deployment Guide
│   └── project-structure.md         # This file
│
├── .gitignore
├── README.md
├── LICENSE
└── CONTRIBUTING.md

```

---

## File Descriptions

### Frontend Files

#### Components
- **auth/**: Authentication forms and protected routes
- **voice/**: Voice recording, playback, and audio visualization
- **incident/**: Incident cards, forms, and verification UI
- **dashboard/**: Statistics cards and analytics charts
- **common/**: Reusable UI components

#### Pages
- **Landing.tsx**: Marketing landing page
- **Login/Register.tsx**: Authentication pages
- **Dashboard.tsx**: User dashboard
- **VoiceReport.tsx**: Main voice reporting interface
- **IncidentDetail.tsx**: Detailed incident view
- **AdminDashboard.tsx**: Admin control panel

#### Services
- **api.ts**: Configured Axios instance
- **auth.service.ts**: Authentication API calls
- **voice.service.ts**: Voice processing API calls
- **incident.service.ts**: Incident CRUD operations

#### Hooks
- **useAuth.ts**: Authentication state management
- **useVoiceRecorder.ts**: Voice recording logic
- **useAudioPlayer.ts**: Audio playback logic
- **useIncidents.ts**: Incident queries with TanStack Query

### Backend Files

#### Controllers
- Handle HTTP requests
- Call service layer
- Format responses
- Handle errors

#### Services
- Business logic implementation
- Database operations
- External API integrations
- Data transformations

#### Gnani Services
- **prisma.service.ts**: Speech-to-text adapter
- **evon.service.ts**: Reasoning engine adapter
- **timbre.service.ts**: Text-to-speech adapter

#### Models
- Mongoose schema definitions
- Database validation
- Indexes and relationships

#### Middleware
- **auth.middleware.ts**: JWT verification
- **validate.middleware.ts**: Request validation with Zod
- **upload.middleware.ts**: File upload handling with Multer
- **rateLimiter.middleware.ts**: Rate limiting
- **errorHandler.middleware.ts**: Centralized error handling

#### Validators
- Zod schemas for request validation
- Type-safe validation
- Custom validation rules

---

## Technology Mapping

### Frontend Stack
```
React (UI Framework)
  ├── Vite (Build Tool)
  ├── TypeScript (Type Safety)
  ├── Tailwind CSS (Styling)
  ├── React Router (Navigation)
  ├── TanStack Query (State Management)
  ├── Axios (HTTP Client)
  ├── Recharts (Charts)
  └── Lucide React (Icons)
```

### Backend Stack
```
Node.js (Runtime)
  ├── Express (Web Framework)
  ├── TypeScript (Type Safety)
  ├── MongoDB + Mongoose (Database)
  ├── JWT (Authentication)
  ├── bcrypt (Password Hashing)
  ├── Zod (Validation)
  ├── Multer (File Uploads)
  ├── Winston (Logging)
  ├── Helmet (Security)
  └── CORS (Cross-Origin)
```

### AI Integration
```
Gnani AI Platform
  ├── Prisma (STT)
  ├── Evon v3.3 (Reasoning)
  └── Timbre (TTS)
```

---

## Data Flow

### Voice-to-Incident Pipeline

```
1. User Records Voice
   └── client/src/hooks/useVoiceRecorder.ts

2. Upload Audio
   └── client/src/services/voice.service.ts
   └── server/src/middleware/upload.middleware.ts

3. Transcribe with Prisma
   └── server/src/services/gnani/prisma.service.ts

4. Analyze with Evon
   └── server/src/services/gnani/evon.service.ts

5. Validate & Store
   └── server/src/services/incident.service.ts
   └── server/src/models/Incident.model.ts

6. Generate Confirmation
   └── server/src/services/gnani/timbre.service.ts

7. Play Audio
   └── client/src/hooks/useAudioPlayer.ts
```

---

## Development Workflow

### Setup
1. Clone repository
2. Install dependencies (client + server)
3. Configure environment variables
4. Start MongoDB
5. Run development servers

### Development
1. Backend: `npm run dev` (nodemon with ts-node)
2. Frontend: `npm run dev` (Vite dev server)
3. Code changes hot-reload

### Testing
1. Backend: `npm test`
2. Frontend: `npm test`
3. E2E: Manual testing

### Deployment
1. Push to GitHub
2. Vercel auto-deploys frontend
3. Render auto-deploys backend
4. MongoDB Atlas (managed)

---

## Key Design Patterns

### Backend
- **Service Layer Pattern**: Separation of business logic
- **Repository Pattern**: Database abstraction
- **Adapter Pattern**: AI service integration
- **Middleware Chain**: Request processing pipeline
- **Error Handling**: Centralized error management

### Frontend
- **Container/Presenter Pattern**: Smart vs presentational components
- **Custom Hooks Pattern**: Reusable stateful logic
- **Context Pattern**: Global state management
- **Service Pattern**: API abstraction
- **Layout Pattern**: Consistent page structure

---

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
PRISMA_API_KEY_ID=...
EVON_INFERENCE_ENDPOINT=...
TIMBRE_API_KEY_ID=...
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

---

## Build Commands

### Development
```bash
# Backend
cd server && npm run dev

# Frontend
cd client && npm run dev
```

### Production Build
```bash
# Backend
cd server && npm run build

# Frontend
cd client && npm run build
```

### Testing
```bash
# Backend
cd server && npm test

# Frontend
cd client && npm test
```

---

## Port Configuration

| Service | Port | URL |
|---------|------|-----|
| Frontend Dev | 5173 | http://localhost:5173 |
| Backend Dev | 5000 | http://localhost:5000 |
| MongoDB | 27017 | localhost:27017 |

---

This structure provides:
- Clear separation of concerns
- Modular architecture
- Scalable organization
- Easy navigation
- Type safety throughout
- Comprehensive testing capability
