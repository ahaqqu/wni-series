# WNI Series

**Indonesian everyday-life games, built with care.**
First game: **Pejuang Nafkah** — a one-hand commute game set on the real roads, trains, and mornings of Jakarta.

> _“Oh — ini sama kayak perjalanan gue tiap pagi.”_

**Status:** Phase 0 + pre-alpha landing page implemented; research-first gate adopted; Phase 1 brief/benchmark is the next gate; game, checkout, and live data not started.
**WNI Series:** _Susahnya nyata, dramanya gratis._
**Pejuang Nafkah:** _Berangkat. Berjuang. Sampai. Gitu aja terus setiap hari._
**Host (target):** `https://wniseries.ahaqqu.com`
**Support / privacy:** `wniseries@gmail.com`

---

## Research first

No detailed plan or implementation starts without a current **research brief**, **ADR**, and evidence for latest tech, real data, security, performance, cost, robustness/scaling, and how WNI commuters feel physically and emotionally. Sources are dated, volatile facts expire, and a stale brief is a red gate.

- [Research-first protocol](docs/games/pejuang-nafkah/research/PROTOCOL.md)
- [ADR index](docs/adr/README.md) — start with [ADR-0001](docs/adr/0001-research-first.md)
- [Phase 1 research pre-flight plan](docs/games/pejuang-nafkah/research/2026-10-phase-1-research-plan.md) — draft; no Phase 1 code until the gate is green

## What we are building

Pejuang Nafkah is a 3D web game about getting to work in Greater Jakarta. You play the commute, not a race: motorcycle filtering, the KRL crush, real stations and roads, rain, angkot, ojol, odd-even, fares, fatigue, dignity, and the rare city drama that turns a morning into a story you retell.

- **Dual mode:** motorcycle + KRL, plus multimodal handoffs.
- **One hand, portrait, offline-tolerant:** designed to be played on the train you are actually riding.
- **Free route choice:** pick the one route you actually commute; the complete game on that route, no ads.
- **All Maps:** every Pejuang Nafkah map, including future Phase 3 cities — one-time, Rp 79,000.
- **Drama, but rarely:** real-basis, fictionalised floods/demos/accidents/queue fights; rare enough to be a story, fair enough to retell, met with “bercanda dulu, panik belakangan”.
- **Made to share:** a local “Cerita hari ini” report card and share image; no feed, no upload, no PII.
- **Daily drama, human-approved:** midnight WIB AI research/drafts, owner approval per card and pack, no auto-publish; anonymous, source-checked, with evergreen fallback. [ADR-0006](docs/adr/0006-daily-drama-pipeline.md).
- **Live:** Rp 49,000/month (Phase 2) for all maps + live traffic/weather/incidents, estimated crowding, and a real-trip planner; no fake live labels.
- **Real places, original branding:** real station/road names; no official logos or copied announcements.
- **Secure payments:** Mayar hosted checkout + SaaS membership; server-side entitlements; callbacks verified via Mayar API; reconciliation/refunds/cancellation.
- **Live data that is honest:** traffic and weather are real; crowding/transit delay are estimates unless an operator feed is signed.
- **Series-ready:** shared auth, payments, entitlements, live-data adapters, UI, content schemas, and Three.js runtime for future games.
- **Tone:** dry, warm, self-deprecating, never punching down. The joke is how the character survives the day, not a verdict on the people living it. Series slogan: _“Susahnya nyata, dramanya gratis.”_ Drama rules: [ADR-0005](docs/adr/0005-drama-system.md).

---

## Pre-alpha landing page (implemented)

The KYC/marketing landing page lives in [`apps/platform`](apps/platform). It includes:

- a motion-designed “one morning” narrative with a live Three.js motor scene on desktop and a poster on mobile;
- pre-alpha motor + KRL platform visuals (clearly labelled “bukan gameplay final”);
- a real OpenStreetMap-derived route map (Jurangmangu → Sudirman) with station tooltips;
- honest pricing, FAQ, legal/contact pages, and a working email waitlist;
- responsive/reduced-motion/accessibility passes and a generated OG image.

Run it locally:

```bash
# from repo root
pnpm --filter @wni/platform dev

# waitlist API (separate terminal; see services/api)
cd services/api
DATABASE_URL=postgres://wni:wni_dev_password@127.0.0.1:5433/wni pnpm dev
```

The landing page proxies `/api` to `127.0.0.1:3000`. It is **not deployed** yet: no Cloudflare/VPS credentials or production secrets were used.

## Documents (source of truth)

