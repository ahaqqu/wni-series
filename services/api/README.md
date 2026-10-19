# services/api

**Status:** waitlist endpoint implemented (pre-alpha); auth/payments/entitlements still planned for Phase 5.

The trusted backend. Current pre-alpha scope: **email waitlist** for the landing page/KYC. Planned: auth, profiles, catalogue, orders, Mayar payments, entitlements, saves, runs, leaderboards, admin, reconciliation, and privacy requests.

## Planned stack

- Fastify 5 + TypeScript (strict), Node 24 LTS.
- PostgreSQL 18 + Drizzle ORM + migrations.
- Better Auth 1.7 (Google OAuth + email OTP), Resend for email.
- Mayar hosted checkout + SaaS membership; callbacks verified by API re-fetch; Postgres state machine.
- Pino logs, Sentry, health/readiness, Cloudflare Tunnel behind Caddy.
- Deployed as `ghcr.io/ahaqqu/wni-api:<sha>` on the netcup VPS.

## Boundaries

- Owns all prices, entitlements, payment state, and validated runs.
- Never trusts a client amount, entitlement flag, or score.
- No game-specific business logic; scope by `game_id`.
- No public admin surface; Cloudflare Access + role + audit.
- Secrets only in server environment; never in client bundles.

## Current endpoints

| Method | Path               | Purpose                                                      |
| ------ | ------------------ | ------------------------------------------------------------ |
| `GET`  | `/api/healthz`     | Liveness                                                     |
| `GET`  | `/api/readyz`      | Database readiness                                           |
| `POST` | `/api/v1/waitlist` | Validated email signup; honeypot; rate limit; no enumeration |

Run locally:

```bash
docker run -d --name wni-postgres-dev -e POSTGRES_DB=wni -e POSTGRES_USER=wni \
  -e POSTGRES_PASSWORD=wni_dev_password -p 127.0.0.1:5433:5432 postgres:18-alpine
DATABASE_URL=postgres://wni:wni_dev_password@127.0.0.1:5433/wni pnpm migrate
DATABASE_URL=postgres://wni:wni_dev_password@127.0.0.1:5433/wni pnpm dev
```

The Astro dev server proxies `/api` to `127.0.0.1:3000`.

See [architecture.md](../../docs/games/pejuang-nafkah/architecture.md) §7–§11.
