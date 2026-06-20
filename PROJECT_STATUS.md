# RingAI — Project Status & Progress Document

> Last updated: 2026-06-19

---

## Overview

RingAI is an AI-powered phone ordering system for restaurants. Customers call the restaurant's phone number, interact with an AI voice agent that takes their order, and the order flows through to the restaurant's POS system automatically. Restaurant owners manage everything through a web dashboard.

---

## Architecture — High Level

```
Customer Call
     │
     ▼
┌─────────────────────┐
│  telecom-ingress     │  Telnyx (primary) / Twilio (failover)
│  (Python FastAPI)    │  Webhook ingress, call routing
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  agent-runtime       │  LiveKit orchestration
│  (Python FastAPI)    │  STT → LLM → TTS pipeline
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  menu-order-service  │  Menu, cart, orders, payments
│  (Python FastAPI)    │  Aurora PostgreSQL + Valkey
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  pos-gateway         │  Square / Toast / Clover adapters
│  (Python FastAPI)    │  Idempotent order submission
└─────────────────────┘

┌─────────────────────┐
│  auth-service        │  JWT + OTP auth, restaurant onboarding
│  (Python FastAPI)    │
└─────────────────────┘

┌─────────────────────┐
│  Frontend Dashboard  │  React + Vite + Tailwind
│  (served via nginx)  │  Operator / manager / kitchen views
└─────────────────────┘

┌─────────────────────┐
│  Admin Portal        │  React + Vite (admin-frontend)
│  (served via nginx)  │  + admin-service (FastAPI)
└─────────────────────┘
```

---

## Backend — Completed Phases

### Phase 1 — Telecom Ingress ✅
**Service:** `services/telecom-ingress/`

- Telnyx + Twilio webhook ingestion with signature verification
- Provider router: Telnyx primary → Twilio failover (5-failure circuit breaker)
- Normalized `CallSession` domain model (provider-agnostic)
- LiveKit handoff integration point
- Replay protection, structured logging

### Phase 2 — Conversation Orchestration ✅
**Service:** `services/agent-runtime/`

- LiveKit Agents runtime scaffold (room creation, SIP invite, agent joining)
- STT abstraction: faster-whisper (primary) → Deepgram Nova-3 (fallback)
- TTS abstraction: Cartesia Sonic (primary) → Kokoro (fallback)
- LLM router: Claude Sonnet 4.6 (high/medium risk) → vLLM (low-risk only)
- S2S provider abstraction with 6 providers:
  - Open-source: Moshi, Ultravox, Mini-Omni
  - Closed-source: GPT-4o Realtime, Gemini Live, Hume EVI 2
- Session manager, turn controller, transcript assembler, tool registry

### Phase 3 — Menu & Order Management ✅
**Service:** `services/menu-order-service/`

- Menu CRUD (categories, items, modifier groups, modifier options)
- Cart FSM with 7 states: EMPTY → ACTIVE → REVIEWING → CONFIRMED → SUBMITTED → COMPLETED → CANCELLED
- Modifier validation (min/max, single/multi/toggle)
- Pricing snapshots frozen at confirmation (Decimal, ROUND_HALF_UP)
- Clarification policy for ambiguous voice orders
- Alembic migrations (6 tables), Aurora PostgreSQL + Valkey cart cache
- Additional APIs: orders, carts, kitchen display, analytics, inventory, staff, locations, subscriptions, Gmail integration, knowledge base

### Phase 4 — POS Integration ✅
**Service:** `services/pos-gateway/`

- Adapter pattern with Square, Toast, and Mock implementations
- Idempotency service (prevents duplicate POS writes)
- Exponential backoff retry with error classification (retryable / terminal / unknown)
- Reconciliation service (batch verification of ACCEPTED submissions)
- Durable audit trail — every submission attempt persisted

### Phase 5 — Observability & Security ✅
- Structured logging with PII redaction (phone, email, tokens, CC numbers)
- X-Correlation-ID propagated across all 4 services
- Provider health API (aggregate STT/TTS/LLM status)
- AWS Secrets Manager integration with TTL cache
- IRSA-ready EKS pod identity

### Phase 6 — Production Hardening ✅
- Degraded-mode controller with per-category circuit breakers
- EKS deployment manifests (health probes, PodDisruptionBudgets, GPU scheduling)
- KEDA autoscaling (CPU-based, GPU-aware cooldown for agent-runtime)
- Failure/fallback matrix (20-row, all escalation paths documented)

