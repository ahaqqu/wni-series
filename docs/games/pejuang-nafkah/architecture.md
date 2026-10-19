# architecture.md — WNI Series platform + Pejuang Nafkah

**System architecture, security, privacy, deployment, and verification**
**Version:** 4.1
**Date:** 2026-10-19
**Status:** target architecture — game/checkout implementation not started; landing page + waitlist implemented; Mayar/live-data design added
**Host:** `https://wniseries.ahaqqu.com` — netcup VPS (2 vCPU / 4 GB / 100+ GB SSD) + Cloudflare edge.
**Asset origin (planned):** `https://assets.wniseries.ahaqqu.com` — R2 custom domain for signed paid packs and large public assets.
**Companion docs:** [specs.md](specs.md) · [design.md](design.md) · [plan.md](plan.md) · [research protocol](research/PROTOCOL.md) · [ADR index](../../adr/README.md) · [live-data/Mayar research](research/2026-10-live-data-and-mayar.md)

> **Architecture in one line:** a static-first Astro platform and a deterministic Three.js game, served from one hardened VPS behind Cloudflare, with a small Fastify + PostgreSQL core that owns identity, payments, entitlements, and validated runs — built so the next WNI game reuses the same spine.

---

## 1. Goals and constraints

### 1.1 Goals

- **Playable in one hand, on a moving train**, including intermittent connectivity.
- **Smooth on mid-range mobile and desktop**: 60 fps target, 30 fps floor.
- **Secure payments and entitlements** for a personal Mayar merchant: one-time All Maps + recurring Live, tamper-resistant, idempotent, reconcilable, refundable/cancellable.
- **Privacy by design** for Indonesian users under UU PDP / GR 33/2026.
- **Fast marketing site** with motion design that does not sacrifice Core Web Vitals.
- **Reusable series platform**: adding game #2 does not fork auth, payments, or deployment.
- **Operable by a very small team**: one VPS, one Postgres, one deploy pipeline, managed edge.
- **End-to-end verifiable** by an agent: local Docker, fixtures, Playwright, sandbox payments, evidence.

### 1.2 Constraints

- Existing VPS: netcup, 2 vCPU, 4 GB RAM, 100+ GB SSD. No Kubernetes, no heavy observability stack on the box.
- Existing host: `wniseries.ahaqqu.com`; Cloudflare-managed DNS assumed.
- Payment gateway: **Mayar** (invoice/payment request + SaaS membership). Personal merchant assumed; KYC is a launch gate.
- Live data: **TomTom Traffic** + **BMKG**; crowding/transit delay modelled/opt-in unless an operator feed is signed.
- Auth: Google + email OTP; no passwords.
- Three.js is the rendering stack (not Unity/Unreal/Godot web export).
- Single-player; no real-time multiplayer; leaderboard validation only.
- Budget: keep marginal infra under ~US$20/month; Mayar fees and live-provider costs are variable. Phase 2 live provider budget is capped and metered.

### 1.3 Non-goals

- Live traffic/weather/KRL APIs in Phase 1/v1; Phase 2 adds the licensed live layer. True live KRL/TransJakarta crowding/positions without an operator partnership is out of scope.
- Multi-region active-active; horizontal scale before metrics demand it.
- Microservices; event sourcing; Kafka/Redis cluster.
- Native mobile apps; Steam/console.
- Full open-world Jakarta.
- DRM that punishes legitimate players.

---

## 2. System context

```mermaid
flowchart LR
  Player[Player browser\nmobile / desktop] --> CF[Cloudflare\nDNS · WAF · cache · Access]
  CF --> Tunnel[cloudflared tunnel]
  Tunnel --> Caddy[Caddy\nstatic + reverse proxy]
  Caddy -->|/| Platform[Astro platform\nmarketing · account · checkout]
  Caddy -->|/play/*| Game[Vite game build\nThree.js + React HUD]
  Caddy -->|/api/*| API[Fastify API\nauth · orders · entitlements · runs]
  API --> PG[(PostgreSQL 18)]
  API --> R2[(Cloudflare R2\nbackups · paid assets)]
  API --> Mayar[Mayar\nhosted checkout + webhooks]
  API --> Resend[Resend\nOTP + receipts]
  API --> Sentry[Sentry\nfrontend + API errors]
  CF --> Google[Google OAuth]
  Player -->|payment redirect| Mayar
  Mayar -->|webhook| CF
```

**Trust boundaries:**

1. Browser (untrusted) — can be modified, replayed, inspected.
2. Cloudflare edge (semi-trusted) — TLS/WAF/cache; not an authorization boundary.
3. VPS (trusted) — Caddy, API, Postgres, cloudflared.
4. Third parties (Mayar, TomTom, BMKG, Google, Resend, Sentry, R2) — trust only via API verification/TLS/least privilege. Mayar webhooks are not signed in public docs; never grant from the payload.

---

## 3. Architecture decisions (ADR summary)

| #      | Decision                                                            | Alternatives considered               | Why                                                                                           |
| ------ | ------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| ADR-01 | **VPS-first + Cloudflare edge**, not all-Cloudflare free tier       | Workers + D1; Pages + Workers         | Postgres transactions, cron/reconciliation, fixed egress, no 10 ms CPU cap; VPS already owned |
| ADR-02 | **Single host + path routing** (`/`, `/play/*`, `/api/*`)           | Subdomains; separate Pages projects   | Same-origin cookies, simpler CORS, one deploy, one TLS origin                                 |
| ADR-03 | **Astro platform + Vite/Three.js game**                             | Next.js all-in-one; React SPA         | SEO/static performance for marketing; isolation and control for game                          |
| ADR-04 | **Vanilla Three.js + deterministic sim**, not React Three Fiber     | R3F, Babylon, PlayCanvas              | Frame control, small bundle, sim/render split, server replay                                  |
| ADR-05 | **Fastify + PostgreSQL + Drizzle**                                  | Hono + D1; NestJS; Prisma             | Mature transactions, Pino, schema-first, simple ops; Postgres is the source of truth          |
| ADR-06 | **Better Auth** (self-hosted)                                       | Clerk, Supabase Auth, Auth0           | No per-MAU pricing, PII in our DB, Google + email OTP, Drizzle adapter                        |
| ADR-07 | **Mayar hosted checkout + SaaS membership**                         | Direct card capture; other PG         | Minimizes PCI scope; local methods; one-time invoice + recurring tier; documented API         |
| ADR-08 | **Server-gated paid content packs**                                 | Client flag; all assets public        | Raises the cost of casual piracy; entitlements cannot be forged                               |
| ADR-09 | **PWA / offline-tolerant runs**                                     | Online-only                           | The game is played on trains; connectivity is unreliable                                      |
| ADR-10 | **Versioned content packs with `effective_from`**                   | Hard-coded data                       | Real-world schedules/fares/stations change                                                    |
| ADR-11 | **Free one route; All Maps Rp 79k once; Live Rp 49k/month; no ads** | Ads; one-time only; pure subscription | Free route is a real game; All Maps funds content; Live funds data and utility                |
| ADR-12 | **Cloudflare Tunnel** (recommended)                                 | Open 443 + origin cert                | Hides origin, no inbound ports, simple TLS; WAF/Access still apply                            |

### 3.1 Research inputs, ADR discipline, and scaling evidence

No item in the ADR summary is “decided by memory”. Every accepted architecture choice has a current [research brief](research/PROTOCOL.md) and an [ADR](../../adr/README.md) when it changes the stack, provider, data store, auth, payments, hosting, live-data source, cost cap, or an irreversible licence.

Minimum evidence before an architecture change:

- **Latest tech:** official release notes/current version, support/EOL, licence, security advisories; benchmarked on the reference device/network.
- **Data:** primary sources for fares/stations/schedules/road rules; two independent confirmations for volatile facts; `effectiveFrom`/expiry.
- **Security/privacy:** updated threat model/data map; authz; payment invariants; secrets; supply chain; abuse cases.
- **Performance/load:** budgets; 2× peak test; DB `EXPLAIN`/indexes; stale/offline behaviour.
- **Cost:** provider price/date/FX, worst case, caps, unit economics at 100/1k/10k.
- **Robustness/scaling:** failure/degraded/rollback path; what breaks at 10×; observability.
- **WNI experience:** field evidence for physical/emotional assumptions; native/punch-down review.

A stale brief is a red gate. Revalidate at every phase start and on provider/price/API/law/dependency/city change.

**Tradeoffs accepted:**

- Single VPS is a single point of failure; mitigated by backups, fast rebuild, Cloudflare, and a documented DR plan.
- Europe origin adds ~150–250 ms API latency from Jakarta; gameplay is client-side and API calls are infrequent. SLOs reflect this.
- Mayar has no public refund API; we own a manual, audited refund workflow. Mayar is MoR but does not process sales tax.
- Paid assets can still be extracted by a determined user; we protect entitlement and leaderboard integrity, not perfect DRM.

---

## 4. Monorepo structure

```text
wni-series/
├── apps/
│   ├── platform/              # Astro: marketing, auth, account, checkout, legal
│   └── play/                  # optional game-host shell (if not per-game builds)
├── games/
│   ├── _template/
│   │   ├── README.md
│   │   └── game.manifest.json
│   └── pejuang-nafkah/
│       ├── game.manifest.json
│       ├── package.json       # Vite build, base=/play/pejuang-nafkah/
│       ├── src/
│       │   ├── sim/           # deterministic, no DOM/Three imports
│       │   ├── render/        # Three.js scene, assets, camera, VFX
│       │   ├── ui/            # React HUD/menus
│       │   ├── content/       # typed content pack loaders
│       │   └── main.ts
│       └── public/
├── services/
│   └── api/                   # Fastify, Drizzle, Better Auth, Mayar, live jobs
├── packages/
│   ├── gamekit/               # engine loop, input, audio, quality, save, telemetry
│   ├── ui/                    # design system (React + CSS tokens)
│   ├── contracts/             # Zod schemas + API types (shared)
│   ├── content-schema/        # station/route/rules/scenario schemas
│   └── config/                # eslint/ts/prettier shared config
├── data/
│   ├── raw/                   # source extracts (OSM, station lists; Git LFS/large)
│   └── normalized/            # versioned JSON content packs
├── docs/
│   ├── games/pejuang-nafkah/  # specs, design, plan, architecture, research
│   ├── games/_template/
│   ├── verification/
│   └── runbooks/
├── infra/
│   ├── caddy/
│   ├── compose/
│   ├── cloudflared/
│   └── systemd/
├── scripts/                   # docs/link/scaffold checks, content helpers
├── .github/workflows/
├── pnpm-workspace.yaml
├── turbo.json
└── AGENTS.md
```

