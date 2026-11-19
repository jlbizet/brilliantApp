# Security hardening — critical fixes

Branch: `feature/railway-deployment` | Delivery: work-unit commits (chained PR if >400 authored lines) | Runner: Jest (`backend`)

## Specs

- **S1 — Stop tracking env files.** `.env`, `backend/.env`, `backend/.env.test`, `frontend/.env` must be removed from the git index (files stay on disk). `.gitignore` must ignore `.env` and `.env.*` while keeping every `*.env.example` tracked.
- **S2 — No real credentials in tracked files.** `backend/.env.example` must not contain real values (Kapso API key, phone number id, Google client email/private key). `backend/scripts/*.ts` must not contain a hardcoded `DATABASE_URL` credential; they must read `DATABASE_URL` from the environment and fail with a clear message when missing.
- **S3 — Protect cron triggers.** `POST /api/v1/cron/reminders` and `POST /api/v1/cron/same-day-reminders` must require header `x-cron-secret` matching `CRON_SECRET`. If `CRON_SECRET` is unset the endpoints must deny (fail closed). Invalid/missing secret → 401.
- **S4 — Verify WhatsApp webhook integrity.** `POST /api/v1/whatsapp/webhook` must verify HMAC-SHA256 over the raw body: Kapso `X-Webhook-Signature` (hex, secret `WHATSAPP_WEBHOOK_SECRET`) or Meta `x-hub-signature-256` (`sha256=<hex>`, secret `META_APP_SECRET`). Missing/invalid signature → 401. No verification secret configured → deny. `GET /api/v1/whatsapp/webhook` must reject when `WHATSAPP_WEBHOOK_VERIFY_TOKEN` is unset.
- **S5 — Verification.** Unit tests for S3/S4 observed RED before implementation and GREEN after; `npm test` and `npm run build` pass in `backend`.

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S1 | inline | pending | |
| T2 | S2 (env example) | inline | pending | |
| T3 | S2 (scripts) | inline | pending | |
| T4 | S3, S5 | inline | pending | |
| T5 | S4, S5 | inline | pending | |

## Log

### L1 — User request (verbatim)
> Si comienza por lo critico