### Provider Failover Summary

| Category   | Primary             | Fallback           | Trigger             |
|------------|---------------------|--------------------|---------------------|
| Telephony  | Telnyx              | Twilio             | 5 consecutive fails |
| STT        | faster-whisper      | Deepgram Nova-3    | 3 consecutive fails |
| TTS        | Cartesia Sonic      | Kokoro             | 3 consecutive fails |
| LLM        | Claude Sonnet 4.6   | vLLM (low-risk)    | 3 consecutive fails |
| S2S        | GPT-4o Realtime     | Gemini Live        | 3 consecutive fails |

---

## Auth Service

**Service:** `services/auth-service/`

- JWT-based authentication
- OTP verification (email + phone) for signup and login
- Restaurant onboarding / profile management
- Staff login (separate role)
- Password reset via email token

---

## Frontend Dashboard

**Repo:** `Suraj_Ring_Ai_FrontEnd`
**Stack:** React 18 + Vite + Tailwind CSS, served via nginx in Docker

### Implemented Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | OTP-based 2-step login |
| `/signup` | Signup | OTP-verified restaurant signup |
| `/reset-password` | ResetPassword | Email token password reset |
| `/dashboard` | KitchenDashboard | Live order queue for kitchen staff |
| `/manager` | ManagerDashboard | Multi-location analytics overview |
| `/menu` | MenuManager | Full menu CRUD (categories, items, modifiers) |
| `/orders` | OrderHistory | Order history with filters |
| `/analytics` | Analytics | Revenue, order, and call analytics (Recharts) |
| `/inventory` | Inventory | Inventory tracking, invoice upload, waste entry |
| `/pos` | POSOrder | Manual POS order entry |
| `/agent` | AgentSettings | AI agent voice/behavior configuration |
| `/documents` | DocumentUpload | Knowledge base document upload |
| `/locations` | Locations | Multi-location management (Google Maps) |
| `/settings` / `/account` | Settings | Restaurant profile, staff, email/phone/password |
| `/subscription` | Subscription | Plan management, Stripe checkout/portal |

### Key Frontend Modules

**Contexts:**
- `AuthContext` — JWT stored in localStorage, auto-logout on expired token
- `LocationContext` — active location scoping across all pages

**Services (`src/services/api.js`):**
- `authApi` — login, signup, OTP, password reset, profile updates
- `menuApi` — menu CRUD + seed
- `ordersApi` — list, get, create, status update, cancel
- `dashboardApi` — stats, calls, reports
- `restaurantApi` — restaurant profile get/update
- `agentApi` — agent settings get/update
- `subscriptionApi` — plans, checkout, portal, OTP-gated plan change
- `addonsApi` — POS order addons CRUD
- `locationsApi` — location CRUD + analytics
- `staffApi` — staff CRUD + staff login
- `gmailApi` — Gmail OAuth2 connect/disconnect
- `managerApi` — manager-scoped analytics, ratings, staff assignments
- `knowledgeApi` — document upload, list, delete, search, menu sync

### API Proxy
All frontend API calls go to `/api/*` (relative). Vite dev proxy and nginx in production route these to the correct backend services. Auth header is attached automatically per request via axios interceptor. Token errors (missing/expired) trigger a forced logout; other 401s are handled page-locally.

---

## AWS Production Deployment — June 2026

### Account Details

| Item | Value |
|------|-------|
| AWS Account ID | `437323115541` |
| Region | `us-east-1` |
| CLI Profile | `ringai-prod` |
| ECS Cluster | `myapp-production-cluster` |
| ALB | `myapp-production-alb-285768458.us-east-1.elb.amazonaws.com` |
| Aurora PostgreSQL | `myapp-production-db.cov4iksa0ckq.us-east-1.rds.amazonaws.com` |
| Valkey (ElastiCache) | `myapp-production-valkey.ik5sgv.ng.0001.use1.cache.amazonaws.com:6379` |

---

### ECS Services

All 8 services run on **Fargate** in cluster `myapp-production-cluster`. Each service pulls every environment variable from AWS Secrets Manager (no hardcoded env vars in task definitions).