**Dependency rules:**

- `games/*` may depend on `packages/gamekit`, `packages/ui`, `packages/contracts`, `packages/content-schema`.
- `apps/platform` may depend on `packages/ui`, `packages/contracts`.
- `services/api` may depend on `packages/contracts`, `packages/content-schema` (server-side validation only).
- `packages/*` must not import `apps/*` or `services/*`.
- `sim/` must not import `render/` or `ui/`; the server replay imports `sim/` only.
- No game-specific code in the API core; games are registered by manifest and scoped by `game_id`.

---

## 5. Runtime architecture

### 5.1 One host, three surfaces

| Path             | Served by                              | Content                  | Cache                                      |
| ---------------- | -------------------------------------- | ------------------------ | ------------------------------------------ |
| `/`              | Caddy → `current/platform`             | Astro static HTML/CSS/JS | HTML: edge 5 min + purge; assets immutable |
| `/play/<slug>/*` | Caddy → `current/play/<slug>`          | Vite static game build   | HTML no-cache; hashed assets immutable     |
| `/api/*`         | Caddy → `api:3000`                     | Fastify JSON             | No cache                                   |
| `/admin*`        | Caddy → platform static + `/api/admin` | Admin UI                 | Cloudflare Access required                 |
| `/assets/*`      | Caddy → `current/assets` or R2 signed  | Public/paid assets       | Public immutable; paid signed short TTL    |

**Cloudflare Tunnel (recommended):**

```text
Internet → Cloudflare (DNS/WAF/cache/Access)
        → cloudflared (VPS, outbound-only)
        → Caddy :8080
        → static files / api:3000
```

- No inbound ports 80/443 needed; UFW allows SSH only (prefer Tailscale).
- Cloudflare handles TLS at the edge; origin traffic is encrypted inside the tunnel.
- Mayar callbacks hit `https://wniseries.ahaqqu.com/api/v1/webhooks/mayar/:secret`; the payload is untrusted, so the app re-fetches the transaction/member from Mayar, verifies merchant/product/amount/customer, and deduplicates. See §10.4.
- If Tunnel is not used, expose 443 with a Cloudflare Origin Certificate and restrict origin firewall to Cloudflare IP ranges. The app is identical; only the runbook changes.

### 5.2 Caddy routing (target)

```caddyfile
:8080 {
  encode zstd gzip

  handle /api/* {
    reverse_proxy api:3000
  }

  handle /play/* {
    root * /srv/wni/current/play
    try_files {path} {path}/ /404.html
    file_server
  }

  # Hashed assets immutable; HTML must revalidate.
  @game_html path /play/*/ /play/*/index.html
  header @game_html Cache-Control "no-cache"
  @hashed_assets path *.js *.css *.wasm *.glb *.gltf *.ktx2 *.png *.webp *.avif *.svg *.woff2 *.ogg *.mp3 *.wav
  header @hashed_assets Cache-Control "public, max-age=31536000, immutable"

  handle /assets/* {
    root * /srv/wni/current/assets
    file_server
    header Cache-Control "public, max-age=31536000, immutable"
  }

  handle {
    root * /srv/wni/current/platform
    try_files {path} {path}/ /404.html
    file_server
  }

  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    X-Content-Type-Options "nosniff"
    Referrer-Policy "strict-origin-when-cross-origin"
    Permissions-Policy "camera=(), microphone=(), geolocation=()"
    Cross-Origin-Opener-Policy "same-origin"
    Cross-Origin-Resource-Policy "same-origin"
    Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://assets.wniseries.ahaqqu.com; media-src 'self' blob: https://assets.wniseries.ahaqqu.com; font-src 'self'; connect-src 'self' https://assets.wniseries.ahaqqu.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://*.duitku.com; worker-src 'self' blob:; object-src 'none'; upgrade-insecure-requests"
  }
}
```

CSP is refined in Phase 4/5: hashed/nonce for inline boot data, no `unsafe-eval`, and a report-only rollout before enforcement. The static pre-alpha landing page currently uses `style-src 'self' 'unsafe-inline'` because Astro inlines CSS and the route map/report bars use data-driven style attributes; scripts remain strict, and this exception should be revisited before checkout. Three.js shaders are compiled by WebGL, not `eval`; avoid WASM initially. Sentry should be tunnelled through the API (same-origin) or explicitly allowlisted; do not add `connect-src *`.

### 5.3 Docker Compose (target)

```yaml
services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - /srv/wni/current:/srv/wni/current:ro
      - caddy_data:/data
      - caddy_config:/config
    networks: [edge]
    # no published ports when using cloudflared

  cloudflared:
    image: cloudflare/cloudflared:latest
    restart: unless-stopped
    command: tunnel --no-autoupdate run
    environment:
      TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN}
    networks: [edge]

  api:
    image: ghcr.io/ahaqqu/wni-api:${RELEASE_TAG}
    restart: unless-stopped
    env_file:
      - ${ENV_FILE:-.env}
    depends_on:
      postgres: { condition: service_healthy }
    networks: [edge, data]
    read_only: true
    tmpfs: [/tmp]
    security_opt: [no-new-privileges:true]
    user: '10001:10001'

  postgres:
    image: postgres:18-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: wni
      POSTGRES_USER: wni
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks: [data]
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U wni -d wni']
      interval: 10s
      timeout: 5s
      retries: 10
    # no published ports

  migrate:
    image: ghcr.io/ahaqqu/wni-api:${RELEASE_TAG}
    command: ['node', 'dist/migrate.js']
    env_file:
      - ${ENV_FILE:-.env}
    depends_on:
      postgres: { condition: service_healthy }
    networks: [data]
    profiles: ['migrate']

networks:
  edge:
  data:
    internal: true

volumes:
  pgdata:
  caddy_data:
  caddy_config:
```

- API image: multi-stage, `node:24-alpine` (LTS), non-root UID 10001, only production deps, `tini`/dumb-init, healthcheck `/api/healthz`.
- Migrations run as a one-shot service before `api` restart; expand/contract.
- Static release files are baked into the release directory, not the API image.
- Postgres volume is the only persistent state; paid assets live in R2.

### 5.4 Release layout on the VPS

```text
/srv/wni/
├── releases/
│   └── <git-sha>/
│       ├── platform/          # Astro dist
│       ├── play/<slug>/       # Vite game dist
│       └── assets/            # optional public assets
├── current -> releases/<git-sha>
├── shared/
│   └── backups/               # local staging before R2 upload
├── compose.yaml
├── Caddyfile
└── .env                       # 600, root/wni-deploy only
```

Deploy is atomic: build → upload to `releases/<sha>` → run migrations → `ln -sfn` swap → restart API → smoke test → keep previous release for rollback.

---

## 6. Application architecture

### 6.1 Platform (`apps/platform`, Astro)

- Static output; React islands only for auth/account/checkout.
- Content collections for devlog/route guides; MDX optional.
- Pages: `/`, `/games/pejuang-nafkah`, `/peta`, `/harga`, `/devlog`, `/faq`, `/tentang`, `/kontak`, `/privasi`, `/syarat`, `/refund`, `/masuk`, `/akun`, `/checkout/return`, `/admin`.
- SEO: canonical, hreflang (id/en), Open Graph, `VideoGame`/`FAQPage`/`Organization` JSON-LD, sitemap, RSS.
- Motion: CSS/WAAPI + IntersectionObserver; optional Three.js hero lazy-loaded only on capable desktops; reduced-motion fallback.
- Accessibility: semantic HTML, focus management, skip links, contrast, captions.
- No secrets; only `PUBLIC_*` env values.

### 6.2 Game (`games/pejuang-nafkah`, Vite + Three.js + React)

- Built with `base=/play/pejuang-nafkah/`; output copied to `current/play/pejuang-nafkah/`.
- **Sim/render separation:**
  - `sim/`: pure TypeScript, fixed timestep, deterministic PRNG (xoshiro128**/mulberry32), no DOM/Three imports. Runs in browser and Node.
  - `render/`: Three.js scene, asset loading, camera, VFX. Reads sim state and interpolates.
  - `ui/`: React HUD/menus outside the canvas; updates at 10 Hz; no per-frame React renders.
- **Loop:** `requestAnimationFrame`; accumulator fixed step (60 Hz sim, 30 Hz low-end); render interpolation; max frame delta clamp.
- **Input:** pointer events with `touch-action: none`; pointer capture; relative steering; hold/brake; tap/context; input buffer 120 ms; no DOM re-render per frame.
- **State:** run state machine; checkpoints every 10 s/beat; save to IndexedDB; server sync when online.
- **Assets:** GLB (Draco/meshopt), KTX2/Basis textures, Opus/OGG + AAC fallback, WebP/AVIF for UI; immutable hashed filenames; preload critical, stream next block.
- **Quality presets:** detect `devicePixelRatio`, `navigator.hardwareConcurrency`, `WEBGL_debug_renderer_info`, memory hints; low/medium/high; dynamic resolution scaling to hold frame budget; shadows off on low; LOD/instancing.
- **Offline/PWA:** Workbox service worker; app shell + free content cached; paid content cached after entitlement sync with 7-day signed token; no API response caching with PII.
- **Telemetry:** batched, sampled, no PII; send on `visibilitychange`/interval; drop on failure.
- **No third-party scripts** in the game shell except optional privacy analytics; CSP-strict.

### 6.3 API (`services/api`, Fastify + TypeScript)

