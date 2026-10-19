# status.md — Pejuang Nafkah

**Last updated:** 2026-10-19
**Current phase:** Phase 0 — foundation + pre-alpha landing page
**Implementation:** landing page + waitlist API implemented; game/checkout/auth not started; v4 pricing/live-data design and v4.3 brand/drama + daily-pipeline design documented; landing reflects v4.2, not in-game

## 1. What exists now

- Deep research F1–F5 + [2026-10 refresh](research/2026-10-refresh.md) + [live-data/Mayar research](research/2026-10-live-data-and-mayar.md).
- [specs.md](specs.md) — principles, objectives, requirements, security/privacy, release criteria.
- [design.md](design.md) — dual mode, one-hand UX, systems, art, web/motion, monetization.
- [brand.md](brand.md) — series/game slogans, drama engine, Bang Nafkah, humour guardrails.
- [ADR-0005](../../adr/0005-drama-system.md) — drama is core, rare, real-basis, fictionalised, fair, shareable; source bank + sensitivity review gate content lock.
- [ADR-0006](../../adr/0006-daily-drama-pipeline.md) — daily AI research/draft, owner approval per card/pack, no auto-publish, anonymous, signed packs, fallback.
- [Daily drama research plan](research/2026-10-daily-drama-pipeline.md) — source/ToS, AI terms, legal/privacy, approval dry run, cost; **not run**.
- [Daily drama runbook](../../runbooks/daily-drama.md) — review checklist, publish, rollback/correction, failure, kill switches.
- [Drama research/source-bank plan](research/2026-10-drama-system.md) — draft; no approved cards yet.
- [ADR-0007](../../adr/0007-caching-and-edge-delivery.md) — Postgres-only caching; Cloudflare edge for static + immutable content JSON; Valkey deferred behind explicit tripwires.
- [Caching/edge research brief](research/2026-10-caching-edge-delivery.md) — Cloudflare cache behavior and R2 pricing verified 2026-10-19; load model is an estimate, not a benchmark.
- [ADR-0008](../../adr/0008-social-signal-ingestion.md) — **proposed only**: social signal ingestion via a scraping broker (treg candidate). Does not change ADR-0006 or the no-scraping rule; deep research + 5-day trial required before acceptance.
- [research/PROTOCOL.md](research/PROTOCOL.md) — mandatory research-first gate; [ADR index](../../adr/README.md) with ADR-0001.
- [Phase 1 research pre-flight plan](research/2026-10-phase-1-research-plan.md) — draft; no Phase 1 implementation until the gate is green.
- [plan.md](plan.md) — phases 0–8, gates, evidence, risks, launch checklist.
- [architecture.md](architecture.md) — VPS/Cloudflare topology, Fastify/Postgres, Better Auth, Mayar, live data, security, CI/CD, multi-game.
- Multi-game monorepo scaffold, docs/link/scaffold checks, CI + guarded deploy skeleton.
- Game manifest + series template.
- Runbooks: deploy, payments, live data, backup/restore, incident, privacy request.
- **Pre-alpha landing page** in `apps/platform`: motion-designed narrative, real OSM route map, pre-alpha Three.js motor/KRL visuals, pricing, legal/contact pages, FAQ, waitlist, and the v4.2 humour/sticker + drama theme (Bang Nafkah, ticker, slogans).
- **Waitlist API** in `services/api`: validated email signup, consent, honeypot, rate limit, hashed IP, Postgres migration, unit tests.
- **v4 pricing/live research:** Free one route; All Maps Rp 79k; Live Rp 49k/month; Mayar fees; TomTom/BMKG feasibility/cost; Phase 2 subs/live; Phase 3 cities.
- Share image/OG (slogan + “Gitu aja terus setiap hari.”), favicon, manifest, sitemap, robots.
- Responsive/accessible/reduced-motion behavior; verified on desktop + mobile Chromium.

## 2. Decisions locked

