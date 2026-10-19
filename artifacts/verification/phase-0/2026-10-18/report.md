> **Historical evidence:** this report reflects the 2026-10-18 landing/Phase 0 baseline. Payment/pricing was superseded on 2026-10-19 by Mayar and the v4 offer. Keep as an audit record.

# Phase 0 + landing page verification report — 2026-10-18

**Scope:** design documents, multi-game scaffold, CI/deploy skeleton, docs/link/scaffold checks, pre-alpha landing page, and the email waitlist.
**Implementation:** landing page + waitlist API implemented; game, checkout, and accounts intentionally not started.
**HEAD:** `772660d` plus uncommitted working-tree changes (no commit/push was requested).

## Commands run

| Command | Result |
|---|---|
| `pnpm verify` | pass — docs lint, 64 internal links, scaffold integrity, Astro check (29 files, 0 errors/warnings/hints), 4 API tests, platform + API builds |
| `pnpm format:check` | pass |
| `pnpm audit --prod` | pass — no known vulnerabilities |
| `gitleaks detect --source . --config .gitleaks.toml --no-git` | pass — no leaks found |
| `actionlint` (Docker `rhysd/actionlint`) | pass — exit 0 |
| `caddy validate` (Docker `caddy:2-alpine`) | pass — valid configuration after cache-matcher fix |
| `docker compose -f infra/compose/compose.yaml config` | pass — valid with a dummy env file |
| `docker build services/api` + container `/api/readyz` | pass — image runs as UID 10001, DB-ready |
| `git diff --check` | pass |
| Lighthouse on production `astro preview` | 94–96 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 2.0 s, CLS 0, TBT 0 ms |

## Landing page verification

- **Routes built:** `/`, `/tentang`, `/kontak`, `/harga`, `/privasi`, `/syarat`, `/refund`, `/404`, `/preview`, `/sitemap.xml`.
- **Desktop 1440×1000:** live Three.js scene reached `data-ready="true"`; no console errors; scroll width equals client width (1440).
- **Mobile 390×844:** no horizontal overflow (`scrollWidth=390`, `bodyWidth=390`); poster/mobile mode; route map lazy-loads and station tooltip works.
- **Interaction checks:** mode tabs (Motor/KRL/Multimodal) switch panel + image + caption; map station buttons update the tooltip; FAQ `<details>` opens; mobile menu opens/closes and the CTA scrolls to `#daftar`.
- **Motion/accessibility:** reduced-motion preference disables the live canvas, title/reveal transitions, and poster drift; Lighthouse a11y 100 (contrast, labels, focus); brand link accessible name matches visible text.
- **Performance work:** 3D chunk is dynamically imported after first paint/interaction; the 150 KB OSM SVG is lazy-loaded when the map approaches the viewport; responsive WebP `srcset`; offscreen sections use `content-visibility`; CSS is inlined; hero poster is the LCP-friendly first paint.
- **Screenshots:** `artifacts/verification/landing/2026-10-18/` (gitignored): desktop hero, mobile hero, mobile route; `report.json`.

## Waitlist API verification

Local Postgres 18 + Fastify 5:

| Case | Result |
|---|---|
| `GET /api/healthz` | `200 {"ok":true}` |
| `GET /api/readyz` | `200 {"ok":true}` |
| Valid email + consent | `202 {"ok":true}`; one row stored with `source=landing-prealpha`, consent true, hashed IP |
| Duplicate email | `202 {"ok":true}`; no enumeration; row updated, not duplicated |
| Invalid email / consent false | `400` generic error |
| Honeypot filled | `202 {"ok":true}`; no row inserted |
| Browser form submit through Astro dev proxy | success status shown, button “Terdaftar”, row stored |
| Rate limit / no CORS / no-store / nosniff | configured; route-level 8/hour/IP; same-origin only |

The production `services/api` image was built and smoke-tested against the local DB. The Astro preview server has no `/api` proxy by design; production Caddy routes `/api/*` to `api:3000`.

## What is not verified (expected)

- No deployment: Cloudflare/VPS access, DNS, Tunnel, TLS, staging/rollback are unconfirmed.
- No real-device playtest or 60 fps measurement on target Android hardware; the landing page skips the live 3D scene on mobile.
- No Duitku sandbox/KYC, checkout, entitlement, auth, or production payment flow.
- No game build; the visuals are pre-alpha art targets, not gameplay.
- No native Indonesian copy review by a second human; no legal/tax sign-off.

## Next gate

Complete the remaining Phase 0 items in `docs/games/pejuang-nafkah/status.md` §3: user approval of open assumptions, Duitku sandbox/KYC, Cloudflare/VPS access, Three.js reference-device spike, deterministic sim spike, auth spike, Duitku callback spike, and a proven staging deploy + rollback. Then start Phase 1 (KRL vertical slice).
