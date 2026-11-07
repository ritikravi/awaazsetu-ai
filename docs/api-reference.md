# AwaazSetu AI - API Reference

## Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://awaazsetu-api.onrender.com/api`

## Authentication
Most endpoints require JWT authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "Rajesh Kumar",
  "email": "rajesh@example.com",
  "password": "SecurePass123!",
  "role": "citizen",
  "preferredLanguage": "hi-IN"
}
```

**Validation:**
- `name`: Required, min 2 characters
- `email`: Required, valid email format
- `password`: Required, min 8 characters
- `role`: Optional, enum: ['citizen', 'admin'], default: 'citizen'
- `preferredLanguage`: Optional, default: 'hi-IN'

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Rajesh Kumar",
      "email": "rajesh@example.com",
      "role": "citizen",
      "preferredLanguage": "hi-IN"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors:**
- `400`: Validation error
- `409`: Email already exists

---

### Login
**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "rajesh@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Rajesh Kumar",
      "email": "rajesh@example.com",
      "role": "citizen"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors:**
- `400`: Missing credentials
- `401`: Invalid credentials

---

### Get Current User
**GET** `/auth/me`

Get authenticated user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Rajesh Kumar",
      "email": "rajesh@example.com",
      "role": "citizen",
      "preferredLanguage": "hi-IN",
      "createdAt": "2026-01-15T10:30:00.000Z"
    }
  }
}
```

**Errors:**
- `401`: Invalid or expired token

---

## Voice Processing Endpoints

### Transcribe Audio
**POST** `/voice/transcribe`

Convert audio to text using Gnani Prisma STT.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `audio`: Audio file (required)
  - Supported formats: audio/wav, audio/mp3, audio/mpeg, audio/ogg
  - Max size: 10MB
- `language`: Language code (optional)
  - Options: 'hi-IN', 'en-IN'
  - Auto-detected if not provided

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "transcript": "गांव की सड़क पर पानी की पाइपलाइन फूट गई है",
    "language": "hi-IN",
    "processingTimeMs": 2340,
    "requestId": "prisma_req_12345"
  }
}
```

**Errors:**
- `400`: Invalid file format or size
- `401`: Unauthorized
- `500`: Transcription service error
- `504`: Transcription timeout

---

### Generate Speech
**POST** `/voice/speak`

Convert text to speech using Gnani Timbre TTS.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "आपकी शिकायत सफलतापूर्वक दर्ज कर ली गई है",
  "language": "hi-IN",
  "voice": "Nalini"
}
```

**Validation:**
- `text`: Required, max 500 characters
- `language`: Optional, default: 'hi-IN'
- `voice`: Optional, default: 'Nalini'

**Response:** `200 OK`
```
Content-Type: audio/mpeg
Content-Length: <audio_size>

<binary audio data>
```

**Errors:**
- `400`: Invalid text or parameters
- `401`: Unauthorized
- `500`: TTS service error

---

## AI Analysis Endpoints

### Analyze Incident
**POST** `/ai/analyze`

Analyze transcript and extract structured incident information using Gnani Evon.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "transcript": "गांव की सड़क पर पानी की पाइपलाइन फूट गई है और पानी बह रहा है",
  "language": "hi-IN"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "category": "Water Leakage",
    "description": "Pipeline burst on village road with water flowing",
    "location": {
      "name": "Village Road",
      "verified": false
    },
    "severity": "High",
    "urgencyReason": "Water accumulation may affect road users and cause further damage",
    "recommendedAction": "Request immediate pipeline inspection and repair",
    "language": "hi-IN",
    "missingInformation": [],
    "confidence": 0.89
  }
}
```

**Errors:**
- `400`: Invalid transcript
- `401`: Unauthorized
- `500`: Analysis service error
- `503`: Evon service unavailable
- `504`: Analysis timeout

---

### Check AI Services Health
**GET** `/ai/health`

Check the operational status of all AI services.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "prisma": {
      "status": "operational",
      "latencyMs": 245
    },
    "evon": {
      "status": "operational",
      "latencyMs": 1823
    },
    "timbre": {
      "status": "operational",
      "latencyMs": 412
    }
  }
}
```

