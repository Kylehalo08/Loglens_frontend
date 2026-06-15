# LogLens Frontend API Reference

Complete API contract for building the LogLens web UI. Copy this file into the frontend repo and point your agent at it.

**Last verified against backend:** 2026-06-15

---

## Base URLs

| Environment | API (JWT) | Ingestor (API key) |
|-------------|-----------|---------------------|
| Local dev | `http://localhost:8080` | `http://localhost:8081` |
| Production | `https://api.madhavmaheshwaricreations.in` | `https://ingest.madhavmaheshwaricreations.in` |

```bash
# Shell variables for manual testing
export API_BASE=https://api.madhavmaheshwaricreations.in
export INGEST_BASE=https://ingest.madhavmaheshwaricreations.in
export TOKEN="<access_token>"
export REFRESH_TOKEN="<refresh_token>"
export ORG_ID="<org_uuid>"
export SERVICE_ID="<service_uuid>"
export KEY_ID="<api_key_uuid>"
export LOG_ID="<log_uuid>"
export API_KEY="<full_api_key>"
```

---

## Response envelope

Every JSON HTTP response uses this shape:

```json
{
  "success": true,
  "data": { }
}
```

```json
{
  "success": false,
  "error": "human-readable message"
}
```

- On success: HTTP 2xx, `success: true`, payload in `data`
- On failure: HTTP 4xx/5xx, `success: false`, message in `error`
- `Content-Type`: `application/json` for all REST endpoints
- Timestamps: RFC3339 UTC (e.g. `2026-06-15T07:07:00.28205Z`)

---

## Authentication

### JWT access token

Protected routes require:

```
Authorization: Bearer <access_token>
```

Access tokens are JWTs (HS256). Default TTL: **1 hour** (`JWT_EXPIRY_HOURS`).

JWT claims (for client-side display only — always trust server RBAC):

```json
{
  "user_id": "<uuid>",
  "role": "user",
  "exp": 1781510768,
  "iat": 1781507168
}
```

The `role` claim is always `user` at the account level. **Org-level roles** (`owner`, `admin`, `developer`, `viewer`) come from org endpoints, not the JWT.

### Refresh token

- Opaque UUID string
- Default TTL: **7 days** (`REFRESH_TOKEN_EXPIRY_DAYS`)
- Rotated on every `/auth/refresh` call (old token invalidated)
- Revoked on `/auth/logout`

### Recommended frontend auth flow

1. On register/login: store `access_token` + `refresh_token` (httpOnly cookies or secure storage)
2. Attach `Authorization: Bearer` on all `/orgs/*` requests
3. On **401** from a protected route: call `POST /auth/refresh`, retry once with new access token
4. On refresh failure: redirect to login
5. On logout: call `POST /auth/logout` with both tokens, then clear storage

### CORS note

The backend does **not** enable CORS today. For local frontend dev, use one of:

- Vite/Next dev proxy → `localhost:8080`
- Add CORS middleware to the API (not implemented yet)

WebSocket `CheckOrigin` returns `true` (all origins allowed).

---

## Org roles (RBAC)

| Role | Description |
|------|-------------|
| `owner` | Full control. Auto-assigned to org creator. |
| `admin` | Invites, service management, API keys, logs |
| `developer` | Service + API key management, logs. No invites. |
| `viewer` | Read-only: list/view services, search logs. No API keys. |

**Developer+** = `owner` | `admin` | `developer`

| Capability | Owner | Admin | Developer | Viewer |
|------------|:-----:|:-----:|:---------:|:------:|
| Create/list/get org | ✓ | ✓ | ✓ | ✓ |
| Send invites / invite codes | ✓ | ✓ | ✗ | ✗ |
| List/get services | ✓ | ✓ | ✓ | ✓ |
| See `active_api_keys_count` | ✓ | ✓ | ✓ | ✗ |
| Create/update/delete services | ✓ | ✓ | ✓ | ✗ |
| API key CRUD | ✓ | ✓ | ✓ | ✗ |
| Search/view logs | ✓ | ✓ | ✓ | ✓ |
| Live log WebSocket | ✓ | ✓ | ✓ | ✓ |