| Decision     | Choice                                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| Monetization | Free one route + All Maps Rp 79,000 once + Live Rp 49,000/month (Phase 2) + cosmetics; no ads                         |
| Branding     | Real place names; original branding; no official logos/trade dress; voice/slogans in `brand.md`                       |
| Voice        | “Susahnya nyata, dramanya gratis.” / “Berangkat. Berjuang. Sampai. Gitu aja terus setiap hari.”; Bang Nafkah narrator |
| Drama        | Core, rare (~1 in 5 runs), real-basis + fictionalised, fair, shareable; never paid; no real recent tragedy/victims    |
| Daily drama  | 00:00 WIB AI research/draft; owner approves every card + pack; no auto-publish; anonymous; signed; fallback; Phase 2D |
| Mayar        | Personal merchant; sandbox until KYC; invoice/payment request + SaaS membership                                       |
| Host         | `wniseries.ahaqqu.com`, netcup 2 vCPU/4 GB/100+ GB, Cloudflare edge                                                   |
| Caching      | Postgres only; Cloudflare edge for static + versioned content JSON; no Valkey until a measured tripwire (ADR-0007)     |
| Stack        | Astro + Vite/Three.js + Fastify + Postgres + Better Auth + Drizzle                                                    |
| Controls     | One-hand, portrait-first, offline-tolerant                                                                            |
| Content      | Versioned packs with `effective_from`                                                                                 |
| Auth         | Google OAuth + email OTP; guest trial                                                                                 |

## 3. Phase 0 gate

- [x] Research-first protocol + ADR-0001 adopted
- [ ] Phase 1 research brief/ADR, latest-stack benchmark, WNI ride-along plan, and cost/security/scaling baseline
- [x] Four core docs written
- [x] Research refresh with 2026 sources
- [x] Repo restructured for multi-game
- [x] Docs/link/scaffold validation
- [x] CI workflow skeleton
- [x] Guarded deploy workflow skeleton
- [x] Runbooks seeded
- [x] Pre-alpha landing page + waitlist (KYC/marketing asset)
- [ ] User approves Phase 0 scope and open assumptions
- [ ] Mayar sandbox account + KYC path confirmed
- [ ] Cloudflare/VPS access + staging route confirmed
- [ ] Three.js reference-device spike (60 fps target / 30 fps floor)
- [ ] Deterministic sim + replay spike
- [ ] Better Auth + Postgres spike
- [ ] Mayar sandbox callback/API verification spike
- [ ] TomTom commercial terms + live-data budget approved
- [ ] PetaBencana commercial licence decision (optional flood layer)
- [ ] Staging deploy + rollback proven

## 4. Next action

1. User confirms access/credentials and the open decisions in `specs.md` §17.
2. Write the Phase 1 research brief/ADR first: latest Three.js/Vite/Astro, reference-device benchmark, one-hand UX, corridor ride-along, source/data freshness, threat model, cost and scaling assumptions.
3. Run the Phase 0 spikes (Mayar one-time + subscription, Three.js, sim, auth, deploy).
4. Fill the remaining Phase 0 gate items with evidence.
5. Start Phase 1: free-route vertical slice — KRL first, then motor + multimodal + last mile on the chosen route.
6. Before Phase 2D, run the daily-drama research: source/ToS, AI provider, legal/privacy, 5-day approval dry run, cost; keep `AUTO_PUBLISH_DAILY_DRAMA=false`.
7. Phase 2 adds All Maps/accounts/Mayar + live data/Live subscription/planner; Phase 3 adds Bandung/Surabaya/Yogyakarta candidates.

## 5. Known issues / risks