| ECS Service | Task Definition | Secret |
|---|---|---|
| `myapp-production-auth-service` | `myapp-production-auth-service` | `ringai/auth-service` |
| `myapp-production-agent-runtime` | `myapp-production-agent-runtime` | `agent-runtime-service` |
| `myapp-production-menu-order` | `myapp-production-menu-order` | `menu-order-service` |
| `myapp-production-pos-gateway` | `myapp-production-pos-gateway` | `Pos-Gateway` |
| `myapp-production-telecom-ingress` | `myapp-production-telecom-ingress` | `telecom-ingress` |
| `myapp-production-frontend` | `myapp-production-frontend` | _(static nginx, no secrets)_ |
| `myapp-production-admin-frontend` | `myapp-production-admin-frontend` | _(static nginx, no secrets)_ |
| `myapp-production-admin-service` | `myapp-production-admin-service` | `ringai/admin-service` |

**Fargate capacity note:** The account has a ~2 vCPU Fargate limit. Rolling deployments require stopping the old task before the new one can be placed. Force-new-deployment triggers this automatically when capacity is tight.

**ECS execution role:** `myapp-production-ecs-execution`
Inline policy `myapp-production-secrets-access` grants `secretsmanager:GetSecretValue` for all service secrets listed above.

---

### AWS Secrets Manager

Secrets use per-key referencing in ECS task definitions (`arn:...:secret:name:KEY::`).

#### `ringai/auth-service`
| Key | Value |
|-----|-------|
| `ENVIRONMENT` | `production` |
| `PORT` | `8000` |
| `DATABASE_URL` | `postgresql+asyncpg://ringa_admin:***@myapp-production-db.cov4iksa0ckq.us-east-1.rds.amazonaws.com:5432/ringai_auth` |
| `BASE_URL` | `http://myapp-production-alb-285768458.us-east-1.elb.amazonaws.com` |
| `FRONTEND_URL` | `https://www.ringzai.info` |
| `SMTP_HOST` | `email-smtp.us-east-1.amazonaws.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `AKIAWLUT5FQKQ7PBH4VX` |
| `SMTP_PASSWORD` | _(derived via SES HMAC — see SMTP section below)_ |
| `SMTP_FROM` | `noreply@ringzai.info` |

#### `agent-runtime-service`
- DB URL → `us-east-1` Aurora
- Redis/Valkey → `myapp-production-valkey.ik5sgv.ng.0001.use1.cache.amazonaws.com:6379`

#### `menu-order-service`
- DB URL → `us-east-1` Aurora (`menu_order_service` database)
- Redis/Valkey → same Valkey endpoint above

#### `Pos-Gateway`
- DB URL → `us-east-1` Aurora (`pos_gateway` database)

#### `telecom-ingress`
- DB URL → `us-east-1` Aurora (`telecom_ingress` database)

#### `ringai/admin-service`
- `ADMIN_DATABASE_URL`, `AUTH_DATABASE_URL`, `MENU_DATABASE_URL` → `us-east-1` Aurora
- `FRONTEND_ORIGIN` → `https://www.ringzai.info`
- `SECRET_KEY`, `TWILIO_*` credentials

---

### ElastiCache — Valkey

- **Cluster name:** `myapp-production-valkey`
- **Engine:** Valkey (Redis-compatible)
- **Endpoint:** `myapp-production-valkey.ik5sgv.ng.0001.use1.cache.amazonaws.com:6379`
- **Created with:** `create-replication-group` API (Valkey requires replication group, not `create-cache-cluster`)
- **Transit encryption:** disabled (internal VPC only)

---

### Application Load Balancer

**ALB:** `myapp-production-alb`

#### HTTP Listener (port 80)
All traffic → **301 redirect to HTTPS**.

#### HTTPS Listener (port 443)
**Certificate:** Wildcard `*.ringzai.info` + apex `ringzai.info`
**ARN:** `arn:aws:acm:us-east-1:437323115541:certificate/c1e21842-23fe-44c0-aba7-50c6c62552a9`

| Priority | Condition | Target |
|----------|-----------|--------|
| 1 | host-header = `admin.ringzai.info` | `myapp-admin-frontend-tg` |
| 2 | path = `/admin/*` | `myapp-admin-frontend-tg` |
| 3 | path = `/admin/api/*` | `myapp-admin-service-tg` |
| 4 | path = `/api/agent/*` | `myapp-agent-runtime-tg` |
| 5 | path = `/api/auth*` | `myapp-auth-service-tg` |
| 6 | path = `/api/menu*` | `myapp-menu-tg` |
| 7 | path = `/api/pos/*` | `myapp-pos-tg` |
| 8 | path = `/api/telecom/*` | `myapp-telecom-tg` |
| 9 | path = `/twilio/webhook/*` | `myapp-telecom-tg` |
| 10 | path = `/api/s2s/*` | `myapp-telecom-tg` |
| 11 | path = `/api/carts*` | `myapp-menu-tg` |
| 12 | path = `/api/orders*` | `myapp-menu-tg` |
| 13 | path = `/api/restaurant*` | `myapp-auth-service-tg` |
| default | — | `myapp-frontend-tg-v2` |