**Status Values:**
- `operational`: Service is functioning normally
- `degraded`: Service is slow but functional
- `unavailable`: Service is not responding

---

## Incident Management Endpoints

### Create Incident
**POST** `/incidents`

Create a new incident report after user verification.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "category": "Water Leakage",
  "description": "Pipeline burst on village road with water flowing",
  "location": {
    "name": "Village Road, Sector 5",
    "verified": true
  },
  "severity": "High",
  "urgencyReason": "Water accumulation may affect road users",
  "recommendedAction": "Request immediate pipeline inspection",
  "originalTranscript": "गांव की सड़क पर पानी की पाइपलाइन फूट गई है",
  "correctedTranscript": null,
  "language": "hi-IN",
  "confidence": 0.89,
  "missingInformation": []
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "incident": {
      "id": "507f191e810c19729de860ea",
      "incidentId": "INC-2026-001234",
      "userId": "507f1f77bcf86cd799439011",
      "category": "Water Leakage",
      "description": "Pipeline burst on village road with water flowing",
      "location": {
        "name": "Village Road, Sector 5",
        "verified": true
      },
      "severity": "High",
      "urgencyReason": "Water accumulation may affect road users",
      "recommendedAction": "Request immediate pipeline inspection",
      "verificationStatus": "verified",
      "status": "Submitted",
      "createdAt": "2026-11-07T14:30:00.000Z",
      "updatedAt": "2026-11-07T14:30:00.000Z"
    }
  }
}
```

**Errors:**
- `400`: Validation error
- `401`: Unauthorized

---

### List Incidents
**GET** `/incidents`

Retrieve paginated list of incidents with optional filters.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `status`: Filter by status
- `category`: Filter by category
- `severity`: Filter by severity
- `userId`: Filter by user (admin only)

**Example:**
```
GET /incidents?page=1&limit=20&status=Submitted&severity=High
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "incidents": [
      {
        "id": "507f191e810c19729de860ea",
        "incidentId": "INC-2026-001234",
        "category": "Water Leakage",
        "description": "Pipeline burst on village road",
        "location": { "name": "Village Road, Sector 5" },
        "severity": "High",
        "status": "Submitted",
        "createdAt": "2026-11-07T14:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 156,
      "page": 1,
      "pages": 8,
      "limit": 20
    }
  }
}
```

---

### Get Incident Details
**GET** `/incidents/:id`

Retrieve detailed information about a specific incident.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "incident": {
      "id": "507f191e810c19729de860ea",
      "incidentId": "INC-2026-001234",
      "userId": "507f1f77bcf86cd799439011",
      "user": {
        "name": "Rajesh Kumar",
        "email": "rajesh@example.com"
      },
      "category": "Water Leakage",
      "description": "Pipeline burst on village road with water flowing",
      "location": {
        "name": "Village Road, Sector 5",
        "verified": true
      },
      "severity": "High",
      "urgencyReason": "Water accumulation may affect road users",
      "recommendedAction": "Request immediate pipeline inspection",
      "originalTranscript": "गांव की सड़क पर पानी की पाइपलाइन फूट गई है",
      "language": "hi-IN",
      "confidence": 0.89,
      "verificationStatus": "verified",
      "verifiedAt": "2026-11-07T14:30:00.000Z",
      "userEdits": [],
      "status": "Submitted",
      "createdAt": "2026-11-07T14:30:00.000Z",
      "updatedAt": "2026-11-07T14:30:00.000Z"
    }
  }
}
```

**Errors:**
- `404`: Incident not found
- `403`: Access denied (not incident owner or admin)

---

### Update Incident
**PATCH** `/incidents/:id`