Invitable roles (email invite): `admin`, `developer`, `viewer` — not `owner`.

Invite code join default role: `developer`.

---

## Endpoint index

| # | Method | Path | Auth | Min role | Purpose |
|---|--------|------|------|----------|---------|
| 1 | GET | `/health` | No | — | API liveness |
| 2 | POST | `/auth/register` | No | — | Create account |
| 3 | POST | `/auth/login` | No | — | Sign in |
| 4 | POST | `/auth/refresh` | No | — | Rotate tokens |
| 5 | POST | `/auth/logout` | JWT | — | Revoke refresh token |
| 6 | POST | `/orgs` | JWT | — | Create org |
| 7 | GET | `/orgs` | JWT | — | List my orgs |
| 8 | GET | `/orgs/:id` | JWT | Member | Org detail + members |
| 9 | POST | `/orgs/:id/invites` | JWT | Admin+ | Email invite |
| 10 | POST | `/orgs/:id/invite-codes` | JWT | Admin+ | Shareable code |
| 11 | POST | `/orgs/join/token` | JWT | — | Join via invite token |
| 12 | POST | `/orgs/join/code` | JWT | — | Join via invite code |
| 13 | POST | `/orgs/:id/services` | JWT | Developer+ | Create service |
| 14 | GET | `/orgs/:id/services` | JWT | Member | List services |
| 15 | GET | `/orgs/:id/services/:serviceId` | JWT | Member | Get service |
| 16 | PATCH | `/orgs/:id/services/:serviceId` | JWT | Developer+ | Update service |
| 17 | DELETE | `/orgs/:id/services/:serviceId` | JWT | Developer+ | Soft-delete service |
| 18 | POST | `/orgs/:id/services/:serviceId/api-keys` | JWT | Developer+ | Generate API key |
| 19 | GET | `/orgs/:id/services/:serviceId/api-keys` | JWT | Developer+ | List API keys |
| 20 | DELETE | `/orgs/:id/services/:serviceId/api-keys/:keyId` | JWT | Developer+ | Revoke API key |
| 21 | POST | `/orgs/:id/services/:serviceId/api-keys/:keyId/rotate` | JWT | Developer+ | Rotate API key |
| 22 | GET | `/orgs/:id/logs/search` | JWT | Member | Search logs |
| 23 | GET | `/orgs/:id/logs/:logId` | JWT | Member | Log detail (org scope) |
| 24 | GET | `/orgs/:id/services/:serviceId/logs/:logId` | JWT | Member | Log detail (service scope) |
| 25 | GET | `/orgs/:id/services/:serviceId/logs/stream` | JWT | Member | Live log WebSocket |
| 26 | GET | `/health` (ingestor) | No | — | Ingestor liveness |
| 27 | POST | `/v1/logs` (ingestor) | API key | — | Ingest one log |

---

## 1. Health — API

```
GET /health
```

No auth. Use for status indicators and readiness checks.

**Response 200:**
```json
{
  "success": true,
  "data": { "status": "ok" }
}
```

```bash
curl -s "$API_BASE/health"
```

---

## 2. Auth

### 2.1 Register

```
POST /auth/register
```

Create account and receive token pair immediately.

**Body:**
```json
{
  "email": "owner@loglens.dev",
  "password": "password123"
}
```