- Mayar personal-merchant production approval is unconfirmed; public webhook docs show no signature, so API verification is mandatory.
- `ahaqqu.com` Cloudflare access and netcup OS/access are unconfirmed in this session.
- Existing services/ports on the netcup VPS are unknown; Caddy/Tunnel integration must be checked before deploy.
- IGRS is temporarily paused; monitor before launch.
- Green Line 12-car/Gapeka changes may alter content after 2026-11-01.
- No playable build, no checkout/auth, no live-data implementation, no live deployment.
- No public KRL/TransJakarta live crowding/position API; Phase 2 must label crowding as estimate unless a partnership is signed.
- Daily drama is design-only: no source/ToS, AI provider, legal/privacy review, approval UI, dry run, or cost model. No auto-publish path exists; nothing is scheduled.
- Social sourcing is **proposed, not decided** (ADR-0008): scraping brokers carry ToS/indemnity/copyright/PDP exposure that no vendor absorbs; Indonesian coverage, Threads search, reliability, and legal sign-off are unproven.
- Drama bank is not built: no source log, no approved cards, no sensitivity review, no frequency test. Content lock is blocked until those exist (ADR-0005).
- Share card is design-only; no upload/feed/UGC. The HTML mock on the landing page is labelled as a target, not a feature.
- TomTom/PetaBencana commercial terms and budgets still need written confirmation.
- Landing page is pre-alpha; the Three.js scenes are visual targets, not gameplay.
- Waitlist API is local/staging only; production deploy still needs Cloudflare/VPS access and secrets.
- Mobile performance and real-device testing still pending; the scene is desktop-live, mobile uses the poster.
- Free-route change policy (one courtesy change/14 days) and All Maps future-city wording need final confirmation.
- Research freshness: provider prices/terms, fares/schedules, framework versions, and UX evidence must be revalidated at each phase start; an expired brief is a red gate.

## 6. Evidence

| Date       | Phase | Evidence                                                                                                                                                                 |
| ---------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-10-18 | 0     | Docs + scaffold; run `pnpm verify:docs`                                                                                                                                  |
| 2026-10-18 | 0.5   | Landing page + waitlist; see `artifacts/verification/landing/2026-10-18/` and `artifacts/verification/phase-0/2026-10-18/report.md`                                      |
| 2026-10-19 | 0     | v4 Mayar/live-data research/docs; landing v4 copy + Lighthouse: `artifacts/verification/landing/2026-10-19/report.md`                                                    |
| 2026-10-19 | 0.5   | v4.1 brand/slogans + humour theme: `artifacts/verification/landing/2026-10-19/brand-report.md`                                                                           |
| 2026-10-19 | 0     | Research-first protocol + ADR-0001; `docs/games/pejuang-nafkah/research/PROTOCOL.md`, `docs/adr/`                                                                        |
| 2026-10-19 | 0.5   | v4.2 drama/slogan update + landing drama section: `artifacts/verification/landing/2026-10-19/drama-report.md`                                                            |
| 2026-10-19 | 0     | v4.3 daily drama pipeline: `docs/adr/0006-daily-drama-pipeline.md`, `docs/games/pejuang-nafkah/research/2026-10-daily-drama-pipeline.md`, `docs/runbooks/daily-drama.md` |
| 2026-10-19 | 0     | Caching/edge decision: `docs/adr/0007-caching-and-edge-delivery.md`, `docs/games/pejuang-nafkah/research/2026-10-caching-edge-delivery.md`; Cloudflare/R2 docs verified 2026-10-19; **no load test yet** |

## 7. Design/plan review — v2 → v3

The previous design/plan were strong on authenticity but under-specified as a shippable product. This pass changed:

- **Player context:** added one-hand portrait, offline-tolerant, 5–15 minute legs, playable on a moving train; this is now a MUST, not a nice-to-have.
- **Scope discipline:** free = one chosen route (complete, all modes); All Maps unlocks all Pejuang Nafkah maps once; Live adds data/planner; no ads, no pay-to-win.
- **Web as product:** landing narrative, motion design, route atlas, pricing, auth, account, checkout, SEO, Core Web Vitals, accessibility.
- **Payments:** Mayar hosted checkout + SaaS membership, API-verified callbacks, idempotency, server-side entitlements, reconciliation, manual refunds/cancellation, tax/PSE.
- **Security/privacy:** threat model, payment invariants, authz matrix, OTP abuse controls, PDP/GR 33/2026 data map, retention, breach runbook.
- **Deployment:** netcup VPS + Cloudflare Tunnel/edge, Caddy, Fastify/Postgres, atomic releases, backups, guarded GitHub Actions.
- **Series architecture:** game manifest, shared auth/payments/UI/contracts, `games/_template`, per-game content/versioning.
- **Verification:** phase gates, evidence contract, reference devices, agent self-verification protocol, no gate-skipping.
- **2026 facts:** KRL ridership/fares, Karet closure, Green Line 12-car target, Gapeka 1 Nov 2026, Jakarta congestion rank/speed, UMP/BBM, odd-even 25 roads, Mayar fees/subscription, TomTom/BMKG live data, PDP effective date, IGRS pause.

