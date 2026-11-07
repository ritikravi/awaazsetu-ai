# AwaazSetu AI — Deployment Guide

## Architecture
- **Frontend**: Vercel (React + Vite)
- **Backend**: Render (Node.js + Express)
- **Database**: MongoDB Atlas
- **AI Services**: Gnani API (Prisma, Timbre) + External GPU endpoint (Evon)

---

## 1. MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com and create a free cluster
2. Create a database user with read/write access
3. Whitelist all IPs: `0.0.0.0/0` (for Render)
4. Get connection string — replace `<password>` with your DB user password:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/awaazsetu?retryWrites=true&w=majority
   ```

---

## 2. Gnani AI Keys

Register at https://gnani.ai to get:
- `PRISMA_API_KEY_ID` — for Speech-to-Text
- `TIMBRE_API_KEY_ID` — for Text-to-Speech

For Evon v3.3 (30B model), you need a GPU inference endpoint:

**Option A: Hugging Face Inference API**
```
Model: gnani/gnani-evon-v3.3-30B-A3B
Endpoint: https://api-inference.huggingface.co/models/gnani/gnani-evon-v3.3-30B-A3B
```

**Option B: Self-hosted (A100/H100 GPU)**
```bash
pip install vllm
python -m vllm.entrypoints.openai.api_server \
  --model gnani/gnani-evon-v3.3-30B-A3B \
  --host 0.0.0.0 --port 8000
```
Then set: `EVON_INFERENCE_ENDPOINT=http://your-server:8000/v1/completions`

---

## 3. Backend — Deploy to Render

1. Push code to GitHub
2. Go to https://render.com → New Web Service
3. Connect your GitHub repository
4. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
5. Add all environment variables from `server/.env.example`
6. Set `CORS_ORIGIN` to your Vercel frontend URL
7. Deploy — note your Render URL (e.g. `https://awaazsetu-api.onrender.com`)

---

## 4. Frontend — Deploy to Vercel

1. Go to https://vercel.com → New Project
2. Import your GitHub repository
3. Configure:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable:
   ```
   VITE_API_URL=https://awaazsetu-api.onrender.com/api
   ```
5. Deploy

---

## 5. Seed Demo Data

After backend is live, run the seed script:
```bash
cd server
MONGODB_URI="your-atlas-uri" npx ts-node src/scripts/seed.ts
```

Demo accounts created:
- Citizen: `demo@awaazsetu.ai` / `Demo@1234`
- Admin: `admin@awaazsetu.ai` / `Admin@1234`

---

## 6. Verify Deployment

```bash
# Health check
curl https://awaazsetu-api.onrender.com/health

# AI services status
curl https://awaazsetu-api.onrender.com/api/ai/health
```

Expected: All three Gnani services show their status (unavailable until keys are set).

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Strong random secret (32+ chars) |
| `PRISMA_API_KEY_ID` | ✅ for STT | Gnani Prisma API key |
| `TIMBRE_API_KEY_ID` | ✅ for TTS | Gnani Timbre API key |
| `EVON_INFERENCE_ENDPOINT` | ✅ for AI | GPU inference endpoint URL |
| `CORS_ORIGIN` | ✅ | Frontend URL (Vercel) |
| `NODE_ENV` | ✅ | `production` |
| `PORT` | ✅ | Server port (5001) |

---

## Graceful Degradation

The app starts and functions even without all Gnani keys:
- Missing Prisma key → STT returns `SERVICE_UNAVAILABLE` error, audio upload UI shows error
- Missing Evon endpoint → AI analysis returns `SERVICE_UNAVAILABLE`, user can still manually enter incident
- Missing Timbre key → TTS skips audio confirmation, incident still submits successfully

Check `/api/ai/health` to see which services are operational.
