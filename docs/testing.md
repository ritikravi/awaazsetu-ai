# AwaazSetu AI — Testing Documentation

## Test Results (Phase 9)

All tests run against: `http://localhost:5001` (MongoDB Atlas connected)

---

## 1. Authentication Tests ✅

| Test | Result | Notes |
|------|--------|-------|
| POST /auth/register — valid data | ✅ 201 Created | User persisted, JWT returned |
| POST /auth/register — duplicate email | ✅ 409 Conflict | `DUPLICATE_EMAIL` error code |
| POST /auth/register — weak password | ✅ 400 Bad Request | Zod validation fires |
| POST /auth/login — valid credentials | ✅ 200 OK | JWT + user object returned |
| POST /auth/login — wrong password | ✅ 401 Unauthorized | Generic error (no info leakage) |
| GET /auth/me — valid token | ✅ 200 OK | User object, no passwordHash |
| GET /auth/me — no token | ✅ 401 Unauthorized | `AUTH_FAILED` error code |
| GET /auth/me — expired token | ✅ 401 Unauthorized | `TOKEN_EXPIRED` error code |

---

## 2. Incident CRUD Tests ✅

| Test | Result | Notes |
|------|--------|-------|
| POST /incidents — valid payload | ✅ 201 Created | incidentId generated, MongoDB persisted |
| POST /incidents — missing required field | ✅ 400 Bad Request | Zod validation |
| POST /incidents — invalid category | ✅ 400 Bad Request | Enum validation |
| GET /incidents — citizen (own only) | ✅ 200 OK | Filters to requesting user |
| GET /incidents — admin (all) | ✅ 200 OK | Returns all incidents |
| GET /incidents/:id — own incident | ✅ 200 OK | Full incident + history |
| GET /incidents/:id — other user's | ✅ 403 Forbidden | Auth check enforced |
| PATCH /incidents/:id — valid edit | ✅ 200 OK | userEdits array populated |
| PATCH /incidents/:id/status — admin | ✅ 200 OK | Status updated, history created |
| PATCH /incidents/:id/status — citizen | ✅ 403 Forbidden | Role check enforced |
| GET /incidents/:id/history | ✅ 200 OK | History with changedBy populated |

---

## 3. Dashboard & Analytics Tests ✅

| Test | Result | Notes |
|------|--------|-------|
| GET /dashboard/stats | ✅ 200 OK | Correct counts returned |
| GET /dashboard/analytics | ✅ 200 OK | All distributions correct |
| GET /dashboard/analytics?startDate=... | ✅ 200 OK | Date filtering works |

**Verified Stats (with seeded data):**
```
totalIncidents:       6
newIncidents:         6
pendingVerification:  0
highPriority:         5
resolved:             1
```

**Verified Analytics:**
```
Category Distribution:
  Water Leakage        2
  Drainage Problem     1
  Electrical Hazard    1
  Road Damage          1
  Waste Management     1

Severity Distribution:
  Critical   2
  High       3
  Medium     1

Status Distribution:
  Submitted     2
  Under Review  1
  In Progress   1
  Assigned      1
  Resolved      1
```

---

## 4. AI Service Health Tests ✅

| Test | Result | Notes |
|------|--------|-------|
| GET /api/ai/health — no keys | ✅ 200 OK | All show `unavailable` (expected) |
| Graceful degradation on missing key | ✅ Pass | Returns `SERVICE_UNAVAILABLE`, no crash |

---

## 5. Rate Limiting Tests ✅

| Test | Result |
|------|--------|
| Auth routes limited to 10/15min | ✅ 429 returned after threshold |
| Global API limited to 100/15min | ✅ Working |

---

## 6. Input Validation Tests ✅

| Test | Result |
|------|--------|
| SQL injection attempt in email | ✅ Rejected by Zod |
| Empty transcript to /ai/analyze | ✅ 400 Bad Request |
| Oversized text to /voice/speak | ✅ 400 Bad Request |
| Invalid severity enum | ✅ 400 Bad Request |

---

## 7. Frontend Build Tests ✅

| Test | Result |
|------|--------|
| TypeScript compilation | ✅ 0 errors |
| Vite production build | ✅ Success |
| Bundle size | ✅ 753KB JS (Recharts large — expected) |
| CSS build | ✅ 22KB minified |

---

## 8. Audio Pipeline Tests (Manual)

These require Gnani API keys to run. When keys are available:

### Prisma STT Test
```bash
curl -X POST http://localhost:5001/api/voice/transcribe \
  -H "Authorization: Bearer TOKEN" \
  -F "audio=@tests/samples/hindi_water_leak.wav" \
  -F "language=hi-IN"
```
Expected: Hindi transcript of water leak report

### Timbre TTS Test
```bash
curl -X POST http://localhost:5001/api/voice/speak \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"आपकी शिकायत दर्ज हो गई है","language":"hi-IN"}' \
  --output confirmation.mp3
```
Expected: Hindi audio file

### Evon Analysis Test
```bash
curl -X POST http://localhost:5001/api/ai/analyze \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"transcript":"गांव की सड़क पर पानी की पाइपलाइन फूट गई है","language":"hi-IN"}'
```
Expected: Structured JSON with category=Water Leakage, severity=High

---

## 9. End-to-End Flow Test (Manual)

1. Open http://localhost:5173
2. Register new account
3. Navigate to "Report Incident"
4. Record voice saying: *"मेरे घर के पास सड़क में बड़ा गड्ढा है, गाड़ियां रुकती हैं"*
5. Submit for transcription (Prisma)
6. Review transcript, click Analyze
7. Verify Evon extraction: category=Road Damage, severity=Medium/High
8. Edit location, confirm details
9. Submit incident
10. Play Timbre Hindi audio confirmation
11. Check dashboard for new incident

---

## Sample Test Audio Scripts

### Hindi (Clean)
> "मेरे गाँव की मुख्य सड़क पर पिछले तीन दिनों से पानी की पाइपलाइन से पानी बह रहा है। इससे सड़क पर कीचड़ हो गया है और आने-जाने में बहुत परेशानी हो रही है।"

Expected extraction:
- Category: Water Leakage
- Severity: Medium-High
- Missing info: exact location

### Hinglish (Mixed)
> "Yaar, humari colony ke main road pe ek bada sa pothole hai, kaafi deep hai. Kal teen bikes girein usme. Urgent fix karna chahiye."

Expected extraction:
- Category: Road Damage
- Severity: High
- Location: colony main road (unverified)

### Noisy Audio
- Same scripts recorded with background noise
- Expected: Lower confidence score
- Transcript may need user correction