- Modular monolith: `auth`, `users`, `catalog`, `orders`, `payments`, `subscriptions`, `entitlements`, `live`, `runs`, `leaderboards`, `admin`, `jobs`, `privacy`.
- Fastify plugins: `@fastify/cookie`, `@fastify/cors` (same-origin in prod, no CORS needed), `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/formbody`, `@fastify/under-pressure`, `@fastify/static` (admin only), Pino.
- Validation: Zod schemas from `packages/contracts`; route-level `preHandler` auth/role checks.
- Errors: RFC 7807 problem+json; no stack traces to clients; correlation ID.
- Logging: Pino JSON to stdout; redact cookies/tokens/emails? Email is PII; hash/truncate in logs. Include `request_id`, `user_id` (not email), `order_id`, `provider_ref`.
- Jobs: in-process scheduler for reconciliation/cleanup (single instance), with Postgres advisory lock to avoid overlap. If scaling, move to `pg-boss`/worker.
- Graceful shutdown: stop accepting, drain, close DB.
- Health: `/api/healthz` (liveness), `/api/readyz` (DB ping), `/api/metrics` internal-only.

### 6.4 Database

- PostgreSQL 18, UTC, `pgcrypto`, `citext`, `pg_stat_statements`.
- Migrations: Drizzle Kit, forward-only, expand/contract; never destructive in the same deploy.
- Connection pool: `postgres` driver, max 10–20; statement timeout 5 s; idle timeout 30 s.
- Backups: nightly `pg_dump -Fc` + WAL? v1 nightly + 6-hourly logical dump; RPO ≤6 h, RTO ≤2 h. Phase 7 evaluates `pgBackRest`/WAL for RPO ≤15 min.
- Restore drill quarterly; record in `status.md`.
- Retention: orders/tax 10 years; sessions 30 days; logs 30 days; runs 24 months; analytics 14 months; deleted accounts purged after 30 days.

---

## 7. Data model (core)

> Names are indicative; final Drizzle schema lives in `services/api/src/db/schema.ts`.

### 7.1 Auth/user

| Table             | Key columns                                                                                                 | Notes                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `user`            | `id`, `name`, `email` (citext, unique), `email_verified`, `image`, `created_at`, `updated_at`, `deleted_at` | Better Auth core                                      |
| `session`         | `id`, `user_id`, `token` (hashed), `expires_at`, `ip_hash`, `user_agent`, `created_at`                      | Rotating; revoke all                                  |
| `account`         | `id`, `user_id`, `provider_id`, `account_id`, `access_token?`, `refresh_token?`, `expires_at?`              | Google; tokens encrypted/avoid storing where possible |
| `verification`    | `id`, `identifier`, `value` (hashed OTP), `expires_at`, `attempts`                                          | Email OTP                                             |
| `profile`         | `user_id`, `display_name`, `avatar_url`, `locale`, `timezone`, `marketing_opt_in`, `age_attested_at`        | Minimal PII                                           |
| `user_device`     | `id`, `user_id`, `ua_hash`, `ip_hash`, `last_seen_at`, `revoked_at`                                         | Device list; no fingerprinting                        |
| `privacy_request` | `id`, `user_id`, `type`, `status`, `requested_at`, `completed_at`                                           | Export/delete                                         |
| `waitlist`        | `id`, `email` (citext unique), `consent`, `source`, `ip_hash`, `created_at`, `updated_at`                   | Pre-alpha marketing list; no account required         |

### 7.2 Catalog/orders/payments/subscriptions

| Table                | Key columns                                                                                                                                                                                                                                                                                                                                                                                                          | Notes                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `games`              | `id`, `slug` (unique), `title`, `status`, `manifest_json`, `created_at`                                                                                                                                                                                                                                                                                                                                              | Series registry                                                |
| `products`           | `id`, `game_id`, `sku` (unique), `name`, `description`, `price_idr`, `tax_inclusive`, `kind` (`one_time`/`subscription`/`cosmetic`), `entitlement_keys`, `provider_product_id`, `provider_tier_id`, `billing_interval`, `active`, `metadata`                                                                                                                                                                         | Server price authority; Mayar IDs are config, not client input |
| `orders`             | `id` (uuid), `user_id`, `game_id`, `product_id`, `sku_snapshot`, `amount_idr`, `currency`, `status` (`PENDING`, `PAID`, `FAILED`, `CANCELLED`, `EXPIRED`, `REFUNDED`, `REVOKED`), `order_ref` (unique), `provider`, `provider_invoice_id`, `provider_transaction_id`, `payment_url`, `payment_method`, `idempotency_key`, `expires_at`, `paid_at`, `failed_at`, `refunded_at`, `created_at`, `updated_at`, `version` | One active pending per user/SKU; one-time All Maps             |
| `subscriptions`      | `id`, `user_id`, `product_id`, `provider`, `provider_member_id`, `provider_customer_id`, `provider_invoice_id`, `status` (`PENDING`, `ACTIVE`, `PAST_DUE`, `CANCELLED`, `EXPIRED`), `current_period_start`, `current_period_end`, `cancel_at_period_end`, `last_event_at`, `created_at`, `updated_at`                                                                                                                | Live subscription; access until `current_period_end`           |
| `payment_events`     | `id`, `provider`, `provider_event_id` (nullable), `provider_transaction_id` (nullable), `provider_member_id` (nullable), `event_type`, `payload_hash`, `verified_via_api` (bool), `verification_result`, `received_at`, `processed_at`, `raw_payload` (redacted)                                                                                                                                                     | Append-only audit; webhook is a trigger, API is truth          |
| `entitlements`       | `id`, `user_id`, `game_id`, `entitlement_key`, `source_order_id`, `source_subscription_id`, `granted_at`, `revoked_at`, `metadata`                                                                                                                                                                                                                                                                                   | Unique active `(user_id, game_id, entitlement_key)`            |
| `refunds`            | `id`, `order_id`, `reason`, `amount_idr`, `status`, `processed_by`, `processed_at`, `proof_ref`                                                                                                                                                                                                                                                                                                                      | Manual transfer; audit; no Mayar refund API                    |
| `webhook_deliveries` | `id`, `provider`, `provider_event_id`, `payload_hash`, `received_at`, `status`, `attempts`                                                                                                                                                                                                                                                                                                                           | Dedup/replay defense                                           |
| `outbox`             | `id`, `type`, `payload`, `status`, `attempts`, `next_attempt_at`                                                                                                                                                                                                                                                                                                                                                     | Emails/receipts/reconciliation                                 |
| `provider_calls`     | `id`, `provider`, `operation`, `corridor_id`, `status_code`, `cost_micros`, `duration_ms`, `called_at`                                                                                                                                                                                                                                                                                                               | Budget/cost telemetry                                          |

**Indexes:** `orders(user_id, created_at)`, `orders(status, expires_at)`, `orders(provider_transaction_id)`, `subscriptions(user_id, status)`, `subscriptions(provider_member_id)`, `entitlements(user_id, game_id)`, `payment_events(provider_transaction_id)`, `provider_calls(provider, called_at)`.

**Money:** integer rupiah only, no floats. `amount_idr = price_idr` (gross); tax breakdown computed at receipt time when applicable. One-time All Maps price **79,000**; Live **49,000/month**.

### 7.3 Game/runs/saves

| Table                 | Key columns                                                                                                                                                                      | Notes                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `saves`               | `user_id`, `game_id`, `schema_version`, `revision`, `state_json`, `checksum`, `updated_at`                                                                                       | Server backup; local authoritative |
| `runs`                | `id`, `user_id`, `game_id`, `mode`, `route_id`, `content_version`, `seed`, `started_at`, `ended_at`, `score`, `metrics_json`, `input_hash`, `replay_ref`, `status`, `created_at` | Leaderboard source                 |
| `run_tokens`          | `id`, `user_id`, `game_id`, `seed`, `route_id`, `mode`, `content_version`, `issued_at`, `expires_at`, `used_at`                                                                  | Single-use server-issued           |
| `leaderboard_entries` | `id`, `run_id`, `game_id`, `mode`, `route_id`, `period`, `category`, `score`, `user_id`, `created_at`                                                                            | Unique run/category                |
| `content_versions`    | `game_id`, `version`, `manifest_url`, `checksum`, `effective_from`, `created_at`                                                                                                 | Version pin                        |

### 7.4 Live data

| Table              | Key columns                                                                                                           | Notes                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `data_sources`     | `id`, `provider`, `dataset`, `licence`, `attribution`, `terms_url`, `retrieved_at`, `active`                          | Source registry; no data without a licence row                                                  |
| `live_snapshots`   | `id`, `game_id`, `corridor_id`, `mode`, `as_of`, `expires_at`, `payload_json`, `confidence`, `checksum`, `created_at` | Derived metrics only; no raw provider redistribution; unique `(corridor_id, as_of, source_set)` |
| `live_reports`     | `id`, `user_id`, `corridor_id`, `kind` (`crowd`/`delay`/`flood`), `value`, `note`, `created_at`, `ip_hash`            | Opt-in; rate-limited; no precise location; moderation                                           |
| `provider_budgets` | `month`, `provider`, `call_limit`, `spend_limit_micros`, `used_calls`, `used_spend_micros`, `updated_at`              | Enforced by the snapshot worker; kill switch                                                    |
| `provider_calls`   | `id`, `provider`, `operation`, `corridor_id`, `status_code`, `cost_micros`, `duration_ms`, `called_at`                | Cost/freshness telemetry                                                                        |

### 7.5 Ops

| Table           | Key columns                                                                                             | Notes                           |
| --------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `audit_log`     | `id`, `actor_id`, `action`, `entity`, `entity_id`, `before_json`, `after_json`, `ip_hash`, `created_at` | Admin/payment                   |
| `feature_flags` | `key`, `value_json`, `updated_at`                                                                       | Kill switches                   |
| `rate_limits`   | `key`, `window_start`, `count`                                                                          | DB fallback; Cloudflare primary |
| `job_locks`     | `name`, `locked_until`, `locked_by`                                                                     | Advisory locks                  |

**Indexes:** `orders(user_id, created_at)`, `orders(status, expires_at)`, `orders(order_ref)`, `orders(provider_transaction_id)`, `entitlements(user_id, game_id)`, `runs(game_id, mode, route_id, created_at)`, `leaderboard_entries(period, category, score desc)`, `payment_events(provider_transaction_id)`, `sessions(expires_at)`.