**Security group:** `sg-0624e507893014ce6` — inbound TCP 80 and 443 from `0.0.0.0/0`.

---

### DNS — Ionos (ringzai.info)

| Type | Host | Value | Purpose |
|------|------|-------|---------|
| A | `@` | `74.208.236.96` | Ionos redirect → `https://www.ringzai.info` |
| CNAME | `www` | `myapp-production-alb-285768458.us-east-1.elb.amazonaws.com` | Main app |
| CNAME | `admin` | `myapp-production-alb-285768458.us-east-1.elb.amazonaws.com` | Admin portal |
| CNAME | `_650cde5bbc6640d127075c3a815eea71` | `_5a6f9414304d0b96384c7b9b3400f346.jkddzztszm.acm-validations.aws` | ACM cert validation |
| CNAME | `7jvyeytcaq5fbiipggsyyefemskqaj4d._domainkey` | `7jvyeytcaq5fbiipggsyyefemskqaj4d.dkim.amazonses.com` | SES DKIM |
| CNAME | `cwv6prspaj4lw7234y7mmcgp7gr5w6ej._domainkey` | `cwv6prspaj4lw7234y7mmcgp7gr5w6ej.dkim.amazonses.com` | SES DKIM |
| CNAME | `od3rdu7q2z4aompdm7plfzsq7sr33wsr._domainkey` | `od3rdu7q2z4aompdm7plfzsq7sr33wsr.dkim.amazonses.com` | SES DKIM |

---

### SES — Email (OTP & Transactional)

- **Region:** `us-east-1`
- **Verified domain:** `ringzai.info` (Status: Verified)
- **DKIM:** Verified (3 CNAME records in Ionos — Status: SUCCESS)
- **FROM address:** `noreply@ringzai.info`
- **Current mode:** Sandbox (200 emails/day, only to verified addresses)

#### SMTP Credentials
Dedicated IAM user `ses-smtp-user` (`AKIAWLUT5FQKQ7PBH4VX`) with `AmazonSESFullAccess`.

SMTP password is **not** the IAM secret key — it must be derived using AWS's HMAC formula:

```python
import hmac, hashlib, base64

def ses_smtp_password(secret_access_key, region="us-east-1"):
    date, service, message, terminal = "11111111", "ses", "SendRawEmail", "aws4_request"
    def sign(key, msg):
        return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()
    sig = sign(("AWS4" + secret_access_key).encode("utf-8"), date)
    sig = sign(sig, region)
    sig = sign(sig, service)
    sig = sign(sig, terminal)
    sig = sign(sig, message)           # ← this step is commonly missed
    return base64.b64encode(bytes([0x04]) + sig).decode("utf-8")
```

**Bug fixed (2026-06-19):** The original SMTP password in the secret was missing the `SendRawEmail` HMAC round, causing `535 Authentication Credentials Invalid` silently — OTP emails appeared to send (200 OK from the route) but were never delivered. Fixed by regenerating the IAM key and recalculating with the full 5-step formula.

---

### ACM Certificate

| Item | Value |
|------|-------|
| ARN | `arn:aws:acm:us-east-1:437323115541:certificate/c1e21842-23fe-44c0-aba7-50c6c62552a9` |
| Domains | `ringzai.info`, `*.ringzai.info` |
| Status | ISSUED |
| Validation | DNS (CNAME already in Ionos) |

---

## Open Items / Next Steps

| Item | Priority | Notes |
|------|----------|-------|
| **SES production access** | High | Submit request in AWS Console → SES → "Request production access". Currently sandbox: 200 emails/day, verified addresses only. Approval takes 24–48 hours. |
| **Old AWS account SES cleanup** | Medium | Remove `ringzai.info` domain verification from the old `us-east-2` account to protect sender reputation. |
| **Square live POS testing** | Medium | Sandbox pipeline documented; live credentials not yet tested end-to-end. |
| **Frontend responsive polish** | Low | Ongoing. |
| **Load testing** | Low | Locust scaffolding exists in `scripts/loadtest/`. |
| **Email notification suite** | Low | 14-template design plan exists (June 2026). |