Update incident details (before admin review).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "description": "Updated description",
  "location": {
    "name": "Corrected location"
  },
  "category": "Road Damage",
  "severity": "Critical"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "incident": { /* updated incident */ }
  }
}
```

**Errors:**
- `400`: Validation error
- `403`: Cannot edit (already in review)
- `404`: Incident not found

---

### Update Incident Status
**PATCH** `/incidents/:id/status`

Update incident workflow status (admin only).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "Under Review",
  "notes": "Assigned to water department for inspection"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "incident": { /* updated incident */ },
    "history": {
      "previousStatus": "Submitted",
      "newStatus": "Under Review",
      "notes": "Assigned to water department for inspection",
      "changedAt": "2026-11-07T15:00:00.000Z"
    }
  }
}
```

**Errors:**
- `403`: Admin access required
- `400`: Invalid status transition
- `404`: Incident not found

---

### Get Incident History
**GET** `/incidents/:id/history`

Retrieve complete status change history for an incident.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "previousStatus": "Submitted",
        "newStatus": "Under Review",
        "changedBy": {
          "name": "Admin User",
          "email": "admin@example.com"
        },
        "notes": "Assigned to water department",
        "createdAt": "2026-11-07T15:00:00.000Z"
      }
    ]
  }
}
```

---

## Dashboard & Analytics Endpoints

### Get Dashboard Statistics
**GET** `/dashboard/stats`

Retrieve summary statistics for the dashboard.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalIncidents": 1247,
    "newIncidents": 23,
    "pendingVerification": 8,
    "highPriority": 15,
    "resolved": 1089
  }
}
```

---

### Get Analytics Data
**GET** `/dashboard/analytics`

Retrieve detailed analytics for charts and visualizations.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "categoryDistribution": [
      { "category": "Water Leakage", "count": 342 },
      { "category": "Road Damage", "count": 289 },
      { "category": "Electrical Hazard", "count": 156 }
    ],
    "severityDistribution": [
      { "severity": "Critical", "count": 45 },
      { "severity": "High", "count": 234 },
      { "severity": "Medium", "count": 567 },
      { "severity": "Low", "count": 401 }
    ],
    "statusDistribution": [
      { "status": "Submitted", "count": 31 },
      { "status": "Under Review", "count": 45 },
      { "status": "In Progress", "count": 82 },
      { "status": "Resolved", "count": 1089 }
    ],
    "timeline": [
      { "date": "2026-11-01", "count": 12 },
      { "date": "2026-11-02", "count": 18 },
      { "date": "2026-11-03", "count": 15 }
    ]
  }
}
```

---

## System Endpoints

### Health Check
**GET** `/health`

Check overall API health status.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "status": "operational",
    "timestamp": "2026-11-07T14:30:00.000Z",
    "database": "connected",
    "uptime": 3600
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTH_FAILED` | Authentication failed |
| `TOKEN_EXPIRED` | JWT token expired |
| `ACCESS_DENIED` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_EMAIL` | Email already registered |
| `FILE_TOO_LARGE` | Upload exceeds size limit |
| `INVALID_FILE_TYPE` | Unsupported file format |
| `PRISMA_ERROR` | Prisma STT service error |
| `EVON_ERROR` | Evon reasoning service error |
| `TIMBRE_ERROR` | Timbre TTS service error |
| `SERVICE_UNAVAILABLE` | External service unavailable |
| `TIMEOUT_ERROR` | Request timeout |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Internal server error |

---

## Rate Limiting

- **Default**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 10 requests per 15 minutes per IP
- **Response header**: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

**Rate Limit Exceeded Response:**
```json
{
  "success": false,
  "error": {
    "message": "Too many requests, please try again later",
    "code": "RATE_LIMIT_EXCEEDED",
    "retryAfter": 900
  }
}
```

---

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response:**
```json
{
  "pagination": {
    "total": 156,
    "page": 1,
    "pages": 16,
    "limit": 10
  }
}
```