**Review conclusion:** the design is coherent and buildable, but Phase 0 must close Mayar personal KYC, Cloudflare/VPS access, netcup region/latency, and the Three.js reference-device spike before Phase 1. Phase 2 then adds All Maps/accounts/Mayar + live data/Live subscription; Phase 3 adds cities.

## 8. Brand and tone pass — v4.1 → v4.2

- Series line: **“Susahnya nyata, dramanya gratis.”**
- Long line: **“Jadi WNI itu susah. Untung di game bisa di-pause.”**
- Game line: **“Berangkat. Berjuang. Sampai. Gitu aja terus setiap hari.”**
- **Bang Nafkah** is the proposed narrator/brand face: tired, observant, dry, never punching down. He is not the player character; the in-game protagonist remains open.
- The landing page uses a “sodium dawn + warung sticker” layer: highlighter ticker, sambal “Gitu aja terus setiap hari.” sticker, recognition stamps, one Bang Nafkah card, a 3-card drama section with a share-card mock, and the “Tidak ada jebakan. Kecuali macet.” pricing heading.
- Drama is explained honestly as pre-alpha: real basis, fictional detail, rare, no real victims, not yet in the build.
- Drama voice: “Bercanda dulu, panik belakangan.”; the character meets the city with a shrug and a next move, not denial.
- Native Indonesian/punch-down and drama sensitivity review are still pending. Serious data/payment/legal copy stays straight; no forced laughter.
- Full system: [brand.md](brand.md).

## 8A. Drama direction — v4.2

- User direction (2026-10-19): drama is a **core characteristic and principle**; rare/irregular, but real or having really happened; the player should feel “wah, ada drama apalagi hari ini”; the character faces it with **bercanda dan santai**; the story is memorable and shared.
- [ADR-0005](../../adr/0005-drama-system.md) records the decision: rare (~1 in 5 runs), real-basis + fictionalised, fair, never paid, no real recent tragedy/victims/identity blame, share card local and PII-free.
- [Drama research/source-bank plan](research/2026-10-drama-system.md) lists the work still needed: source log (≥2 per family), location allow-list, sensitivity review, 10–15 cards, frequency/fairness test, share test.
- Design: [design.md](design.md) §5.11; requirements: `specs.md` DRAMA-01…10; Phase 1 tasks 1.6a–1.6c, 1.23–1.25.
- **Status:** direction and landing copy only. No source bank, no approved cards, no in-game drama, no share feature.

## 8B. Daily drama direction — v4.3

- User direction (2026-10-19): **daily drama**, researched by an agent every midnight Asia/Jakarta from a viral event today/yesterday/last few days; creatively written into gameplay; the owner can receive many candidates, choose, comment, request regeneration, and approve again; **no production publish without approval**.
- [ADR-0006](../../adr/0006-daily-drama-pipeline.md): candidate-only 00:00 job; source allowlist/no social scraping; anonymous; 3–10 candidates; per-card + pack approval; no auto-publish; signed immutable packs; evergreen fallback; audit/correction.
- [Architecture §10B](architecture.md) defines generator/publish/owner roles, state machine, DB tables, endpoints, pack format, security, alerts.
- [Plan Phase 2D](plan.md) adds research gate, review UI, pack pipeline, dry run, and exit gate.
- **Status:** design and docs only. No source/AI provider selected; no legal/privacy review; no approval UI; no dry run; no schedule; nothing can publish.

## 9. Research-first adoption

- [research/PROTOCOL.md](research/PROTOCOL.md) makes a current brief + ADR + evidence a hard gate for every detailed plan/implementation.
- [ADR-0001](../../adr/0001-research-first.md) records the decision; the ADR index also captures VPS/Mayar/live-data choices.
- Required lenses: latest tech, accurate real data, security/privacy, performance/load, cost caps, robustness/scaling, WNI emotional/physical experience, legal/licence.
- Phase 1 brief/benchmark/ride-along is the next research gate; see §4.
- A stale brief (provider price/terms, fares/schedules, framework versions, UX evidence) is a red gate, not a historical note.