**Money:** integer rupiah only, no floats. `amount_idr = price_idr` (gross); tax breakdown computed at receipt time when applicable.

---

## 8. API design

### 8.1 Conventions

- Base: `/api/v1` (Better Auth under `/api/auth/*`).
- JSON; `application/problem+json` errors.
- Auth: HttpOnly session cookie; `credentials: include`; same-origin.
- Idempotency: `Idempotency-Key` required on checkout; unique per user.
- Rate limits: per IP + per user; Cloudflare + app-level.
- Pagination: cursor (`created_at,id`); max 50.
- Versioning: additive v1; breaking changes under `/api/v2`.
- No PII in URLs; no secrets in query strings.
- Request IDs: `X-Request-Id` echoed; structured logs.

### 8.2 Public/user endpoints

| Method   | Path                                      | Purpose                                                       |
| -------- | ----------------------------------------- | ------------------------------------------------------------- |
| `GET`    | `/api/healthz`                            | Liveness                                                      |
| `GET`    | `/api/readyz`                             | DB readiness                                                  |
| `GET`    | `/api/v1/games`                           | Catalog + manifest summary                                    |
| `GET`    | `/api/v1/games/:slug`                     | Game page data (public)                                       |
| `GET`    | `/api/v1/games/:slug/bootstrap`           | Content version, config, entitlements, daily seed, play token |
| `GET`    | `/api/v1/me`                              | Session user, profile, entitlements                           |
| `PATCH`  | `/api/v1/me`                              | Display name, locale, marketing opt-in                        |
| `DELETE` | `/api/v1/me`                              | Request deletion (re-auth)                                    |
| `GET`    | `/api/v1/me/export`                       | Data export job                                               |
| `GET`    | `/api/v1/me/devices`                      | Device list                                                   |
| `POST`   | `/api/v1/me/devices/:id/revoke`           | Revoke session(s)                                             |
| `GET`    | `/api/v1/products?game=:slug`             | Public prices                                                 |
| `GET`    | `/api/v1/payment-methods`                 | Mayar channels + fee display (cached, optional)               |
| `POST`   | `/api/v1/checkout`                        | Create one-time order + Mayar invoice/payment URL             |
| `POST`   | `/api/v1/subscriptions/checkout`          | Create/load Mayar member + invoice for Live                   |
| `GET`    | `/api/v1/subscriptions/me`                | Plan, renewal date, status, cancel-at-period-end              |
| `POST`   | `/api/v1/subscriptions/cancel`            | Cancel at period end (Mayar cancel)                           |
| `GET`    | `/api/v1/orders/:id`                      | Owner-only status                                             |
| `GET`    | `/api/v1/live/briefing?corridor=:id`      | Live/estimated snapshot for a corridor (Live only)            |
| `POST`   | `/api/v1/live/plan`                       | Compare departure windows from a frozen snapshot (Live only)  |
| `POST`   | `/api/v1/live/reports`                    | Opt-in crowd/delay report (rate-limited)                      |
| `POST`   | `/api/v1/runs`                            | Start run (server token/seed)                                 |
| `PATCH`  | `/api/v1/runs/:id`                        | Submit run result/trace                                       |
| `GET`    | `/api/v1/leaderboards/:game/:mode`        | Daily/weekly/all-time                                         |
| `GET`    | `/api/v1/saves/:game`                     | Fetch cloud save                                              |
| `PUT`    | `/api/v1/saves/:game`                     | Upload save (checksum/revision)                               |
| `POST`   | `/api/v1/waitlist`                        | Email signup for release updates (pre-alpha)                  |
| `POST`   | `/api/v1/telemetry`                       | Anonymous batched events                                      |
| `POST`   | `/api/v1/support`                         | Contact form (rate-limited, spam-protected)                   |
| `GET`    | `/api/v1/config`                          | Feature flags / maintenance                                   |
| `GET`    | `/api/v1/content/:game/:version/manifest` | Content manifest (public/free or entitled)                    |

### 8.3 Webhooks/internal

| Method | Path                                       | Purpose                                               |
| ------ | ------------------------------------------ | ----------------------------------------------------- |
| `POST` | `/api/v1/webhooks/mayar/:secret`           | Mayar webhook trigger; re-fetch API; no payload trust |
| `GET`  | `/api/v1/checkout/return`                  | Not an API; platform page polls order                 |
| `POST` | `/api/v1/internal/reconcile`               | Signed cron trigger or localhost-only                 |
| `POST` | `/api/v1/internal/live-refresh`            | Scheduled snapshot worker (advisory lock)             |
| `POST` | `/api/v1/internal/cleanup`                 | Retention/expiry job                                  |
| `GET`  | `/api/v1/admin/orders`                     | Admin list (role)                                     |
| `POST` | `/api/v1/admin/orders/:id/refund`          | Refund + revoke                                       |
| `POST` | `/api/v1/admin/entitlements/:userId/grant` | Manual grant (audited)                                |
| `GET`  | `/api/v1/admin/subscriptions`              | Subscription/renewal/cancel list                      |
| `GET`  | `/api/v1/admin/live-costs`                 | Provider calls/spend/freshness                        |
| `GET`  | `/api/v1/admin/audit`                      | Audit log                                             |

### 8.4 Checkout request/response (sketch)

```http
POST /api/v1/checkout
Idempotency-Key: 01J...ULID
Content-Type: application/json

{ "sku": "pn-all-maps" }
```

```json
{
  "orderId": "01J...",
  "orderRef": "WNI-PN-01J...",
  "amountIdr": 79000,
  "status": "pending",
  "paymentUrl": "https://<tenant>.mayar.id/invoices/...",
  "expiresAt": "2026-10-19T23:15:00+07:00"
}
```

```http
POST /api/v1/subscriptions/checkout
Idempotency-Key: 01J...ULID
Content-Type: application/json

{ "sku": "pn-live-monthly" }
```

```json
{
  "subscriptionId": "01J...",
  "status": "pending",
  "paymentUrl": "https://<tenant>.mayar.shop/pl/...",
  "amountIdr": 49000
}
```

- The server reads prices from `products`; the client never sends an amount.
- One-time checkout uses Mayar Invoice/Payment Request with `extraData.orderId`; subscription uses a SaaS membership tier and membership invoice.
- Reusing the same idempotency key returns the same order/payment URL; a different SKU with the same key is `409`.
- A second pending order for the same SKU is rejected or returns the existing one.
- Mayar fees are absorbed by the merchant; the displayed price is the final customer price.
- Never trust return-page params; show pending until server/API confirms.

## 9. Auth and session design

### 9.1 Flows

**Google OAuth (PKCE):**

1. `/api/auth/sign-in/social` → Google consent (state, nonce, PKCE).
2. Callback → exchange code → ID token/email verified.
3. Link by verified email; create user/profile if new.
4. Set session cookie; redirect to platform.
5. No sensitive scopes; request `openid email profile`.

**Email OTP:**

1. `POST /api/auth/email-otp/send-verification-otp` with email.
2. Server rate-limits; stores hashed OTP (10 min, 6 digits, 5 attempts).
3. Resend with SPF/DKIM/DMARC; email contains code + expiry + “ignore if not you”.
4. `POST /api/auth/sign-in/email-otp` verifies; single-use; creates/links user.
5. Generic responses; no account enumeration beyond necessary signup UX.

**Guest trial:** local-only profile/run; no server PII; account prompt after arrival. On signup, merge local progress with explicit consent (checksum/version).

### 9.2 Session/CSRF

- Cookie: `__Secure-wni_session` (host-only), `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, 30-day rolling; refresh token rotation handled by Better Auth.
- CSRF: origin/referer validation for state-changing requests; SameSite=Lax; no cross-site forms; double-submit only if needed.
- Session revocation: user “sign out everywhere”; admin revoke; passwordless means no password reset; email change requires re-auth.
- IP/UA: store hashes for anomaly/device list, not for tracking; no fingerprinting.
- Admin: Cloudflare Access + Google SSO + app role `admin`; separate session audience; 2FA enforced by Access; no public admin login.

### 9.3 Account linking policy

- Same **verified** email may link Google + OTP.
- If an account exists and the provider email is verified, link only after an authenticated session or OTP proof; never auto-link on unverified email.
- Conflicting accounts → require sign-in to the existing account and explicit link.
- Tests: takeover attempts, unverified email, provider mismatch, deleted account.

---

## 10. Payments, subscriptions, and entitlements

### 10.1 Offer and entitlement model

| Product    | SKU               | Price (gross) | Entitlements                     | Provider primitive              |
| ---------- | ----------------- | ------------: | -------------------------------- | ------------------------------- |
| Free route | —                 |             0 | `free_route` (one corridor)      | server-selected                 |
| All Maps   | `pn-all-maps`     |        79,000 | `maps_all` (permanent)           | Mayar Invoice / Payment Request |
| Live       | `pn-live-monthly` |  49,000/month | `maps_all` + `live` while active | Mayar SaaS membership tier      |
| Cosmetics  | `pn-cosmetic-*`   | 15,000–25,000 | cosmetic key                     | Mayar Invoice                   |

- `maps_all` is permanent; it is not revoked when Live expires.
- `live` is time-bound to `current_period_end`; access continues until then even after cancel.
- `free_route` is a chosen corridor; a 14-day courtesy change is allowed once, then server rejects a switch without `maps_all`.
- Live includes maps for its duration. If it expires and no `maps_all`, the user falls back to their free route.
- Prices are server-side. The client sends SKU only.

### 10.2 One-time All Maps sequence

```mermaid
sequenceDiagram
  participant B as Browser
  participant A as API
  participant M as Mayar
  B->>A: POST /checkout {sku: pn-all-maps}
  A->>A: create order (PENDING), price=79000
  A->>M: POST /hl/v2/invoices/create (extraData.orderId)
  M-->>A: invoice id + link
  A-->>B: paymentUrl
  B->>M: pay (QRIS/e-wallet/VA/card)
  M-->>A: webhook payment.received (untrusted)
  A->>M: GET /hl/v2/transactions/{id}
  M-->>A: status=paid, amount, customer, extraData
  A->>A: verify + grant maps_all once (transaction)
  A-->>B: order paid; entitlement active
