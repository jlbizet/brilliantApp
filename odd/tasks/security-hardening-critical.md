# Security hardening — critical fixes

Branch: `feature/railway-deployment` | Delivery: work-unit commits (chained PR if >400 authored lines) | Runner: Jest (`backend`)

## Specs

- **S1 — Stop tracking env files.** `.env`, `backend/.env`, `backend/.env.test`, `frontend/.env` must be removed from the git index (files stay on disk). `.gitignore` must ignore `.env` and `.env.*` while keeping every `*.env.example` tracked.
- **S2 — No real credentials in tracked files.** `backend/.env.example` must not contain real values (Kapso API key, phone number id, Google client email/private key). `backend/scripts/*.ts` must not contain a hardcoded `DATABASE_URL` credential; they must read `DATABASE_URL` from the environment and fail with a clear message when missing.
- **S3 — Protect cron triggers.** `POST /api/v1/cron/reminders` and `POST /api/v1/cron/same-day-reminders` must require header `x-cron-secret` matching `CRON_SECRET`. If `CRON_SECRET` is unset the endpoints must deny (fail closed). Invalid/missing secret → 401.
- **S4 — Verify WhatsApp webhook integrity.** `POST /api/v1/whatsapp/webhook` must verify HMAC-SHA256 over the raw body: Kapso `X-Webhook-Signature` (hex, secret `WHATSAPP_WEBHOOK_SECRET`) or Meta `x-hub-signature-256` (`sha256=<hex>`, secret `META_APP_SECRET`). Missing/invalid signature → 401. No verification secret configured → deny. `GET /api/v1/whatsapp/webhook` must reject when `WHATSAPP_WEBHOOK_VERIFY_TOKEN` is unset.
- **S5 — Verification.** Unit tests for S3/S4 observed RED before implementation and GREEN after; `npm run build` passes in `backend`. `npm test` passes except the pre-existing `appointments.service.spec.ts` expectation drift documented below.

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S1 | inline | done | `d559047` — `git check-ignore` confirms all four env files ignored; examples still tracked |
| T2 | S2 (env example) | inline | done | `25f0b34` — grep of tracked files shows only placeholders left |
| T3 | S2 (scripts) | inline | done | `6713acb` — no `Kwykih`/`shinkansen` left; tsc exit 0 |
| T4 | S3, S5 | inline | done | `e3ae2f5` — RED (TS2307) then GREEN 5/5; full-suite run shows new suite passing |
| T5 | S4, S5 | inline | done | `f1cb0cf` — RED (TS2554) then GREEN 9/9; `npm run build` exit 0 |

## Log

### L1 — User request (verbatim)
> Si comienza por lo critico

### L2 — Baseline verification evidence
- `npm test` after T5: 6 suites passed / 1 failed; 80 passed / 7 failed. All failures are `appointments.service.spec.ts` stale expectations (patient select `phone`, calendar `OR` filter, async notification mocks) that pre-date this work; the injector error (`ConfigService` missing) was fixed in `c43dffc`.
- `npm run build` (nest): exit 0.

### L3 — Pending operator actions (not code)
- Rotate every secret that was tracked: Brevo, Twilio, Gemini, Kapso, Google service-account key, JWT secrets, DB password.
- Purging the credentials from git history (`git filter-repo`) is destructive and was NOT performed; requires explicit approval.
- Configure `CRON_SECRET`, `WHATSAPP_WEBHOOK_SECRET` (and `META_APP_SECRET` if raw Meta forwarding is used) in Railway and in the external cron caller.

### L4 — Native review (RDD) unavailable
- Assess: `risk=high`, `review_due=true` (base `fff877c`, committed-only).
- Consent relayed; user granted. START created lineage `review-455d3a3dabe6241c` with lenses `review-risk,review-resilience,review-reliability`.
- All three reviewer captures refused twice with `opencode_review_transport_relay_refused (reason: provider_failed)`; a retained bound STATUS reoffered the identical slots and the retry failed the same way.
- Outcome: no native review verdict. This is **unavailable**, not approval. Delivery remains under ordinary repository policy.