| Field | Required | Rules |
|-------|----------|-------|
| email | Yes | Valid email format |
| password | Yes | Min 8 characters |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "access_token": "<jwt>",
    "refresh_token": "<uuid>"
  }
}
```

**Errors:** 400 invalid body/email/password · 409 email already taken

```bash
curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@loglens.dev","password":"password123"}'
```

---

### 2.2 Login

```
POST /auth/login
```

**Body:** same as register

**Response 200:** same token pair shape as register

**Errors:** 400 invalid body · 401 invalid credentials · 404 user not found

```bash
curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@loglens.dev","password":"password123"}'
```

---

### 2.3 Refresh

```
POST /auth/refresh
```

Rotate refresh token and issue new access token. **Old refresh token is invalidated.**

**Body:**
```json
{
  "refresh_token": "<uuid>"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "access_token": "<new-jwt>",
    "refresh_token": "<new-uuid>"
  }
}
```

**Errors:** 401 invalid/expired refresh token

```bash
curl -s -X POST "$API_BASE/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}"
```

---

### 2.4 Logout

```
POST /auth/logout
```

Requires valid access token **and** refresh token in body.

**Headers:** `Authorization: Bearer <access_token>`

**Body:**
```json
{
  "refresh_token": "<uuid>"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { "message": "logged out" }
}
```

```bash
curl -s -X POST "$API_BASE/auth/logout" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}"
```

---

## 3. Organizations

All `/orgs/*` routes require `Authorization: Bearer <access_token>`.

### 3.1 Create organization

```
POST /orgs
```

Caller becomes `owner`.

**Body:**
```json
{
  "name": "LogLens Dev"
}
```

| Field | Required | Rules |
|-------|----------|-------|
| name | Yes | Non-empty string |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "988d181f-c215-4934-af38-895a3ef9d46f",
    "name": "LogLens Dev",
    "created_by": "7927e419-96bd-40f7-b6bf-014f4037ad51",
    "created_at": "2026-06-15T07:07:00.28205Z",
    "role": "owner"
  }
}
```

```bash
curl -s -X POST "$API_BASE/orgs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"LogLens Dev"}'
```

---

### 3.2 List my organizations

```
GET /orgs
```

**Response 200:** array of org summaries (empty array if none)

```json
{
  "success": true,
  "data": [
    {
      "id": "988d181f-c215-4934-af38-895a3ef9d46f",
      "name": "LogLens Dev",
      "created_by": "7927e419-96bd-40f7-b6bf-014f4037ad51",
      "created_at": "2026-06-15T07:07:00.28205Z",
      "role": "owner"
    }
  ]
}
```

```bash
curl -s "$API_BASE/orgs" -H "Authorization: Bearer $TOKEN"
```

---

### 3.3 Get organization details

```
GET /orgs/:id
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "988d181f-c215-4934-af38-895a3ef9d46f",
    "name": "LogLens Dev",
    "created_at": "2026-06-15T07:07:00.28205Z",
    "members": [
      {
        "user_id": "7927e419-96bd-40f7-b6bf-014f4037ad51",
        "email": "owner@loglens.dev",
        "role": "owner",
        "joined_at": "2026-06-15T07:07:00.28205Z"
      }
    ],
    "services_count": 2
  }
}
```

**Errors:** 403 not a member · 404 org not found

```bash
curl -s "$API_BASE/orgs/$ORG_ID" -H "Authorization: Bearer $TOKEN"
```

---

### 3.4 Send email invite

```
POST /orgs/:id/invites
```

**Role required:** `owner` or `admin`

**Body:**
```json
{
  "email": "teammate@gmail.com",
  "role": "developer"
}
```

| Field | Required | Values |
|-------|----------|--------|
| email | Yes | Valid email |
| role | Yes | `admin`, `developer`, `viewer` |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "invite_id": "<uuid>",
    "email": "teammate@gmail.com",
    "role": "developer",
    "expires_at": "2026-06-16T07:07:00Z",
    "token": "<raw-invite-token>"
  }
}
```

**Important:** `token` is shown **once**. Email delivery is not implemented — copy token and share manually. Expires in **24 hours**.

```bash
curl -s -X POST "$API_BASE/orgs/$ORG_ID/invites" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"teammate@gmail.com","role":"developer"}'
```

---

### 3.5 Generate invite code

```
POST /orgs/:id/invite-codes
```

**Role required:** `owner` or `admin`  
**Body:** none

**Response 201:**
```json
{
  "success": true,
  "data": {
    "code": "ABC123",
    "org_id": "988d181f-c215-4934-af38-895a3ef9d46f",
    "default_role": "developer",
    "is_active": true
  }
}
```

Code is 6 uppercase alphanumeric characters.

```bash
curl -s -X POST "$API_BASE/orgs/$ORG_ID/invite-codes" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 3.6 Join via invite token

```
POST /orgs/join/token
```

Used by the **invitee** after they register/login.

**Body:**
```json
{
  "token": "<raw-invite-token>"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "org_id": "988d181f-c215-4934-af38-895a3ef9d46f",
    "org_name": "LogLens Dev",
    "role": "developer",
    "joined_at": "2026-06-15T08:00:00Z"
  }
}
```

**Errors:** 404 invite not found · 409 already a member · 410 expired/already accepted

```bash
curl -s -X POST "$API_BASE/orgs/join/token" \
  -H "Authorization: Bearer $USER2_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token":"<invite-token>"}'
```

---

### 3.7 Join via invite code

```
POST /orgs/join/code
```

**Body:**
```json
{
  "code": "ABC123"
}
```

**Response 200:** same shape as join via token

```bash
curl -s -X POST "$API_BASE/orgs/join/code" \
  -H "Authorization: Bearer $USER2_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"ABC123"}'
```

---

## 4. Services

Base path: `/orgs/:id/services`

### 4.1 Create service

```
POST /orgs/:id/services
```

**Role required:** Developer+

**Body:**
```json
{
  "name": "Payment Service",
  "description": "Handles checkout and refunds"
}
```

| Field | Required | Rules |
|-------|----------|-------|
| name | Yes | 1–255 characters, unique per org |
| description | No | string |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "<uuid>",
    "org_id": "<uuid>",
    "name": "Payment Service",
    "description": "Handles checkout and refunds",
    "created_by": "<user-uuid>",
    "created_at": "2026-06-15T07:10:00Z",
    "updated_at": "2026-06-15T07:10:00Z",
    "active_api_keys_count": 0
  }
}
```

```bash
curl -s -X POST "$API_BASE/orgs/$ORG_ID/services" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Payment Service","description":"Handles checkout and refunds"}'
```

---

### 4.2 List services

```
GET /orgs/:id/services
```

**Role required:** Member (any)

**Response 200:** array of services. Viewers do **not** get `active_api_keys_count`.

```bash
curl -s "$API_BASE/orgs/$ORG_ID/services" -H "Authorization: Bearer $TOKEN"
```

---

### 4.3 Get service

```
GET /orgs/:id/services/:serviceId
```

**Response 200:** single service object (same fields as create)

**Errors:** 404 service not found

```bash
curl -s "$API_BASE/orgs/$ORG_ID/services/$SERVICE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 4.4 Update service

```
PATCH /orgs/:id/services/:serviceId
```

**Role required:** Developer+

**Body:**
```json
{
  "name": "Payment Service v2",
  "description": "Updated description"
}
```

**Response 200:** updated service object

```bash
curl -s -X PATCH "$API_BASE/orgs/$ORG_ID/services/$SERVICE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Payment Service v2","description":"Updated description"}'
```

---

### 4.5 Delete service

```
DELETE /orgs/:id/services/:serviceId
```

**Role required:** Developer+  
Soft delete (`deleted_at` set; excluded from list/get).

**Response 200:**
```json
{
  "success": true,
  "data": { "message": "service deleted" }
}
```

```bash
curl -s -X DELETE "$API_BASE/orgs/$ORG_ID/services/$SERVICE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 5. API keys

Base path: `/orgs/:id/services/:serviceId/api-keys`

**Role required for all:** Developer+ (viewers get 403)

API key format: `ll_<8-char-prefix>_<32-char-hex-secret>`

### 5.1 Generate API key

```
POST /orgs/:id/services/:serviceId/api-keys
```

**Body:**
```json
{
  "label": "production"
}
```

`label` is optional.

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "<uuid>",
    "service_id": "<uuid>",
    "prefix": "ll_a1b2c3d4",
    "api_key": "ll_a1b2c3d4_<32-char-hex-secret>",
    "label": "production",
    "created_at": "2026-06-15T07:15:00Z",
    "created_by": "<user-uuid>"
  }
}
```

**Critical:** `api_key` is returned **only here** (and on rotate). Show a copy-once UI with warning.

```bash
curl -s -X POST "$API_BASE/orgs/$ORG_ID/services/$SERVICE_ID/api-keys" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"label":"production"}'
```

---

### 5.2 List API keys

```
GET /orgs/:id/services/:serviceId/api-keys
```

**Response 200:** array (metadata only, no secret)

```json
{
  "success": true,
  "data": [
    {
      "id": "<uuid>",
      "service_id": "<uuid>",
      "prefix": "ll_a1b2c3d4",
      "label": "production",
      "created_at": "2026-06-15T07:15:00Z",
      "created_by": "<user-uuid>",
      "revoked_at": null,
      "last_used_at": null
    }
  ]
}
```

```bash
curl -s "$API_BASE/orgs/$ORG_ID/services/$SERVICE_ID/api-keys" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 5.3 Revoke API key

```
DELETE /orgs/:id/services/:serviceId/api-keys/:keyId
```

Immediate revocation. Returns updated key metadata with `revoked_at` set.

**Errors:** 410 already revoked

```bash
curl -s -X DELETE "$API_BASE/orgs/$ORG_ID/services/$SERVICE_ID/api-keys/$KEY_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 5.4 Rotate API key

```
POST /orgs/:id/services/:serviceId/api-keys/:keyId/rotate
```

Atomic: revokes old key, creates new one. **Body:** none

**Response 201:** same shape as generate (includes new `api_key` secret once)

```bash
curl -s -X POST "$API_BASE/orgs/$ORG_ID/services/$SERVICE_ID/api-keys/$KEY_ID/rotate" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 6. Logs (read / search)

### 6.1 Search logs

```
GET /orgs/:id/logs/search
```

**Role required:** Member (any, including viewer)

**Query parameters:**

| Param | Required | Example | Notes |
|-------|----------|---------|-------|
| service_id | No | `uuid` or `uuid1,uuid2` | Filter by service(s) |
| severity | No | `ERROR,WARN` | Comma-separated: DEBUG, INFO, WARN, ERROR, FATAL |
| from | No | `2026-06-01T00:00:00Z` | RFC3339, inclusive |
| to | No | `2026-06-08T23:59:59Z` | RFC3339, inclusive |
| q | No | `payment failed` | Full-text search on message |
| page | No | `1` | Default 1 |
| limit | No | `100` | Default 100, max 1000 |

All filters are ANDed. Max time range when both `from` and `to` set: **30 days**.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "<uuid>",
        "org_id": "<uuid>",
        "service_id": "<uuid>",
        "timestamp": "2026-06-15T07:20:00Z",
        "severity": "ERROR",
        "message": "payment failed",
        "metadata": { "order_id": "123" },
        "ingested_at": "2026-06-15T07:20:01Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 100,
      "total": 12,
      "total_pages": 1
    }
  }
}
```

```bash
curl -s "$API_BASE/orgs/$ORG_ID/logs/search?service_id=$SERVICE_ID&severity=ERROR&q=payment&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 6.2 Get log by ID (org scope)

```
GET /orgs/:id/logs/:logId
```

**Response 200:** single `LogEntry` object

**Errors:** 404 log not found

```bash
curl -s "$API_BASE/orgs/$ORG_ID/logs/$LOG_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 6.3 Get log by ID (service scope)

```
GET /orgs/:id/services/:serviceId/logs/:logId
```

Same response as org scope. Use when navigating from a service detail page.

```bash
curl -s "$API_BASE/orgs/$ORG_ID/services/$SERVICE_ID/logs/$LOG_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 6.4 Live log stream (WebSocket)

```
GET /orgs/:id/services/:serviceId/logs/stream
```

Upgrade to WebSocket. **Role required:** Member.

**Connection:**
```javascript
const ws = new WebSocket(
  `wss://api.madhavmaheshwaricreations.in/orgs/${orgId}/services/${serviceId}/logs/stream`,
  [], // subprotocols not used
);
// Cannot set Authorization header in browser WebSocket constructor.
// Pass token as query param is NOT supported by backend today.
```

**Browser limitation:** The backend reads JWT from `Authorization` header, but browser `WebSocket` API cannot set custom headers. **Frontend options:**

1. Use a WebSocket library/proxy that adds the header (e.g. dev proxy)
2. **Backend change needed** for production browser clients (e.g. `?token=` query param) — not implemented yet

**Server → client messages:** JSON text frames, one `LogEntry` per message:

```json
{
  "id": "<uuid>",
  "org_id": "<uuid>",
  "service_id": "<uuid>",
  "timestamp": "2026-06-15T07:20:00Z",
  "severity": "ERROR",
  "message": "payment failed",
  "metadata": { "order_id": "123" },
  "ingested_at": "2026-06-15T07:20:01Z"
}
```

**Errors (before upgrade):** 401 unauthorized · 403 not a member · 503 live stream unavailable (Redis down)

---

## 7. Ingestor (log ingestion)

Separate service on port **8081**. Used by SDKs and for testing — not typically called from the main UI except a "send test log" dev tool.

### 7.1 Health

```
GET /health   (on INGEST_BASE)
```

```bash
curl -s "$INGEST_BASE/health"
```

---

### 7.2 Ingest log

```
POST /v1/logs
```

**Auth:** `Authorization: Bearer <full_api_key>` (not JWT)

**Body:**
```json
{
  "timestamp": "2026-06-15T07:20:00Z",
  "severity": "ERROR",
  "message": "payment failed",
  "metadata": { "order_id": "123" }
}
```

| Field | Required | Rules |
|-------|----------|-------|
| message | Yes | Max 64KB |
| severity | Yes | DEBUG, INFO, WARN, ERROR, FATAL (case-insensitive) |
| timestamp | No | RFC3339; defaults to now |
| metadata | No | JSON object; defaults to `{}` |

**Response 200:**
```json
{
  "success": true,
  "data": { "id": "<log-uuid>" }
}
```

**Errors:** 401 invalid/revoked API key · 400 invalid severity/message · 503 failed to queue (Kafka down)

**Note:** Log appears in search after consumer processes it (usually sub-second). Small delay possible.

```bash
curl -s -X POST "$INGEST_BASE/v1/logs" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"severity":"ERROR","message":"payment failed","metadata":{"order_id":"123"}}'
```

---

## Suggested frontend pages

| Page | Primary endpoints |
|------|-------------------|
| Login / Register | `/auth/login`, `/auth/register` |
| Org picker | `GET /orgs` |
| Create org | `POST /orgs` |
| Org settings / members | `GET /orgs/:id`, invites, invite codes, join flows |
| Services list | `GET /orgs/:id/services` |
| Service detail | `GET .../services/:id`, API keys CRUD |
| Log explorer | `GET /orgs/:id/logs/search` |
| Log detail | `GET /orgs/:id/logs/:logId` |
| Live tail | WebSocket `.../logs/stream` |
| API key reveal modal | Show once on generate/rotate |

---

## TypeScript types (copy into frontend)

```typescript
// Envelope
interface ApiSuccess<T> {
  success: true;
  data: T;
}
interface ApiError {
  success: false;
  error: string;
}
type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Auth
interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

// Org
type OrgRole = "owner" | "admin" | "developer" | "viewer";
interface OrgSummary {
  id: string;
  name: string;
  created_by?: string;
  created_at: string;
  role: OrgRole;
}
interface OrgMember {
  user_id: string;
  email: string;
  role: OrgRole;
  joined_at: string;
}
interface OrgDetail {
  id: string;
  name: string;
  created_at: string;
  members: OrgMember[];
  services_count: number;
}

// Service
interface Service {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  active_api_keys_count?: number; // omitted for viewers
}

// API key
interface APIKeyMeta {
  id: string;
  service_id: string;
  prefix: string;
  label?: string;
  created_at: string;
  created_by: string;
  revoked_at: string | null;
  last_used_at: string | null;
}
interface CreateAPIKeyResult extends APIKeyMeta {
  api_key: string; // only on create/rotate
}

// Logs
type Severity = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
interface LogEntry {
  id: string;
  org_id: string;
  service_id: string;
  timestamp: string;
  severity: Severity;
  message: string;
  metadata: Record<string, unknown>;
  ingested_at: string;
}
interface SearchResult {
  logs: LogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
```

---

## Full manual test script

Run top-to-bottom after setting `API_BASE` and credentials.

```bash
export API_BASE=https://api.madhavmaheshwaricreations.in
export INGEST_BASE=https://ingest.madhavmaheshwaricreations.in

# --- Auth ---
curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@loglens.dev","password":"password123"}'

curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@loglens.dev","password":"password123"}'
# → set TOKEN and REFRESH_TOKEN from response

curl -s -X POST "$API_BASE/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}"

# --- Orgs ---
curl -s -X POST "$API_BASE/orgs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"LogLens Dev"}'
# → set ORG_ID

curl -s "$API_BASE/orgs" -H "Authorization: Bearer $TOKEN"
curl -s "$API_BASE/orgs/$ORG_ID" -H "Authorization: Bearer $TOKEN"

curl -s -X POST "$API_BASE/orgs/$ORG_ID/invites" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"teammate@gmail.com","role":"developer"}'

curl -s -X POST "$API_BASE/orgs/$ORG_ID/invite-codes" \
  -H "Authorization: Bearer $TOKEN"

# --- Services ---
curl -s -X POST "$API_BASE/orgs/$ORG_ID/services" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Payment Service","description":"Demo"}'
# → set SERVICE_ID

curl -s "$API_BASE/orgs/$ORG_ID/services" -H "Authorization: Bearer $TOKEN"
curl -s "$API_BASE/orgs/$ORG_ID/services/$SERVICE_ID" -H "Authorization: Bearer $TOKEN"

# --- API keys ---
curl -s -X POST "$API_BASE/orgs/$ORG_ID/services/$SERVICE_ID/api-keys" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"label":"production"}'
# → set API_KEY and KEY_ID

curl -s "$API_BASE/orgs/$ORG_ID/services/$SERVICE_ID/api-keys" \
  -H "Authorization: Bearer $TOKEN"

# --- Ingest + search ---
curl -s -X POST "$INGEST_BASE/v1/logs" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"severity":"ERROR","message":"payment failed","metadata":{"order_id":"123"}}'
# → set LOG_ID from response

sleep 2

curl -s "$API_BASE/orgs/$ORG_ID/logs/search?severity=ERROR&q=payment" \
  -H "Authorization: Bearer $TOKEN"

curl -s "$API_BASE/orgs/$ORG_ID/logs/$LOG_ID" \
  -H "Authorization: Bearer $TOKEN"

# --- Logout ---
curl -s -X POST "$API_BASE/auth/logout" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}"
```

---

## Not implemented (do not build UI for these yet)

- User profile (`GET /me`, update name/avatar)
- Remove or change member roles
- Org rename / delete
- Email delivery for invites (token returned in API only)
- Audit log read API
- Metadata field on services (DB column exists, not in API)
- Browser WebSocket auth without backend change
- CORS on API (use dev proxy)
- Password reset / email verification

---

## Error status quick reference

| Status | Typical meaning |
|--------|-----------------|
| 400 | Bad request body or validation |
| 401 | Missing/invalid JWT or API key |
| 403 | Not org member or insufficient role |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, service name, already member) |
| 410 | Expired invite or revoked resource |
| 503 | Kafka/Redis unavailable (ingest or stream) |
| 500 | Server error |