| Doc                                                                                           | What it answers                                                           |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [specs.md](docs/games/pejuang-nafkah/specs.md)                                                | Principles, objectives, requirements, security/privacy, release criteria  |
| [design.md](docs/games/pejuang-nafkah/design.md)                                              | Game feel, dual mode, systems, art, one-hand UX, web/motion, monetization |
| [plan.md](docs/games/pejuang-nafkah/plan.md)                                                  | Phases, gates, evidence, risks, launch checklist                          |
| [architecture.md](docs/games/pejuang-nafkah/architecture.md)                                  | Stack, data, API, payments, security, privacy, deploy, multi-game         |
| [status.md](docs/games/pejuang-nafkah/status.md)                                              | Current phase, decisions, next action                                     |
| [research refresh](docs/games/pejuang-nafkah/research/2026-10-refresh.md)                     | 2026 transport/market/payment evidence with sources                       |
| [live-data/Mayar research](docs/games/pejuang-nafkah/research/2026-10-live-data-and-mayar.md) | Mayar fees/subscriptions, live data providers, feasibility, cost model    |
| [verification](docs/verification/README.md)                                                   | How “done” is proven                                                      |
| [AGENTS.md](AGENTS.md)                                                                        | Working agreement for coding agents                                       |

---

## Repository map

```text
apps/platform/               Astro marketing/landing; account/checkout UX later (Phase 4)
games/pejuang-nafkah/        Vite + Three.js game (Phase 1)
services/api/                Fastify + PostgreSQL + Better Auth + Mayar + live data (Phase 2/5)
packages/                    gamekit, ui, contracts, content-schema, config
data/                        Sourced, versioned real-world content
docs/                        Specs, research, verification, runbooks
infra/                       Caddy, Docker Compose, cloudflared, systemd
scripts/                     Docs/link/scaffold checks, helpers
.github/workflows/           CI + guarded deploy
```

---

## Quick verification (Phase 0)

```bash
pnpm install --frozen-lockfile
pnpm verify:docs
```

This checks Markdown style, internal links, required documents/headings, manifests, the multi-game scaffold, and the landing/API builds. It does **not** claim the game works — it does not exist yet.

When implementation begins, `pnpm verify` will grow to include lint, typecheck, unit, contract, integration, E2E, performance, security, content, and build gates. See [plan.md](docs/games/pejuang-nafkah/plan.md) §5.

---

## Deployment (target)

- **Edge:** Cloudflare DNS, TLS, WAF, cache, Access, Tunnel.
- **Origin:** netcup VPS (2 vCPU / 4 GB / 100+ GB SSD), Docker Compose, Caddy, Fastify API, PostgreSQL 18, cloudflared.
- **Static:** Astro platform at `/`, Vite game at `/play/pejuang-nafkah/`, API at `/api/*`.
- **CI/CD:** GitHub Actions builds/tests; guarded deploy uploads an atomic release, migrates, restarts, smoke-tests, and can roll back.
- **Payments:** Mayar hosted checkout + SaaS membership; callbacks verified by server API re-fetch; idempotency, entitlements, reconciliation, manual refund/cancellation workflow.
- **Backups:** encrypted PostgreSQL dumps to private R2; restore drill quarterly.

See [architecture.md](docs/games/pejuang-nafkah/architecture.md) §14 and [deploy runbook](docs/runbooks/deploy.md).

---

## Decisions locked so far

| Decision     | Choice                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------- |
| Monetization | Free one route + All Maps Rp 79,000 once + Live Rp 49,000/month (Phase 2) + cosmetics; no ads   |
| Branding     | Real place names; original branding; no official logos/trade dress; voice/slogans in `brand.md` |
| Tone         | Dry, warm, self-deprecating; “Susahnya nyata, dramanya gratis.”; never punching down            |
| Drama        | Rare (~1 in 5 runs), real-basis + fictionalised, fair/shareable, never paid, no real victims    |
| Daily drama  | 00:00 WIB AI research/draft, owner approval, no auto-publish, anonymous, signed packs, fallback |
| Mayar entity | Personal merchant assumed; production only after KYC                                            |
| Host         | `wniseries.ahaqqu.com` on existing netcup VPS + Cloudflare                                      |
| Stack        | Astro + Vite/Three.js + Fastify + PostgreSQL + Better Auth + Mayar + TomTom/BMKG                |
| Controls     | One-hand, portrait-first, offline-tolerant                                                      |
| Content      | Versioned real-world packs with `effective_from`                                                |
| Auth         | Google OAuth + email OTP; guest trial                                                           |

Open questions and assumptions are listed in [specs.md](docs/games/pejuang-nafkah/specs.md) §17 and [plan.md](docs/games/pejuang-nafkah/plan.md) §11. Voice/slogan rules are in [brand.md](docs/games/pejuang-nafkah/brand.md).

---

## Contributing / security

- Read [AGENTS.md](AGENTS.md) before coding.
- Do not commit or push unless the user asks.
- Report vulnerabilities to `wniseries@gmail.com` per [SECURITY.md](SECURITY.md).
- No real user data, secrets, official logos, or copied announcements.

---

_The commute is the game. The web is the first act. The gate is the promise._