```

### 10.3 Live subscription sequence

```mermaid
sequenceDiagram
  participant B as Browser
  participant A as API
  participant M as Mayar
  B->>A: POST /subscriptions/checkout {sku: pn-live-monthly}
  A->>A: create/reuse local subscription (PENDING)
  A->>M: POST /hl/v2/memberships/members/create (or reuse member)
  M-->>A: memberId
  A->>M: POST /hl/v2/memberships/members/{memberId}/invoice/create
  M-->>A: membershipBillUrl
  A-->>B: paymentUrl
  B->>M: pay
  M-->>A: webhook membership.newMemberRegistered/payment.received
  A->>M: GET /memberships/members/{memberId}?productId=...
  M-->>A: status=active, expiredAt/nextPayment
  A->>A: grant maps_all + live until current_period_end
  A-->>B: active
```

Renewal: Mayar sends payment/membership events; re-fetch member detail; extend `current_period_end`. Expiry/unsubscribe: revoke `live` at `expiredAt`/period end; keep `maps_all`. Cancel: call Mayar cancel, set `cancel_at_period_end=true`; do not immediately revoke.

### 10.4 Webhook security (no documented signature)

Mayar's public webhook docs do not document an HMAC signature. The callback is a **low-trust trigger**:

1. Persist the raw payload hash and event type (redacted) in `webhook_deliveries`.
2. If the payload contains a transaction ID, call `GET /hl/v2/transactions/{id}`; for membership events, call `GET /hl/v2/memberships/members/{memberId}?productId=...`.
3. Verify:
   - `user.id`/merchant ID is ours;
   - product ID/tier ID match the configured Mayar product;
   - amount equals the server price (79,000 or 49,000);
   - customer email maps to our user/subscription;
   - status is paid/active, and `expiredAt`/`nextPayment` are sane;
   - the order/subscription is in a valid prior state.
4. Grant/extend in a transaction; unique constraints on provider transaction/member + entitlement.
5. Return `200` quickly after persisting; if the API check fails, return `503` for retry. If the payload is forged but the API check fails, no grant.

Add an unguessable webhook path and an IP allowlist if Mayar publishes one; neither replaces API verification. If Mayar later adds a signature, verify it as an additional control.

### 10.5 Reconciliation and status

- Pending orders older than 5 minutes: query Mayar transaction/invoice/member state with backoff.
- Daily job: orders ↔ transactions, subscriptions ↔ members, entitlements ↔ active periods; alert on mismatch.
- Return page is display-only; it polls our order/subscription API; never grant from `redirectUrl` params.
- Keep a manual admin path for edge cases; every action audited.
- If Mayar is down: checkout returns a clear retry message; existing entitlements remain; no duplicate orders.

### 10.6 Entitlements

- Source of truth: Postgres; Mayar is the payment/subscription system, not the game’s authorization system.
- Grant and revoke are transactional and audited.
- `maps_all`: one active row per user/game; source order; permanent.
- `live`: one active row per user/game; source subscription; `expires_at` snapshot; extend/revoke on verified events.
- `free_route`: profile field/row; server validates the chosen corridor; one courtesy change via `route_changed_at`.
- Paid content manifests require `maps_all` or an active `live`; cosmetics require their key.
- Short-lived play token includes entitlement summary; server re-checks DB for paid content and run submission.

### 10.7 Refunds, cancellation, chargebacks

- Mayar has no public refund API; refunds are manual bank transfer with proof, audited.
- One-time All Maps refund: revoke `maps_all` after refund; policy per `refund.astro`/specs.
- Live cancellation: set cancel-at-period-end; access until `current_period_end`; no partial-month refund by default except statutory/goodwill.
- Chargeback: freeze entitlement, preserve evidence, respond; repeat abuse flagged.
- Refund/chargeback emails and receipts use the support address.

### 10.8 Tax and Merchant of Record

- Mayar is a Merchant of Record for checkout but its docs state it does **not** process sales tax; we remain responsible for tax reporting/payment.
- Prices are gross. If PKP, PPN 11% is included; if not, no PPN. Accountant confirms before launch.
- Receipts show gross, tax (if applicable), order ID, SKU, and support contact.

### 10.9 Fees and take rate (planning)

At QRIS + Starter (2026-10-19): one-time All Maps 2.2% → Rp 77,262 net; Live 4.7% → Rp 46,697/month net. Business plan (Rp 349k/month) becomes cheaper at ~712 active subs. Channel/plan fees can change; re-check quarterly. Full model: [research](research/2026-10-live-data-and-mayar.md).

---

## 10A. Live data architecture (Phase 2)

### 10A.1 Principles

1. **Server-side only.** Provider keys never reach the client. The API returns normalized snapshots, not raw provider payloads.
2. **Snapshot, not stream.** A run uses one frozen snapshot at start; the planner may request a fresh one. This preserves determinism, fairness, and offline tolerance.
3. **Corridor cache, not per-user calls.** A background worker polls the providers per corridor/time bucket; all subscribers read the same snapshot. Single-flight and advisory locks prevent duplicate spend.
4. **Derived data only.** Store delay ratio, speed, incident type/count, precipitation/nowcast severity, crowding estimate, confidence, and timestamps. Do not redistribute raw TomTom data or bypass licence terms.
5. **Cost is a feature.** Budget caps, adaptive polling, stale fallback, and a kill switch are part of the design, not an afterthought.

### 10A.2 Components

```mermaid
flowchart LR
  Cron[Snapshot worker
advisory lock] --> TT[TomTom Traffic
flow + incidents]
  Cron --> BM[BMKG
forecast + nowcast]
  TT --> Norm[normalize + derive]
  BM --> Norm
  Norm --> Cache[(Postgres live_snapshots
+ in-memory LRU)]
  Cache --> API[Fastify /live/*]
  API -->|active live entitlement| Game[Game / planner]
  API -->|no live| Free[Free/All Maps
authored conditions]
  Cron --> Budget[provider_budgets
provider_calls]
  Budget --> Alert[alerts + kill switch]
```

- `services/api` module `live` or a small `services/live` worker; same Postgres. Start as an in-process scheduled job with advisory lock; split later only if load demands.
- `live_snapshots` keyed by corridor, mode, source set, `as_of`; TTL 15–35 min. Latest row + in-memory cache; no Redis required at current scale.
- `provider_budgets` row per month/provider; worker checks before each call; if over, stop fetching and serve stale.
- `provider_calls` records status/latency/estimated cost for the admin dashboard.

### 10A.3 Sources and refresh

| Source                 | Data                                                               | Poll policy                                            | Cache key                          |
| ---------------------- | ------------------------------------------------------------------ | ------------------------------------------------------ | ---------------------------------- |
| TomTom Flow Segment    | speed/travel time/confidence per point                             | 5 min peak (06:00–10:00, 16:00–21:00), 30 min off-peak | corridor + point + 5/30-min bucket |
| TomTom Incidents       | incidents/closures/flooding in bbox                                | same as flow, one bbox per corridor set                | bbox + bucket                      |
| BMKG forecast          | 3-hour forecast per kelurahan                                      | 2×/day (issuance), cache 3 h                           | `adm4` + issuance                  |
| BMKG nowcast           | CAP alerts                                                         | 10 min                                                 | province/area                      |
| Crowd model            | time/direction/headway/weather/calendar/incidents + opt-in reports | compute on snapshot read/write                         | corridor + time bucket             |
| PetaBencana (optional) | flood reports/gauges                                               | only after commercial licence                          | corridor/area                      |

At 10 corridors × 4 flow points, adaptive polling (5 min during 9 peak hours, 30 min otherwise) is ~165,600 flow calls/month and ~4,140 incident calls/month: **~€149/month** provider cost. 15-min all-day is ~€96/month; 5-min all-day is ~€338/month; 30-min is ~€38/month. See research for full tables.

### 10A.4 Snapshot contract

```json
{
  "corridorId": "jmu-sud",
  "asOf": "2026-10-19T06:10:00+07:00",
  "expiresAt": "2026-10-19T06:25:00+07:00",
  "confidence": "medium",
  "sources": [
    { "provider": "tomtom", "dataset": "traffic-flow", "asOf": "..." },
    { "provider": "bmkg", "dataset": "nowcast", "asOf": "..." }
  ],
  "traffic": { "delayMinutes": 9, "severity": "moderate", "incidents": 2 },
  "weather": { "condition": "rain", "precipMm": 1.2, "alert": null },
  "crowding": { "label": "estimasi", "level": "high", "confidence": "low" },
  "disruptions": [{ "type": "flood", "label": "estimasi", "severity": "medium" }],
  "attribution": ["Traffic © TomTom", "Cuaca © BMKG"]
}
```

- `asOf`/`expiresAt` are mandatory; clients show `Stale` if `now > expiresAt`.
- No provider price or raw payload in the response.
- Cache-Control: `private, max-age=60` for a subscriber; server still checks entitlement.
- ETag/checksum for idempotent planner calls.

### 10A.5 Entitlement and UX rules

- `GET /live/*` requires active `live`; otherwise `403` with a product hint, not a generic error.
- Free/All Maps users see authored/scheduled conditions, not a fake live layer.
- `Live` only for provider-fed traffic/weather/incidents; `Estimasi` for crowding/delay; `Stale` when expired; no colour-only status.
- Planner is a planning aid with a visible disclaimer; no turn-by-turn, no safety-critical routing.
- Attribution visible in the briefing, game data page, and legal page.

### 10A.6 Cost controls and failure

- Monthly provider budget + daily soft cap; alert at 80/100%; hard stop at 100% except a small reserve.
- If TomTom fails/429s: exponential backoff, serve last snapshot with `Stale`, alert; never call per user as a fallback.
- If BMKG fails: keep last forecast; degrade weather label; traffic can still work.
- Kill switch `FEATURE_LIVE_DATA=false`: all live endpoints return `503` with `Retry-After`; maps/All Maps unaffected.
- If the snapshot worker misses a window: newest snapshot age is surfaced; no silent stale-as-live.
- Cost telemetry per corridor/provider; review weekly during beta.

### 10A.7 City scale

- All Maps Phase 3 cities add corridors; provider cost scales roughly linearly with active corridors × points.
- Enable a city's live layer only after traffic/weather coverage and licence checks pass; otherwise the city ships with authored conditions.
- Per-city budget row; no silent cross-subsidy. Pause a city's live layer independently.

### 10A.8 Privacy and licensing

- No GPS; the planner uses corridor/origin/destination chosen from a catalogue.
- IP hash for rate limiting; no raw IP in provider calls.
- Opt-in rider reports are pseudonymous, rate-limited, moderated; never precise location.
- `data_sources` row required before enabling a provider; licence/attribution reviewed.
- PetaBencana only after a commercial CC BY agreement; no non-commercial production use.

---

## 11. Security architecture

### 11.1 Threat model (STRIDE, abbreviated)

| Threat                     | Example                               | Control                                                             |
| -------------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| **Spoofing**               | Forged session; fake Mayar webhook    | HttpOnly signed sessions; API re-fetch; merchant/amount checks; TLS |
| **Tampering**              | Change price; edit order; modify save | Server price; DB constraints; checksums; authz                      |
| **Repudiation**            | “I didn’t buy it”                     | Audit log; payment events; receipts; provider refs                  |
| **Information disclosure** | IDOR; leaked logs; paid assets        | Ownership checks; redaction; signed URLs; CSP                       |
| **Denial of service**      | OTP flood; checkout spam              | Cloudflare WAF/rate limit; app limits; queues                       |
| **Elevation of privilege** | User hits admin API                   | Role checks; Cloudflare Access; separate audience                   |
| **Cheating**               | Fake leaderboard score                | Run token/seed; deterministic replay; plausibility                  |
| **Supply chain**           | Malicious dependency/action           | Lockfile; audit; pinned actions; no postinstall                     |
| **Account takeover**       | OTP brute force; OAuth state          | Rate limits; PKCE/state/nonce; device alerts                        |
| **Refund fraud**           | Pay, download, refund, keep content   | Revoke; usage evidence; policy; repeat flag                         |
| **Scraping**               | Paid content/leaderboard              | Signed URLs; rate limits; watermark; accept residual risk           |

### 11.2 Controls checklist

- **AuthN:** Google OIDC + email OTP; no passwords; session rotation; revoke.
- **AuthZ:** route-level checks; ownership queries include `user_id`; admin role; tests for every object.
- **Input:** Zod validation; size limits; no user HTML; React escaping; filename allowlist; no SSRF.
- **Output:** CSP; JSON content type; no stack traces; safe headers.
- **Crypto:** TLS; Argon2id only if passwords ever added (not v1); secrets 256-bit; no custom crypto. Mayar webhooks are not trusted as authentic; verification is an API call to Mayar. If a signature is added, use timing-safe compare.
- **Secrets:** env on VPS 600; GitHub Environments; no secrets in client; rotate; gitleaks.
- **Rate limits:** Cloudflare + app; OTP 5/hour/email, 20/hour/IP; checkout 10/hour/user; webhook 60/min/IP; support 5/hour/IP; waitlist 8/hour/IP with a honeypot and generic responses; live planner 30/hour/user; live reports 10/hour/user.
- **Bot/spam:** Cloudflare Turnstile on contact/signup if abuse; not on core gameplay.
- **Admin:** Cloudflare Access (Google SSO, 2FA), IP allowlist/Tailscale, audit, no public route.
- **Supply chain:** pnpm lockfile, `pnpm audit`, Dependabot, pinned GitHub Actions by SHA, `--ignore-scripts` where possible, SBOM optional.
- **Backups:** encrypted; R2 private; restore tested; no PII in test fixtures.
- **Monitoring:** auth failures, OTP spikes, payment/subscription mismatches, live-provider errors/spend/freshness, 5xx, WAF blocks, disk, backup age.

### 11.3 Payment-specific invariants

1. Amount is read from `products`, never from the request.
2. `orderRef` is unique and server-generated.
3. Mayar webhook payload is never sufficient to grant; the server re-fetches transaction/member state and verifies merchant/product/amount/customer.
4. Return/redirect params are never used to grant.
5. `PAID`/subscription + entitlement + audit happen in one DB transaction.
6. Duplicate callback is a no-op with 200.
7. Refund/revoke/cancel is audited and idempotent.
8. Reconciliation runs daily and alerts on any mismatch.
9. Paid content is never in the free bundle.
10. Admin actions require role + Access + audit.
11. Live data requires an active `live` entitlement and a licensed source; provider keys never reach the client.
12. A provider budget overrun degrades to stale/free data; it never silently overspends.

### 11.4 Security headers (target)

- HSTS `max-age=31536000; includeSubDomains; preload` after verifying all subdomains HTTPS.
- CSP: default-src self; script-src self; style-src self + 'unsafe-inline' (Astro inlines CSS and uses data-driven CSS custom properties; scripts stay strict); img/media/font self + data/blob where needed; connect-src self; frame-ancestors none; form-action self; object-src none.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` minimal, COOP/CORP same-origin.
- No `X-XSS-Protection` (deprecated); no wildcard CORS; no `Access-Control-Allow-Origin: *` on authenticated endpoints.

### 11.5 Incident response

- Detect (Sentry/uptime/alerts) → triage (P0/P1) → contain (revoke sessions, disable checkout, Cloudflare block) → eradicate → recover → notify.
- PDP breach: assess; notify DPA/data subjects within 72 h if required; document.
- Payment incident: freeze checkout, reconcile, contact Mayar, preserve logs, notify affected users. Live-provider incident: freeze provider fetch, serve stale, alert, contact provider.
- Postmortem within 5 days; action items tracked.

---

## 12. Privacy architecture

### 12.1 Data map

| Data               | Purpose                      | Lawful basis                 | Retention                      | Location              |
| ------------------ | ---------------------------- | ---------------------------- | ------------------------------ | --------------------- |
| Email              | Account, receipts, security  | Contract                     | Account + 30 d; orders 10 y    | VPS Postgres          |
| Name/avatar        | Display, leaderboard         | Contract                     | Account + 30 d                 | VPS + Google (avatar) |
| Session/IP hash/UA | Security, device list        | Legitimate interest          | 30 d                           | VPS                   |
| Orders/payments    | Fulfilment, tax, refunds     | Contract/legal               | 10 y                           | VPS + Mayar           |
| Subscription IDs   | Live access, renewal, cancel | Contract                     | Account + 30 d; tax 10 y       | VPS + Mayar           |
| Chosen route       | Free entitlement, UX         | Contract                     | Account + 30 d                 | VPS                   |
| Live planner input | Briefing/planning aid        | Contract/legitimate interest | 30 d (aggregated)              | VPS                   |
| Live rider report  | Crowd/delay estimate         | Consent                      | 90 d, pseudonymous             | VPS                   |
| Saves/runs         | Game progress, leaderboard   | Contract                     | 24 months                      | VPS + client          |
| Telemetry          | Product improvement          | Consent/legitimate interest  | 14 months                      | Self-hosted/anonymous |
| Waitlist email     | Release updates              | Consent                      | Until unsubscribe / 24 mo idle | VPS Postgres          |
| Support email      | Support                      | Contract/legitimate interest | 24 months                      | Gmail/Resend          |
| Backups            | Recovery                     | Legal/legitimate             | 30 d                           | R2 (private)          |

**Not collected:** NIK, phone, address, precise GPS/location, contacts, ad ID, biometrics, religion, health, sexual orientation, browsing history. Live planner uses a corridor/origin/destination selected from a list, not device location.

### 12.2 Data subject rights

- **Access/export:** JSON/CSV export job; email secure link; 14-day target.
- **Rectification:** display name/avatar/locale; email change requires re-auth.
- **Deletion:** soft-delete → revoke sessions → 30-day grace → hard-delete/anonymize; retain orders/tax as required; inform user.
- **Portability:** export saves/runs/orders.
- **Objection/restriction:** marketing opt-out; analytics opt-out; support request.
- **Automated decisions:** no high-impact automated decisions; leaderboard validation is explained.
- **DPO / RoPA:** assess the GR 33/2026 DPO triggers; appoint and publish a contact if required; maintain a record of processing activities and a retention schedule. The support/privacy contact is `wniseries@gmail.com` until a dedicated privacy address exists.

### 12.3 Consent and cookies

- Essential cookies only by default (session, CSRF).
- Analytics: cookieless/self-hosted where possible; if non-essential, consent banner with equal “reject” prominence.
- Marketing email: unchecked opt-in, double opt-in, unsubscribe in every email.
- No ad trackers, no social pixels, no session replay with PII.

### 12.4 Cross-border and vendors

| Vendor      | Data                                  | Safeguard                                                      |
| ----------- | ------------------------------------- | -------------------------------------------------------------- |
| Cloudflare  | TLS metadata, WAF logs, cached static | DPA/standard terms; no PII in cache                            |
| netcup      | Hosting, DB, backups                  | Contract; EU/Indonesia transfer assessment; confirm region     |
| Google      | OAuth identity                        | Google terms; minimal scopes                                   |
| Resend      | Email address, OTP/receipt            | DPA; retention minimized                                       |
| Mayar       | Payment/subscription data             | Merchant of Record; no tax processing; DPA/terms               |
| TomTom      | Corridor/point traffic queries        | Commercial API terms; derived data only; no raw redistribution |
| BMKG        | Kelurahan/area weather queries        | Public data; attribution; 60 req/min/IP                        |
| Open-Meteo  | Weather fallback (if licensed)        | CC BY; commercial key; attribution                             |
| PetaBencana | Flood reports/gauges (if licensed)    | CC BY commercial agreement; attribution                        |
| Sentry      | Error metadata (scrubbed)             | DPA; PII scrubbing; sampling                                   |
| R2          | Encrypted backups                     | Private bucket; lifecycle                                      |

GR 33/2026 requires a transfer mechanism (adequacy/safeguards/consent); document in the privacy notice and DPA records. If Indonesian data residency becomes mandatory, migrate VPS/DB to Jakarta; the stack is portable.

### 12.5 Breach response

- 72-hour notification to DPA and affected data subjects when required.
- Incident log, affected data categories, remediation, contact.
- Tabletop drill before launch; runbook in `docs/runbooks/incident.md`.

---

## 13. Performance architecture

### 13.1 Web platform

- Static Astro; zero client JS for content pages; React islands only where needed.
- Self-hosted fonts (subset), `font-display: swap`, preload only critical.
- Images: AVIF/WebP, responsive `srcset`, width/height, lazy below fold.
- CSS: critical inline? Prefer external with HTTP/3 + early hints; keep <50 KB.
- JS: <150 KB gzip initial; code-split by route; no heavy hero 3D on mobile.
- Motion: transform/opacity only; `will-change` sparingly; pause offscreen; `prefers-reduced-motion`.
- Cloudflare cache: HTML 5 min + purge on deploy; assets immutable; Brotli/zstd.
- Measure: Lighthouse CI (mobile), CrUX/RUM if available, WebPageTest.

### 13.2 Game

- Fixed-step sim, interpolated render; frame budget 16.6 ms (60fps) / 33 ms (30fps floor).
- Draw calls ≤150 mobile / ≤300 desktop; triangles ≤300k / ≤800k; texture memory ≤64 MB / ≤256 MB.
- Instancing for cars/bikes/people/streetlights; LOD; object pooling; shared materials; texture atlas.
- No real-time shadows on mobile; baked lighting/AO; fog to hide culling; frustum culling; chunk streaming.
- Adaptive quality: DPR cap (2 mobile, 1.5 low-end), resolution scale 0.7–1.0, crowd/traffic density, post-processing off, 30fps mode.
- Avoid per-frame allocations/GC; reuse vectors; typed arrays for crowds.
- Audio: compressed, streamed, max concurrent voices; suspend when hidden.
- PWA: cache-first assets; versioned; update on next launch; no background render.
- Measure: in-game FPS/CPU/GPU probe, `renderer.info`, thermal/battery on real devices, Playwright trace.

### 13.3 API

- Postgres indexes; prepared statements; no N+1; pagination.
- p95 target ≤600 ms from Jakarta (Europe origin + edge); webhook ack ≤1 s; Mayar API verification may complete asynchronously within 5 s.
- Caching: public game/product catalog in memory/edge with short TTL; no cache for user/order data.
- Rate limits at Cloudflare + app; graceful 429/503 with Retry-After.
- Load test: 100 concurrent checkout/status (Phase 5), 1k leaderboard reads/min, 200 live briefing reads/min with cache; provider calls stay flat (not per user).

---

### 13.4 Scaling and load evidence

Scaling claims must be measured, not asserted:

- Load test the API/Postgres at **2× expected peak**; record p50/p95/p99, error rate, DB connections, slow queries.
- Run `EXPLAIN (ANALYZE, BUFFERS)` on the top queries; add indexes only with evidence; re-check after data growth.
- State the **10× assumption** and what breaks first (DB writes, provider quota, cache, tunnel, cost).
- Measure cache hit, snapshot freshness, provider calls/spend, and cost per 1k runs.
- Inject failures: provider 429/5xx, DB failover/restore, webhook replay, stale cache, tunnel loss.
- Keep the benchmark command, commit, device/network, and raw JSON in `artifacts/research/<phase>/<date>/`.

Do not add Redis/queues/Kubernetes until the measured bottleneck justifies the operational cost.

## 14. Deployment and operations

### 14.1 Environments

| Env        | Host                                              | DB              | Mayar        | Purpose     |
| ---------- | ------------------------------------------------- | --------------- | ------------ | ----------- |
| Local      | `localhost`                                       | Docker Postgres | sandbox/mock | Development |
| Staging    | `staging.wniseries.ahaqqu.com` (optional) or path | separate DB     | sandbox      | E2E/demo    |
| Production | `wniseries.ahaqqu.com`                            | production DB   | production   | Public      |

- Staging can use the same VPS with a separate DB/compose project to save cost; never share secrets/data.
- Production deploy requires GitHub Environment approval + green CI.
- No production data in local/staging; use synthetic fixtures.

### 14.2 CI/CD pipeline

```mermaid
flowchart LR
  PR[Pull request] --> CI[ci.yml\nlint · type · unit · integration · e2e · perf · security]
  CI --> Review[Review + green gates]
  Review --> Merge[Merge to main]
  Merge --> Build[Build static + API image]
  Build --> Migrate[Run expand migration]
  Migrate --> Deploy[Upload release · symlink · restart API]
  Deploy --> Smoke[Smoke: health · auth · checkout sandbox · game load]
  Smoke --> Purge[Cloudflare cache purge]
  Purge --> Report[Update status/evidence]
```

- **Build:** `pnpm install --frozen-lockfile`, `pnpm build` (platform + games), Docker build/push GHCR with SHA tag.
- **Deploy:** SSH via restricted deploy key/Tailscale; `rsync` release; `docker compose run --rm migrate`; `ln -sfn`; `docker compose up -d api`; health/smoke; rollback on failure.
- **Migrations:** expand/contract; backup before migrate; never drop columns in the same release; feature flags for behavior.
- **Rollback:** symlink previous release + previous image tag; migration rollback only if backward-compatible; otherwise forward-fix.
- **Cache:** purge Cloudflare HTML on deploy; assets immutable.
- **Secrets:** GitHub Environments `staging`/`production`; no secrets in logs; rotate.
- **Actions pinned by SHA**; least-privilege `GITHUB_TOKEN`; Dependabot; `actionlint`/`zizmor`.

### 14.3 VPS hardening

- Ubuntu 24.04/Debian 13, unattended-upgrades, minimal packages.
- SSH: key-only, no root login, non-default port optional, Tailscale/Cloudflare Access for admin; fail2ban.
- UFW: deny inbound; allow SSH from admin/Tailscale only; no public 80/443 with Tunnel.
- Docker: rootful but containers non-root/read-only where possible; no `--privileged`; resource limits.
- Postgres: private network only; strong password; `pg_hba` local; no superuser for app; least-privilege role.
- Secrets: `/srv/wni/.env` 600, owned by deploy user; not in git; rotate.
- Backups: nightly encrypted dump to R2; 30 daily/12 weekly; healthcheck ping; restore drill.
- Monitoring: Sentry, uptime, disk, memory, backup age, TLS expiry; alerts to email.
- Logs: journald + Pino stdout; retention 30 days; no PII; ship to Better Stack/Grafana optional.
- Time sync: chrony/NTP; UTC DB, WIB display.
- Rebuild runbook: provision new VPS, install Docker, restore DB/backups, DNS/Tunnel switch; target <2 h.

### 14.4 Backups/DR

- **RPO:** ≤6 h (nightly + 6-hourly dump); **RTO:** ≤2 h.
- Encrypt with `age`/GPG; upload to private R2 bucket; lifecycle 30 days.
- Verify: `pg_restore --list`, restore into a throwaway DB monthly; row counts/checksums.
- Payment/tax data retained per law.
- Offsite copy outside the VPS provider (R2).
- Documented restore runbook + quarterly drill.

### 14.5 Observability

| Signal             | Tool                              | Alert                                               |
| ------------------ | --------------------------------- | --------------------------------------------------- |
| API errors/latency | Sentry + Pino + uptime            | 5xx >1% 5 min; p95 >1 s 10 min                      |
| Payment            | Sentry + reconciliation           | Any paid-without-entitlement; mismatch; webhook 5xx |
| Auth               | Sentry + metrics                  | OTP failure spike; login 5xx                        |
| Availability       | Better Stack/UptimeRobot          | 2 failed checks                                     |
| Backup             | Healthchecks.io                   | Missed/failed backup                                |
| Disk/memory        | node_exporter/Netdata or provider | Disk >80%; memory >90%                              |
| TLS/domain         | Uptime/Cloudflare                 | Expiry <14 days                                     |
| Game client        | Sentry + telemetry                | Crash-free <99%; boot failure spike                 |

SLOs:

- API availability 99.9% monthly.
- p95 API latency ≤600 ms from Jakarta.
- Payment webhook success ≥99.5%; reconciliation zero unexplained.
- Static TTFB p95 ≤200 ms (edge), game boot ≤5 s.
- Crash-free sessions ≥99.5%.

---

## 15. Multi-game / series extension

### 15.1 Game manifest

`games/<slug>/game.manifest.json`:

```json
{
  "slug": "pejuang-nafkah",
  "title": "Pejuang Nafkah",
  "series": "WNI Series",
  "version": "0.1.0",
  "status": "design",
  "modes": ["krl", "motor", "multimodal"],
  "freeContent": ["bintaro-sudirman"],
  "products": ["pn-full-pass", "pn-cosmetic-*"],
  "rating": "13+",
  "entry": "/play/pejuang-nafkah/",
  "contentSchemaVersion": 1
}
```

- Platform catalog builds from manifests; API seeds `games`/`products` from them (or a CMS in Phase 6).
- Each game has its own Vite build and content pack; shared engine/UI/contracts.
- Entitlements are scoped by `game_id`; a series bundle is a future product, not v1.
- Auth/payments/analytics are shared; no game-specific forks.

### 15.2 Adding game #2 checklist

1. Copy `games/_template` and `docs/games/_template`.
2. Write specs/design/plan/architecture; get user approval.
3. Define modes, content schema, manifest, products.
4. Reuse gamekit/UI; add game-specific sim/render.
5. Add CI build/deploy path; add to platform catalog.
6. Add legal/rating/privacy review.
7. Run the same gate system.

### 15.3 Future series ideas (not commitments)

- `Pulang` (Lebaran/mudik), `Warung` (small business), `Kampung` (flood/community), `Hujan` (disaster resilience).
- Shared “WNI Passport” cosmetic layer; no cross-game power.

---

## 16. Testing and verification architecture

### 16.1 Test boundaries

- **Sim:** pure functions, deterministic; golden seeds; property tests for invariants (time monotonic, money non-negative, no impossible state).
- **API:** integration with real Postgres; Mayar mock + sandbox; auth flows; authz matrix; webhook fuzz/replay; one-time/subscription lifecycle; live snapshot contract/cost.
- **Game client:** Playwright with WebGL; input scripts; screenshots; FPS probe; offline mode; resize/orientation.
- **Platform:** Playwright for auth/account/checkout; axe; Lighthouse; link checker.
- **Content:** schema + station order/fare/door side/attribution assertions.
- **Security:** gitleaks, `pnpm audit`, ZAP baseline, custom authz tests; pen test Phase 5.
- **Ops:** deploy/rollback/restore drills; staging smoke.

### 16.2 Determinism protocol

- Seed from server run token; PRNG in sim only.
- Fixed timestep; no `Math.random`, `Date.now`, `performance.now` inside sim (inject clock).
- Input trace: `{t, action, value}`; replay in Node; compare final state hash/score.
- Content version pinned; RNG version pinned.
- Server validates: duration bounds, score bounds, token unused, content version, route/mode; top 100 replay.

### 16.3 Evidence and agent protocol

See `plan.md` §5 and `docs/verification/README.md`. Every phase produces a report with commit SHA, commands, screenshots/video, perf, security, payment, and a manual checklist. The agent must run `pnpm verify`, inspect artifacts, fix, and update `status.md`; no gate may be disabled to pass.

---

## 17. Environment variables

> Names indicative; never commit real values. Use `.env.example` with placeholders.

| Variable                                                                    | Scope         | Notes                                                |
| --------------------------------------------------------------------------- | ------------- | ---------------------------------------------------- |
| `NODE_ENV`                                                                  | API           | production/staging/development                       |
| `PORT`                                                                      | API           | 3000                                                 |
| `PUBLIC_SITE_URL`                                                           | platform/game | `https://wniseries.ahaqqu.com`                       |
| `DATABASE_URL`                                                              | API           | `postgres://wni:...@postgres:5432/wni`               |
| `BETTER_AUTH_SECRET`                                                        | API           | 32+ bytes                                            |
| `BETTER_AUTH_URL`                                                           | API           | site URL                                             |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`                                 | API           | OAuth                                                |
| `RESEND_API_KEY`                                                            | API           | email                                                |
| `EMAIL_FROM`                                                                | API           | `no-reply@ahaqqu.com` (verified)                     |
| `SUPPORT_EMAIL`                                                             | API/platform  | `wniseries@gmail.com`                                |
| `MAYAR_ENV`                                                                 | API           | `sandbox` / `production`                             |
| `MAYAR_API_KEY`                                                             | API           | server only; 50 req/min                              |
| `MAYAR_PRODUCT_ID_ALL_MAPS`                                                 | API           | Mayar invoice/payment product                        |
| `MAYAR_PRODUCT_ID_LIVE` / `MAYAR_TIER_ID_LIVE`                              | API           | Mayar SaaS membership + tier                         |
| `MAYAR_WEBHOOK_PATH_SECRET`                                                 | API           | unguessable path segment; additional control         |
| `MAYAR_RETURN_URL`                                                          | API           | `https://wniseries.ahaqqu.com/checkout/return`       |
| `TOMTOM_API_KEY`                                                            | API/worker    | server only; traffic                                 |
| `BMKG_BASE_URL`                                                             | API/worker    | public endpoints; attribution                        |
| `OPEN_METEO_API_KEY`                                                        | API/worker    | optional fallback; commercial licence                |
| `LIVE_PROVIDER_MONTHLY_BUDGET_IDR`                                          | API/worker    | hard budget; alert at 80/100%                        |
| `FEATURE_LIVE_DATA`                                                         | API           | kill switch                                          |
| `IP_HASH_SALT`                                                              | API           | hash waitlist/security IPs; required in production   |
| `PLAY_TOKEN_PRIVATE_KEY`                                                    | API           | Ed25519                                              |
| `PLAY_TOKEN_PUBLIC_KEY`                                                     | game/API      | verify                                               |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` | API           | backups/paid assets                                  |
| `R2_PUBLIC_BUCKET` / `PUBLIC_ASSET_ORIGIN`                                  | API/platform  | public assets; `https://assets.wniseries.ahaqqu.com` |
| `SENTRY_DSN` / `PUBLIC_SENTRY_DSN`                                          | API/platform  | scrubbed                                             |
| `CLOUDFLARE_TUNNEL_TOKEN`                                                   | infra         | cloudflared                                          |
| `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ZONE_ID`                               | CI            | cache purge/deploy                                   |
| `DEPLOY_ENABLED`                                                            | CI variable   | gate                                                 |
| `FEATURE_PAYMENTS` / `FEATURE_LEADERBOARD` / `FEATURE_LIVE_DATA`            | API           | kill switches                                        |

---

## 18. Risks and tradeoffs

| Risk                                      | Impact               | Mitigation                                                                          |
| ----------------------------------------- | -------------------- | ----------------------------------------------------------------------------------- |
| Single VPS failure                        | Downtime             | Backups, rebuild runbook, Cloudflare, fast restore                                  |
| Europe latency                            | Slower API           | Static edge cache; offline-first; SLO honest; future APAC migration                 |
| Mayar KYC delay                           | No revenue           | Apply Phase 0; sandbox; verify individual/PT Perorangan path                        |
| Mayar no public refund API                | Manual work          | Admin workflow, audit, policy, monthly review                                       |
| Mayar webhook has no documented signature | Forged callback risk | Never grant from payload; API re-fetch; merchant/product/amount checks; idempotency |
| Live provider cost overrun                | Margin loss          | Adaptive polling, cache, budget caps, kill switch, weekly review                    |
| Live data licence/terms                   | Feature blocked      | Written provider terms; source registry; fallback to modeled data                   |
| No true KRL/TransJakarta crowding         | Overpromise risk     | Label estimates; no “live occupancy”; operator partnership gate                     |
| City data/transit gaps                    | Phase 3 delay        | Per-city data/licence/recognition gate; do not promise dates                        |
| Content churn (Karet/Gapeka)              | Wrong content        | Versioned content, refresh drill, no hard-coded schedules                           |
| Paid asset leakage                        | Revenue loss         | Signed URLs, server gating; accept residual                                         |
| Cheating                                  | Leaderboard trust    | Deterministic replay, top-100 validation                                            |
| PDP breach                                | Fines/trust          | Minimization, encryption, 72h runbook, access control                               |
| Scope creep                               | Delay                | Phase gates, explicit out-of-scope, sub-gates 2A/2B/2C                              |
| Solo ops burnout                          | Reliability          | Automation, runbooks, managed services where cheap                                  |

---

## 19. Open items / Phase 0–2 decisions

1. Cloudflare Tunnel vs proxied origin (recommended: Tunnel).
2. Netcup OS/root access, region, snapshot/backup capability, existing ports/services.
3. Mayar KYC documents/payout account; individual vs PT Perorangan.
4. Mayar product/tier IDs + sandbox; confirm whether a webhook signature/IP allowlist exists.
5. TomTom commercial API terms for a game/derived data; confirm attribution and storage limits.
6. PetaBencana commercial licence (optional flood layer) — do not enable before signature.
7. Cloudflare zone access and `wniseries` DNS.
8. One-route free choice + 14-day courtesy change; confirm.
9. Whether All Maps includes every future Phase 3 city (recommended: yes for Pejuang Nafkah, not future games).
10. PPN/income tax handling with accountant; Mayar does not process sales tax.
11. PSE registration entity/data details; IGRS timing.
12. English launch requirement; native Indonesian copy reviewer.
13. Backup encryption key management (age key offline + escrow).
14. Sentry vs self-hosted GlitchTip; Better Stack vs UptimeRobot.

---

## 20. Appendix — operational commands (target)

```bash
# local
docker compose -f infra/compose/dev.yaml up -d postgres
pnpm install
pnpm db:migrate
pnpm dev

# verify
pnpm verify

# deploy (CI also does this)
pnpm build
rsync -az --delete apps/platform/dist/ deploy@host:/srv/wni/releases/$SHA/platform/
rsync -az --delete games/pejuang-nafkah/dist/ deploy@host:/srv/wni/releases/$SHA/play/pejuang-nafkah/
ssh deploy@host 'cd /srv/wni && ln -sfn releases/$SHA current && docker compose run --rm migrate && docker compose up -d api && curl -fsS https://wniseries.ahaqqu.com/api/readyz'

# rollback
ssh deploy@host 'cd /srv/wni && ln -sfn releases/$PREV current && docker compose up -d api'

# backup/restore
ssh deploy@host '/srv/wni/scripts/backup.sh'
# restore into throwaway DB, verify counts, then promote
```

---

## 20A. Cost envelope (launch + Live)

| Item                                   |                                  Monthly estimate | Notes                                                                |
| -------------------------------------- | ------------------------------------------------: | -------------------------------------------------------------------- |
| netcup VPS                             |                  already paid (~€6–12 equivalent) | 2 vCPU / 4 GB / 100+ GB; monitor headroom                            |
| Cloudflare DNS/WAF/cache/Tunnel/Access |                                                $0 | Free plan sufficient at launch                                       |
| Cloudflare R2                          |                                              $0–1 | 10 GB free; backups + paid packs                                     |
| Resend                                 |                                                $0 | Free tier for OTP/receipts; verify quota                             |
| Sentry/uptime/healthchecks             |                                                $0 | Free tiers; upgrade on real volume                                   |
| Mayar Starter                          |                                        Rp 0/month | Business Rp 349k at ~712 subs                                        |
| Mayar fees                             |          2.2% one-time; 4.7% Live (QRIS, Starter) | Absorbed; channel/plan dependent                                     |
| TomTom traffic                         |              ~€149/month at 10 corridors adaptive | 5-min during 9 peak hours / 30-min otherwise; ~€96 at 15-min all day |
| BMKG                                   |                                              Rp 0 | Attribution; cache; 60/min/IP                                        |
| Open-Meteo fallback                    |                                ~Rp 0.5–2 jt/month | Only if licensed/commercial                                          |
| PetaBencana                            |                                             quote | Optional; commercial licence required                                |
| **Marginal total**                     | **~Rp 2–4 jt/month at 10 corridors** + Mayar fees | Marketing excluded; scales with corridors/subs                       |

The VPS is the only stateful component. If traffic outgrows it, scale vertically first, then move Postgres to a managed instance and add a second API instance behind Caddy/Cloudflare. Do not add Kubernetes.

---

_End of architecture.md. The boring parts — transactions, API verification, cache, backups, retries — are what let the beautiful parts feel effortless._
