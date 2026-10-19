# plan.md — Pejuang Nafkah delivery plan

**Phase-by-phase delivery with end-to-end verification**
**Version:** 4.3
**Date:** 2026-10-19
**Status:** Phase 0 + pre-alpha landing page implemented locally; game/checkout not started; Phase 0 gate pending access/spikes. v4 pricing: Free one route / All Maps Rp 79k / Live Rp 49k-month (Phase 2); daily drama Phase 2D; Phase 3 cities.
**Target host:** `https://wniseries.ahaqqu.com` (netcup VPS + Cloudflare edge)
**Companion docs:** [specs.md](specs.md) · [design.md](design.md) · [brand.md](brand.md) · [architecture.md](architecture.md) · [research protocol](research/PROTOCOL.md) · [ADR index](../../adr/README.md) · [live-data/Mayar research](research/2026-10-live-data-and-mayar.md)

> **Delivery rule:** no phase is “done” because code exists. A phase is done when the **quality gate is green**, the **evidence is stored**, and the **next phase can start without debt that blocks it**.

---

## 1. Delivery principles

1. **Fun is validated before scale.** The KRL vertical slice must prove the emotional/one-hand hypothesis before we build the full map, website, or payments.
2. **One vertical slice at a time.** Every phase ends with something a real commuter can play, not a pile of systems.
3. **Evidence over opinion.** Screenshots, videos, traces, test reports, payment logs, performance profiles. “Looks good” is not a gate.
4. **Security and privacy are built in, not bolted on.** Payment, auth, and data handling are designed before the UI is polished.
5. **Real-world content is versioned.** We do not hard-code a timetable that changes next month.
6. **Free is complete.** Monetization comes after the free experience is proven fun.
7. **No dark patterns, no growth hacks.** Retention is earned by the loop and the story.
8. **Ship on the existing VPS.** Use the netcup box and Cloudflare edge; do not add infrastructure until metrics demand it.
9. **The agent must be able to verify itself.** Every phase has runnable commands, fixtures, reference devices, and a written acceptance checklist.
10. **Stop at a red gate.** Fix, re-run, or ask. Do not proceed on “we’ll clean it up later.”

---

## 2. Current status (2026-10-19)

| Item                                                  | Status                                                                                       |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Deep research F1–F5 + 2026 refresh                    | Done                                                                                         |
| Research-first protocol + ADR-0001                    | Done (process); Phase 1 brief/benchmark next                                                 |
| `specs.md`, `design.md`, `plan.md`, `architecture.md` | Done (this pass)                                                                             |
| Repo restructured for multi-game                      | Done                                                                                         |
| CI/scaffold                                           | Active: docs/link/scaffold + landing/API builds/tests                                        |
| Game implementation                                   | **Not started by design**                                                                    |
| Mayar production KYC                                  | Not started — launch gate                                                                    |
| Domain/Cloudflare/VPS hardening                       | Needs access + Phase 0 runbook                                                               |
| Free/paid model                                       | Decided: free one route + All Maps Rp 79k + Live Rp 49k/month (Phase 2) + cosmetics, no ads  |
| Branding                                              | Decided: real place names, original branding, no official logos; voice/slogans in `brand.md` |
| Business entity                                       | Personal merchant assumed; verify with Mayar                                                 |
| Live-data research                                    | Done: TomTom + BMKG + modeled crowding; cost model in research                               |

**Next action:** finish Phase 0 evidence/access, then build the free-route vertical slice (Phase 1); do not sell Live before Phase 2 exists.

---

## 3. Phase overview

| Phase | Name                                | Goal                                                                                                                     | Duration (solo full-time) | Hard exit gate                                                                                         |
| ----- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------ |
| **0** | Foundation & truth                  | Lock decisions, data, stack, infra, test harness                                                                         | 2–3 weeks                 | Docs approved; spikes pass; staging URL; CI green                                                      |
| **1** | Free-route vertical slice           | One chosen route: KRL first, then motor + multimodal + last mile                                                         | 8–12 weeks                | Full free route; 60 fps; one-hand ≥90%; recognition ≥80%; offline                                      |
| **2** | Commute core + Live + subscriptions | 2A All Maps/accounts/Mayar; 2B live data + Live subscription + planner; 2C daily/meta/retention; 2D daily drama pipeline | 15–21 weeks               | All Maps + Live sandbox E2E; deterministic live snapshot; daily approval/fallback; cost caps; playtest |
| **3** | Other cities                        | Bandung, Surabaya, Yogyakarta (candidates); data/licence/copy per city                                                   | 8–12 weeks                | Per-city recognition; traffic/weather coverage; cost gate                                              |
| **4** | Platform web & account              | Game page, account, checkout UX, support, devlog; landing already exists                                                 | 3–4 weeks                 | Lighthouse; auth/account E2E; accessibility                                                            |
| **5** | Security & payment hardening        | Mayar reconciliation, refunds/cancellation, privacy, pen test, load                                                      | 4–6 weeks                 | 0 critical/high; reconciliation clean; KYC/tax approved                                                |
| **6** | Content & accessibility expansion   | Story, audio, cosmetics, localization, browser/device matrix                                                             | 4–6 weeks                 | Content lock; a11y gates; performance                                                                  |
| **7** | Polish & launch                     | Soft launch, launch checklist, incident readiness                                                                        | 3–4 weeks                 | Launch checklist; no P0/P1; live payments verified                                                     |
| **8** | Post-launch                         | Content cadence, metrics, next game                                                                                      | Ongoing                   | Stable, measured, sustainable                                                                          |

**Full-time estimate:** ~44–66 weeks to v1. **Part-time:** 1.5–2×. The gates are fixed; calendar time depends on availability. Live/subscription scope is deliberately in Phase 2; do not compress by skipping verification.

### 3.1 Research pre-flight (every phase)

Before writing a detailed phase plan or code, produce and link:

- **Brief:** decision, method, current sources, options, recommendation, unknowns.
- **ADR:** for stack/provider/architecture/security/cost choices; rejected alternatives recorded.
- **Data validation:** fares/station order/schedules/road rules with `effectiveFrom`, two independent confirmations for volatile facts, licence/attribution.
- **Latest-tech check:** official versions/changelogs, support/EOL, licence, security advisories, benchmark on reference devices.
- **Security/privacy:** updated threat model/data map; payment/entitlement invariants; abuse cases.
- **Performance/load/efficiency:** budgets, 2× peak test, low/mid/high device evidence, CPU/GPU/memory/bytes/egress/battery per player.
- **Cost:** provider price with date/FX, worst case, caps, unit economics at 100/1k/10k.
- **Robustness/scaling:** failure/degraded/rollback plan; DB indexes/query plans; what breaks at 10×.
- **WNI experience:** ride-along/diary/body-map/interview/accessibility evidence, or an explicit approved gap.
- **Tone:** native/punch-down review for player-facing copy.

A stale brief is a red gate. If research cannot verify a fact or licence, stop and ask; do not “fill it in later”. Full protocol: [research/PROTOCOL.md](research/PROTOCOL.md).

---

## 4. Phase details

### Phase 0 — Foundation & truth (2–3 weeks)

**Goal:** eliminate the unknowns that would force a rewrite later.

#### Tasks

| #    | Task                                                                                        | Output                                                                                  | Verification                                                         |
| ---- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 0.0a | Adopt research-first protocol + ADR-0001                                                    | Process gate, ADR index                                                                 | Docs review; every phase links a brief/ADR                           |
| 0.0b | Phase 1 research brief: latest Three.js/Vite/Astro, reference-device benchmark, one-hand UX | [Research plan](research/2026-10-phase-1-research-plan.md) + brief/source log/benchmark | Primary docs; measured FPS/memory/thermal on low/mid devices         |
| 0.0c | WNI lived-experience plan: ride-along/diary/body-map/interview + consent                    | Research plan + recruit list + ethics checklist                                         | Review by 3 native readers; no PII until consent                     |
| 0.0d | Data validation baseline: fares, station order, door side, schedule, OSM licence            | Validation sheet + source registry                                                      | Two sources for volatile facts; `effectiveFrom`/expiry               |
| 0.0e | Baseline threat model, cost envelope, load/scaling assumptions                              | Security note + cost sheet + what-breaks-at-10× note                                    | Review against protocol checklist                                    |
| 0.1  | Confirm product decisions and open questions                                                | Decision log in `status.md`                                                             | User sign-off                                                        |
| 0.2  | Confirm Mayar personal-merchant KYC and production requirements                             | KYC checklist, sandbox account, go/no-go                                                | Written confirmation from Mayar; sandbox invoice/membership succeeds |
| 0.3  | Confirm domain/DNS/Cloudflare access and VPS details                                        | Access matrix, staging DNS plan                                                         | `dig`, Cloudflare dashboard, SSH smoke test                          |
| 0.4  | Harden VPS baseline                                                                         | SSH keys, UFW, unattended upgrades, Docker, Cloudflare Tunnel/proxy, backup target      | `lynis`/manual checklist; reboot test                                |
| 0.5  | Content source/licence audit                                                                | Source registry: OSM, stations, fares, rules, flood points; ODbL attribution            | Legal/attribution checklist                                          |
| 0.6  | Stack spike: Three.js on reference devices                                                  | A 60-second low-poly corridor demo (not the game)                                       | FPS/thermal/memory profile on low/mid/high devices                   |
| 0.7  | Stack spike: deterministic sim + input replay                                               | Headless Node replay of a 30-second scenario                                            | Same output hash across runs                                         |
| 0.8  | Stack spike: Better Auth + Postgres + Drizzle                                               | Google + email OTP login on staging                                                     | E2E auth test; session cookie inspection                             |
| 0.9  | Stack spike: Mayar sandbox                                                                  | Create invoice + SaaS member, callback tunnel, API re-fetch verify, status query        | Sandbox E2E log; duplicate callback test                             |
| 0.10 | Stack spike: CI/CD                                                                          | GitHub Actions lint/test/build; release layout; rollback                                | CI green; staging deploy + rollback                                  |
| 0.11 | Design system seed                                                                          | Tokens, type scale, HUD primitives, motion rules                                        | Visual QA at 320/390/768/1440 px                                     |
| 0.12 | Content schema seed                                                                         | Zod schemas for station/route/rules/scenario                                            | Schema validation + sample data                                      |
| 0.13 | Verification harness                                                                        | `pnpm verify`, Playwright config, evidence folders, reference devices                   | Harness runs on empty app and produces report                        |

#### Exit gate

- [ ] Research-first gate green: Phase 1 brief, ADR(s), source log, benchmark, threat model, cost sheet, and WNI research plan current.
- [ ] All Phase 0 decisions recorded; no unresolved blocker for Phase 1.
- [ ] Mayar sandbox one-time + subscription + callback/API verification verified.
- [ ] Auth (Google + OTP) verified on staging.
- [ ] VPS reachable via Cloudflare, hardened, backups configured.
- [ ] CI runs docs + code checks; staging deploy and rollback proven.
- [ ] Three.js spike meets 60 fps target on reference mid-range device and ≥30 fps floor on low-end.
- [ ] Content schema + source registry approved.
- [ ] Evidence stored under `artifacts/verification/phase-0/`.

**Do not:** build the real game or payment UI in Phase 0. The pre-alpha landing page is the one approved exception (Phase 0.5). Spikes are disposable.

---

### Phase 0.5 — Pre-alpha landing page (KYC & early marketing) — implemented locally

**Goal:** a public, honest shopfront that can support Mayar KYC review and early audience capture before the game exists.

| #     | Task                      | Output                                                                                 | Status       |
| ----- | ------------------------- | -------------------------------------------------------------------------------------- | ------------ |
| 0.5.1 | Motion landing page       | Astro page, responsive, reduced-motion                                                 | Done         |
| 0.5.2 | Pre-alpha in-game visuals | Three.js motor scene + KRL platform scene; labelled as visual target                   | Done         |
| 0.5.3 | Real route map            | OSM-derived SVG, real station order, tooltips, attribution                             | Done         |
| 0.5.4 | Product/pricing clarity   | Free one route + All Maps Rp 79k + Live Rp 49k/month (Phase 2); “belum bisa dimainkan” | Done         |
| 0.5.5 | Trust/legal               | Privacy, terms, refund, contact, FAQ, pre-alpha honesty                                | Draft done   |
| 0.5.6 | Waitlist                  | Fastify + Postgres, validation, honeypot, rate limit, hashed IP, unit tests            | Done locally |
| 0.5.7 | Share assets              | OG image, favicon, manifest, sitemap, robots                                           | Done         |
| 0.5.8 | Verification              | desktop/mobile screenshots, no console errors, form E2E, build                         | Done locally |

**Exit gate:** page builds; desktop/mobile screenshots; waitlist stores an email with consent and rejects invalid/honeypot; no console errors; copy clearly says pre-alpha. **Deployment and production KYC remain blocked on credentials/access. The landing page now uses Mayar + the 79k/49k offer.**

### Phase 1 — Free-route vertical slice (9–13 weeks)

**Goal:** prove the core fantasy and one-hand hypothesis on one real route, then make that route a complete motor + KRL + multimodal commute. Live data is not in this phase. Drama and sharing are in scope from the first slice.

#### 1A — KRL slice (4–6 weeks)

- Route: **Jurangmangu (or Pondok Ranji) → Tanah Abang → Sudirman/BNI City** (station order + door side + transfer).
- One train interior + one platform + one transfer + one alight.
- Mechanics: queue, board, brace, move, seat/offer, door timer, crowd density, stumble, alight, late arrival.
- Systems: clock, body/mind/dignity, simple cost/fare, report card, pause/resume, offline run, tutorial.
- One-hand portrait; desktop keyboard equivalent; reduced-motion option.
- Placeholder art allowed, but silhouette/scale/colour must be credible enough for recognition testing.

| #    | Task                                                                                                                        | Output                                       |
| ---- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1.0  | Phase 1 research pre-flight: latest stack benchmark, corridor ride-along, source/data validation, security/perf/cost budget | Brief + ADR + evidence                       |
| 1.1  | Content pack v0: station master, platform sides, headway ranges, fare, crowding profile                                     | `data/normalized/*.json` + validation report |
| 1.2  | KRL scene: train exterior/interior, platform, original signage, crowd placeholders                                          | Three.js scene + asset budget                |
| 1.3  | Boarding/alighting state machine                                                                                            | Deterministic sim module                     |
| 1.4  | Crowd density + brace + stumble model                                                                                       | Sim + tuning sheet                           |
| 1.5  | One-hand input + HUD + pause/resume                                                                                         | Playable build                               |
| 1.6  | Clock/fatigue/dignity/fare + report card                                                                                    | Score module                                 |
| 1.6a | Kejadian/drama v0: 6 cards across 3 families, real-basis source log, sensitivity pre-review, deterministic selector         | Drama bank seed + source log                 |
| 1.6b | One KRL drama + 2 responses + “Cerita hari ini” headline on the report card                                                 | Playable drama beat                          |
| 1.6c | Local share card v0: route/drama/grade + “Gitu aja terus setiap hari”; Web Share + copy/download                            | Share module + privacy test                  |
| 1.7  | Tutorial + first-run flow                                                                                                   | Onboarding                                   |
| 1.8  | Save/checkpoint + offline run                                                                                               | IndexedDB + sync stub                        |
| 1.9  | Tests: sim, scoring, station order, door side, one-hand input                                                               | Unit + E2E                                   |
| 1.10 | Playtest round 1 (6–8 commuters)                                                                                            | Findings + changes                           |
| 1.11 | Visual/performance evidence                                                                                                 | Screenshots, video, FPS profile              |

#### 1B — Motor + multimodal + free route + drama (5–7 weeks)

- Motor leg: home → Jurangmangu/Pondok Ranji, with real corridor cues, lights, angkot, ojol, busway, pedestrians, rain, razia (fictionalised).
- Handoff: parking, e-money/top-up, platform walk, board.
- KRL leg: reuse 1A, with state carried over.
- Last mile: Sudirman/BNI City → SCBD walk/ojek, heat/sidewalk/lobby.
- Multimodal planner: time/cost/crowding trade-off, one recommended route, no spreadsheet.
- Free route selection: one corridor, all modes; one courtesy change within 14 days (local stub; server enforcement in Phase 2).
- Report card combines legs; day save.

| #    | Task                                                                                               | Output                      |
| ---- | -------------------------------------------------------------------------------------------------- | --------------------------- |
| 1.12 | Motor corridor data + block design                                                                 | Route graph, hazard weights |
| 1.13 | Motor sim: auto-throttle, lateral filtering, braking, collision/near-miss                          | Deterministic sim           |
| 1.14 | Traffic light + queue + angkot + ojol + busway + pedestrian AI                                     | Agent system                |
| 1.15 | Rain/flood/razia scenarios                                                                         | Scenario system             |
| 1.16 | Camera, lean, hitstop, audio placeholders                                                          | Game feel pass              |
| 1.17 | Handoff micro-beats + multimodal planner                                                           | Flow                        |
| 1.18 | State carry-over + combined score                                                                  | Sim + UI                    |
| 1.19 | One-hand motor tuning + assists                                                                    | Input pass                  |
| 1.20 | Free route picker (one route, stubbed local)                                                       | Onboarding                  |
| 1.21 | E2E: motor → KRL → last mile; failure/recovery                                                     | Tests                       |
| 1.22 | Playtest round 2 (8–12 users)                                                                      | Findings                    |
| 1.23 | Drama bank v1: 10–15 cards, 3+ families, source IDs (≥2 each), kill list, sensitivity review       | Content pack + review       |
| 1.24 | Drama fairness/frequency test: rarity, 2+ counterplays, no unwinnable run, no repeat within 5 runs | Tuning sheet + test report  |
| 1.25 | Share card v1: 1:1/9:16, no PII, offline, text fallback, share comprehension test                  | Share module + findings     |

#### Exit gate — Phase 1

- [ ] One complete free route (motor + KRL + last mile) in 10–20 minutes.
- [ ] KRL run 5–8 minutes; handoff seamless; no lost state; no duplicate resources.
- [ ] 60 fps on reference mid-range; ≥30 fps floor on low-end; no long tasks >50 ms.
- [ ] One-hand completion ≥90% for KRL and ≥85% for motor; no instruction needed for first run.
- [ ] Recognition ≥80% for station/platform/interior/motor cues.
- [ ] Pause/resume exact state; offline run completes.
- [ ] Sim deterministic; replay hash matches.
- [ ] Playtest: ≥70% “fun/would play again”; ≥80% recognition; user sign-off.
- [ ] Drama: every card has real-basis + ≥2 sources + sensitivity review; rarity/fairness test passes; no real recent tragedy/victim; no unwinnable drama.
- [ ] Share: local card works offline, no precise location/PII, Web Share + fallback; ≥30% of testers would share.
- [ ] Evidence: desktop/mobile video, traces, FPS CSV, playtest notes, tone review (no punch-down).

**Phase 1 is the go/no-go for the whole game.** If the core is not fun/resonant — or if the drama feels forced, exploitative, or too frequent — fix the design before expanding. Do not add payments or live data here.

---

### Phase 2 — Commute core + Live + subscriptions + daily drama (15–21 weeks)

**Goal:** turn the free-route game into the actual product: All Maps, accounts, Mayar one-time checkout, live data, the Live subscription, and a planner that is useful for the real commute. This is the phase the user explicitly asked for; it is split into four gates so a failure in live data or daily content cannot block the maps/revenue work.

#### 2A — All Maps, accounts, and Mayar one-time (3–4 weeks)

- Add the Jabodetabek catalogue: BSD, Depok, Bekasi, Manggarai/Tanah Abang hubs; free route choice becomes meaningful.
- Auth: Google + email OTP, guest trial, account linking (minimum viable; account portal polish in Phase 4).
- Entitlements: `free_route`, `maps_all`, `live`; server-owned.
- Mayar one-time All Maps (Rp 79,000) via invoice/payment request; sandbox + production config.
- Callback is an untrusted trigger; re-fetch transaction detail; verify merchant/product/amount/customer/`extraData.orderId`; idempotent grant.
- Manual refund/revoke workflow; receipt email.
- Cost/reconciliation dashboard seed.

| #    | Task                                                                                         | Output                       |
| ---- | -------------------------------------------------------------------------------------------- | ---------------------------- |
| 2A.0 | Revalidate Mayar KYC/fees/terms/product IDs, security model, cost at 100/1k; update ADR-0003 | Brief/ADR + go/no-go         |
| 2.1  | Jabodetabek map catalogue + content validation                                               | 4+ corridors, route selector |
| 2.2  | Auth thin slice + account linking                                                            | Google/OTP session           |
| 2.3  | Entitlement service + `free_route` / `maps_all` / `live`                                     | Server API + tests           |
| 2.4  | Mayar invoice/payment request + return page                                                  | Sandbox checkout             |
| 2.5  | Mayar webhook receiver + API re-fetch verification                                           | Idempotent grant             |
| 2.6  | Order/entitlement reconciliation + admin refund/revoke                                       | Runbook + evidence           |
| 2.7  | All Maps gating in game/content manifests                                                    | Paid maps server-checked     |
| 2.7a | Cloudflare Cache Rules + headers for `/content/*` and HTML (ADR-0007); verify `cf-cache-status`, prove no rule matches `/api/*` | Edge config + evidence |

**Gate 2A:** All Maps sandbox purchase and duplicate callback produce exactly one entitlement; free route choice enforced; no client unlock; refund/revoke tested; reconciliation zero unexplained; `/content/*` edge-cached with the version in the path and `/api/*` verified uncached.

#### 2B — Live data + Live subscription + planner (5–7 weeks)

- Live provider adapters: TomTom traffic flow/incidents; BMKG forecast/nowcast.
- Snapshot worker: fetch, normalize, cache by corridor/time bucket, store derived metrics + source timestamps, never raw redistribution.
- Cost controls: adaptive polling (5 min peak / 30 min off-peak), provider budget, kill switch, stale fallback.
- Mayar SaaS membership tier (Rp 49,000/month), register/invoice/renewal/expiry/cancel; verify via member detail.
- Live entitlement: all maps + live while active; maps revert to free route when Live expires unless All Maps purchased.
- Briefing UI + real-trip planner; `Live`/`Estimasi`/`Stale`; source/attribution.
- Crowding/transit delay model + opt-in reports; no fake live occupancy.
- Cost dashboard: calls, spend, cache hit, freshness, errors.

| #    | Task                                                                                                                 | Output                      |
| ---- | -------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| 2B.0 | Revalidate TomTom/BMKG/PetaBencana terms, pricing, quotas, cost at 100/1k, labels/no-crowding claim; update ADR-0004 | Brief/ADR + budget approval |
| 2.8  | TomTom traffic/incident adapter + normalization                                                                      | `traffic_snapshot`          |
| 2.9  | BMKG forecast/nowcast adapter                                                                                        | `weather_snapshot`          |
| 2.10 | Snapshot worker + cache + budget caps + kill switch                                                                  | Live service                |
| 2.11 | Mayar SaaS membership + renewal/expiry/cancel                                                                        | Subscription state          |
| 2.12 | Live briefing + planner UI                                                                                           | Player-facing live feature  |
| 2.13 | Crowding estimation + opt-in reports                                                                                 | Estimate + confidence       |
| 2.14 | Labels, attribution, stale/offline behavior                                                                          | UX + tests                  |
| 2.15 | Cost dashboard + alerts                                                                                              | Admin                       |
| 2.16 | Live E2E: subscribe → snapshot → run → expire → cancel                                                               | Tests + evidence            |

**Gate 2B:** Live sandbox subscription active/expired/cancelled correctly; snapshot frozen for run; no mid-run network; cache hit ≥80%; provider budget enforced; stale state visible; attribution/licence registry approved; no “live crowded” claim without operator feed.

#### 2C — Meta, daily, retention (3–4 weeks)

**Goal:** turn a good run into a daily habit without dark patterns.

#### Scope

- Day/week structure, budget, body/mind/dignity persistence, report card history.
- Daily seed + weather/incident modifiers; daily challenge.
- Leaderboards (server stub) with categories; local first, server in Phase 5.
- Commute diary, recurring characters, small weekly chapter.
- Progression: familiarity, cosmetics, passport stamps.
- Share card v2 (weekly recap, 1:1/9:16), drama journal, local canvas.
- Save/sync design (local authoritative, server backup).

#### Tasks

| #    | Task                                                         | Output                  |
| ---- | ------------------------------------------------------------ | ----------------------- |
| 2C.1 | Day/week state machine + save schema                         | Sim/meta                |
| 2C.2 | Economy/budget tuning                                        | Tuning sheet + tests    |
| 2C.3 | Daily seed + scenario generation                             | Deterministic generator |
| 2C.4 | Report card, history, share card v2 (weekly recap)           | UI + export             |
| 2C.5 | Narrative beats + characters (v1 subset) + Bang Nafkah voice | Content pack            |
| 2C.6 | Progression/cosmetics (free set)                             | Unlocks                 |
| 2C.7 | Leaderboard UI + local stub                                  | UI                      |
| 2C.8 | Telemetry events (privacy-safe)                              | Event schema            |
| 2C.9 | Retention playtest (1 week, 10–15 users)                     | Cohort data             |

#### Exit gate

- [ ] Daily loop works for 7 simulated days; no dead end.
- [ ] Daily seed is identical across devices/builds; replay deterministic.
- [ ] Report card explains every grade; share card has no PII.
- [ ] No energy/lives/FOMO/dark patterns.
- [ ] Playtest D1 proxy ≥30% (or clear iteration plan).
- [ ] Save corruption/recovery test passes.
- [ ] Evidence: 7-day diary, cohort table, share-card samples.

---

---

### Phase 2D — Daily drama pipeline (4–6 weeks)

**Goal:** give the game an owner-approved drama pack every day without ever auto-publishing. The agent researches and drafts; the owner selects, comments, regenerates, approves; the game serves a signed pack with an evergreen fallback.

**Hard rule:** the generator has no production publish credential. A timer cannot publish. No names, faces, voices, usernames, precise locations, minors, victims, active legal cases, politics/religion/ethnicity, health misinformation, or recent tragedy.

#### Scope

- 00:00 Asia/Jakarta scheduled job: source fetch → dedupe → facts/citations → risk screen → candidate drafts (default 3–10; configurable). Lookback default 72 h, max 7 days.
- Source allowlist: licensed news/RSS + official notices; **no social scraping**, no posts/usernames/photos, no personal data in prompts.
- AI candidate schema: facts, ≥2 sources where possible, confidence, risk flags, anonymisation + fictionalised notes, gameplay choices, Bang lines, share headline.
- Admin review queue (mobile-first): source list, risk flags, preview, diff, comment, regenerate, approve/reject.
- Approval state machine + immutable revisions + append-only audit.
- Per-card approval + explicit final pack approval; publish only after both.
- Signed daily pack `daily-YYYY-MM-DD`, content hash, `publishedAt`, `expiresAt`; staging vs production buckets.
- Game: Daily Challenge features the approved headline drama (“Drama hari ini”); normal runs use the pack with usual rarity; run pins pack version.
- Fallback: last approved pack/evergreen; kill switch; correction/takedown creates a new version.
- Transparency: “fictionalised, AI-assisted, human-reviewed, not news”; no live-news claim.

#### Tasks

| #     | Task                                                                                                                         | Output                           |
| ----- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| 2D.0  | Research gate: source licences/ToS, AI provider terms/retention, PDP/defamation review, 5-day dry run, cost at 1/3/10 cities | Brief/ADRs + legal note + budget |
| 2D.0a | Social signal research (ADR-0008, **proposed**): Indonesian coverage on X/TikTok/Threads, Threads search, broker trial, written legal opinion, cost at 1/3/10 cities — accept or reject before any scraping code | Trial report + go/no-go     |
| 2D.1  | Source adapters + allowlist + no-scraping enforcement                                                                        | Source registry + adapters       |
| 2D.2  | 00:00 WIB scheduler + candidate cap + retries/backoff                                                                        | Daily job                        |
| 2D.3  | AI drafting + schema validation + anonymisation/PII/banned-topic checks                                                      | Candidate generator              |
| 2D.4  | Admin review UI: select/reject/comment/regenerate/preview/approve, mobile-first                                              | Review console                   |
| 2D.5  | Approval state machine + immutable revisions + audit log + owner 2FA                                                         | Approval service                 |
| 2D.6  | Signed pack build/publish to R2 staging→production; no generator publish credential                                          | Pack pipeline                    |
| 2D.7  | Game fetch/cache/pin/fallback + Daily Challenge integration + labels                                                         | Client integration               |
| 2D.8  | Kill switch, correction/takedown, rollback, no-auto-publish test                                                             | Runbook + tests                  |
| 2D.9  | 5-day dry run: owner approvals/comments/revisions, fact-check sample, anonymisation test, legal/sensitivity sign-off         | Dry-run report                   |
| 2D.10 | Cost dashboard/caps/alerts (sources, tokens, storage)                                                                        | Admin + alerts                   |

#### Exit gate

- [ ] 5-day dry run: ≥3 packs approved; ≤2 revisions/pack; owner review ≤20 min/pack.
- [ ] 0 names/PII/usernames/photos in approved cards (automated + human sample).
- [ ] Every factual claim has ≥2 sources or blocks publish; confidence + `fictionalised` note present.
- [ ] Generator/publish credential separation proven: generator cannot publish; CI cannot promote an unapproved pack; timer cannot bypass approval.
- [ ] Per-card + final pack approval recorded; revisions never inherit approval.
- [ ] Fallback works: no approval, job failure, model/source down → last approved/evergreen; run still completes.
- [ ] Pack is signed/versioned; old runs keep their pack; correction/takedown works.
- [ ] Legal/privacy/defamation/sensitivity review signed; no auto-publish flag in production.
- [ ] Cost within cap; kill switch tested.
- [ ] Owner accepts the workflow and the first pack.

**Phase 2D is owner-gated by design.** The agent may prepare as many candidates as the owner wants, but nothing enters production until the owner approves the cards and the final pack.

**Phase 2 overall exit gate:** 2A + 2B + 2C + 2D pass; All Maps and Live are honest, server-enforced products; daily drama has owner approval/no-auto-publish/fallback evidence; live cost is within budget; no P1; evidence stored.

---

### Phase 3 — Other cities (8–12 weeks)

**Goal:** prove the city pipeline without changing the core fantasy. Each city is a content/data release, not a code fork.

#### Candidates (validate, do not promise blindly)

1. **Bandung** — KRD/Trans Metro/Kobatama; strong commuter identity; check GTFS/traffic/weather.
2. **Surabaya** — Suroboyo Bus/Trans Semanggi/KRD; large market; check data.
3. **Yogyakarta** — Trans Jogja/KRL/YIA rail; strong tourism + student commute; check seasonality.

Do not start a city until its route/transit data, traffic/weather coverage, licence, local copy reviewer, and cost gate are approved.

#### Per-city tasks

| #   | Task                                                                                                       | Output                          |
| --- | ---------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 3.0 | City research-first: field rides, official data, licence/cost, local tone review, low-end device benchmark | City brief + ADR(s) + evidence  |
| 3.1 | City brief: routes, stations, transit modes, fares, local rules                                            | Approved city brief             |
| 3.2 | Data/licence registry: OSM, transit, traffic, weather, flood                                               | Signed/attributed sources       |
| 3.3 | Corridor content + platform/road geometry                                                                  | 2–4 validated corridors         |
| 3.4 | TomTom/BMKG coverage check + per-city cost estimate                                                        | Cost sheet                      |
| 3.5 | Native copy + sensitivity review                                                                           | Localized copy                  |
| 3.6 | Recognition/one-hand playtest in the city                                                                  | ≥80% recognition, ≥90% one-hand |
| 3.7 | All Maps entitlement covers new city; no new SKU                                                           | Entitlement test                |
| 3.8 | Live snapshot enabled only if coverage and budget pass                                                     | Cost/quality report             |

#### Exit gate — Phase 3

- [ ] At least two cities pass recognition, one-hand, and data-quality gates.
- [ ] Each city has a source/licence registry and local reviewer.
- [ ] All Maps unlocks the new city at no extra charge; Live works only where data is licensed.
- [ ] Per-city provider cost is within the live budget; no silent cross-subsidy.
- [ ] No official operator branding; local copy reviewed.
- [ ] Evidence: screenshots/video, playtest notes, cost sheet.

---

### Phase 4 — Platform web & account experience (3–4 weeks)

**Goal:** a beautiful, fast shopfront and a trustworthy account surface.

#### Scope

- Landing page is already implemented (Phase 0.5); this phase finishes the **game page, account, purchases, checkout return, support, devlog**.
- Auth UX: Google + email OTP, guest trial, account linking, account page, devices, export/delete.
- Subscription management UI: active plan, renewal date, cancel, payment issue, restore.
- PWA install/update; WebView handling.
- SEO, OG images, structured data, sitemap, i18n.
- Accessibility pass.

#### Tasks

| #   | Task                                    | Output            |
| --- | --------------------------------------- | ----------------- |
| 4.1 | Design tokens + UI primitives           | `packages/ui`     |
| 4.2 | Game page + route atlas + pricing page  | Static pages      |
| 4.3 | Motion system + performance budget      | Motion components |
| 4.4 | Auth pages + Better Auth integration    | E2E auth          |
| 4.5 | Account/purchases/devices/export/delete | Account UI        |
| 4.6 | Legal/FAQ/contact/support + Mayar copy  | Content           |
| 4.7 | PWA + WebView detection                 | Service worker    |
| 4.8 | SEO/structured data/OG                  | Audit             |
| 4.9 | Lighthouse/axe/keyboard/reduced-motion  | Reports           |

#### Exit gate

- [ ] Lighthouse mobile: performance ≥90, accessibility =100, best practices ≥95, SEO =100 on landing/game page.
- [ ] LCP ≤2.0 s, INP ≤200 ms, CLS ≤0.05 on throttled 4G.
- [ ] Auth E2E: Google (mocked in CI), email OTP (test inbox), link, logout, revoke.
- [ ] Account export/delete + subscription management (cancel/renewal display) tested.
- [ ] No layout overflow at 320 px; safe areas correct.
- [ ] Reduced-motion and keyboard/screen-reader passes.
- [ ] Evidence: Lighthouse JSON, axe report, screenshots, video.

---

### Phase 5 — Security, payments, and compliance hardening (4–6 weeks)

**Goal:** make Phase 2's Mayar and live-data implementation survive abuse, audits, tax review, and real money.

#### Scope

- Mayar reconciliation: one-time orders, subscriptions, renewals, expiries, cancels, refunds, chargebacks.
- Callback hardening: API re-fetch, merchant/product/amount/customer checks, replay tests, IP allowlist if Mayar provides one.
- Entitlement audit: `free_route` / `maps_all` / `live`; expiry/cancel edge cases; paid content gating.
- Refund/cancellation runbooks; receipts; tax/PSE review.
- Live-data cost/abuse controls: per-user limits, provider budgets, kill switch, stale behavior.
- Anti-cheat/leaderboard validation (server run token + replay).
- Security hardening, threat-model tests, pen test, dependency/secret scans.
- Backup/restore, incident, and payment/live-provider drills.

#### Tasks

| #   | Task                                                   | Output                  |
| --- | ------------------------------------------------------ | ----------------------- |
| 5.1 | Mayar reconciliation + subscription lifecycle tests    | Reports + tests         |
| 5.2 | Callback forgery/replay/IDOR/CSRF/OTP/rate-limit suite | Test suite              |
| 5.3 | Refund/cancel/expiry + entitlement audit               | Runbook + DB assertions |
| 5.4 | Live cost-abuse tests + kill switch + stale path       | Test report             |
| 5.5 | Run token + deterministic replay + leaderboard submit  | Anti-cheat              |
| 5.6 | ZAP/pen test/dependency/secret scans                   | Reports                 |
| 5.7 | Tax invoice/receipt + PSE/privacy review               | Compliance sign-off     |
| 5.8 | Backup/restore + incident/payment/live-provider drills | Evidence                |

#### Exit gate

- [ ] Sandbox E2E for All Maps (QRIS + e-wallet + VA) and Live (renewal/expiry/cancel): access correct.
- [ ] Forged/replayed callback: no double-grant, no unauthorized grant.
- [ ] Price tamper/IDOR/CSRF/OTP brute-force/rate-limit tests pass.
- [ ] Paid maps and Live inaccessible without entitlement; expiry/cancel behaves as specified.
- [ ] Refund: order refunded, entitlement revoked, audit + email; Mayar manual process documented.
- [ ] Daily reconciliation clean; alert fires on mismatch.
- [ ] Live provider budget enforced; stale/degraded path verified.
- [ ] 0 critical/high security findings; CSP enforced; secrets clean.
- [ ] PSE registration submitted; tax treatment confirmed; terms/privacy/refund/cancellation published.
- [ ] Evidence: sandbox logs, callback captures, DB assertions, test reports, reconciliation report.

**Launch payments only after Mayar KYC is approved and one real low-value transaction is verified. Do not enable Live until provider licences and cost caps are signed.**

---

### Phase 6 — Content depth, localization, accessibility (4–6 weeks)

**Goal:** make the maps feel authored and the product usable beyond the launch corridor. Map geometry/catalogue itself lands in Phase 2A/3; this phase adds depth.

#### Scope

- Hub set-pieces (Manggarai, Tanah Abang, Semanggi, Dukuh Atas) and `tim subuh`/weekend/pulang variants.
- Story: weekly chapter, characters, report-card lines, station posters.
- Audio: music layers, ambience, SFX, original PA/voice (no copied operator audio).
- Cosmetics: outfits, helmets, bike skins, train card designs; no gameplay effect.
- Localization: Indonesian primary, English secondary; all strings in catalogs.
- Accessibility: captions, colour-blind palettes, text scaling, left/right hand, reduced motion.
- Content refresh drill: station closure/Gapeka change without code deploy.

#### Tasks

| #   | Task                                        | Output           |
| --- | ------------------------------------------- | ---------------- |
| 6.1 | Hub set-pieces + timetable variants         | Scenes + content |
| 6.2 | Story/dialogue + native review              | Content pack     |
| 6.3 | Audio production + mix                      | Audio assets     |
| 6.4 | Cosmetics + store UI (no power)             | Store items      |
| 6.5 | i18n + accessibility pass                   | Strings + audit  |
| 6.6 | Content validation + authenticity checklist | QA sheets        |
| 6.7 | Refresh drill                               | Test report      |
| 6.8 | Performance across all maps/cities          | Profiles         |

#### Exit gate

- [ ] Hub set-pieces hit the intended stress without unfairness.
- [ ] Story/audio/copy reviewed by a native Indonesian reviewer; no copied operator audio.
- [ ] Humour passes the `brand.md` punch-down test; serious beats have no forced punchline.
- [ ] Cosmetics are server-granted, no gameplay effect.
- [ ] i18n and accessibility gates pass; captions/colour-blind/reduced-motion verified.
- [ ] Content refresh drill passes; old runs remain valid.
- [ ] Performance budgets hold on all maps and Phase 3 cities.
- [ ] Evidence: screenshots/videos, QA sheets, licence file, profiles.

---

### Phase 7 — Polish, accessibility, launch (3–4 weeks)

**Goal:** a launch we can stand behind.

#### Tasks

- Audio/haptics/VFX polish; camera comfort; fatigue vignette; arrival moment.
- Accessibility: screen reader menus, captions, colour-blind, reduced motion, text scaling, one-hand.
- Localisation: Indonesian + English; fonts; number/date formats; WIB.
- Browser/device matrix; iOS Safari memory/thermal; low-end Android.
- Load test API; Cloudflare WAF/rate limits; backup restore drill; rollback drill.
- Legal/PSE/IGRS; support templates; help center; status/changelog.
- Launch assets: trailer, screenshots, OG, press kit, devlog, social clips.
- Soft launch (limited cohort), fix, then public launch.

#### Exit gate (v1 Definition of Done)

- [ ] `specs.md` §16 all true.
- [ ] No P0/P1 bugs; crash-free ≥99.5% in soft launch.
- [ ] One-hand completion ≥90% in soft launch; recognition ≥80%.
- [ ] Payment success rate acceptable; reconciliation clean for 7 days.
- [ ] Restore drill from backup passes; rollback <5 min.
- [ ] Support inbox monitored; response templates tested.
- [ ] Launch checklist signed; evidence stored.

---

### Phase 8 — Post-launch (ongoing)

- Weekly content/challenge cadence; monthly content pack if sustainable.
- Review metrics, refunds, support themes, security advisories.
- Balance patches; performance regressions; browser changes.
- Start the next WNI Series game using the reusable platform.
- Do not add ads, loot boxes, or new paid tiers without a new explicit decision.

---

## 5. Verification system (the quality engine)

### 5.1 Test pyramid

| Tier            | Tool                                                    | What it proves                                          | When                 |
| --------------- | ------------------------------------------------------- | ------------------------------------------------------- | -------------------- |
| Docs/scaffold   | markdownlint, internal link check, scaffold check       | Repository integrity                                    | Every push           |
| Unit            | Vitest                                                  | Sim, scoring, economy, fare, seed, state machine        | Every push           |
| Contract        | Zod schemas + API tests                                 | Client/server agreement                                 | Every push           |
| Integration     | Testcontainers/Postgres + Mayar mock                    | Orders, webhooks, entitlements, migrations              | Every PR             |
| E2E             | Playwright (Chromium, WebKit, mobile emulation)         | Real flows: guest, auth, run, checkout, return, account | Every PR             |
| Payment sandbox | Mayar sandbox + tunnel                                  | Real provider behavior                                  | Phase 5 + nightly    |
| Visual          | Playwright screenshots + pixel diff                     | UI regressions at 390/1440                              | Every PR             |
| Performance     | Lighthouse CI + in-game FPS probe                       | Budgets                                                 | Every PR + phase     |
| Security        | gitleaks, dependency audit, ZAP baseline, authz tests   | No critical/high                                        | Every PR + phase     |
| Accessibility   | axe-core + manual keyboard/screen reader                | WCAG AA                                                 | Every PR + phase     |
| Content         | Schema + station order + fare + door side + attribution | Real-world accuracy                                     | Every content change |
| Device lab      | Real low/mid/high phones + desktop                      | Thermal/FPS/input                                       | Phase gates          |

### 5.2 Commands (target contract)

```bash
pnpm install --frozen-lockfile
pnpm verify:docs        # markdown + links + scaffold
pnpm lint
pnpm typecheck
pnpm test               # unit + contract
pnpm test:integration   # Postgres + Mayar mock
pnpm test:e2e           # Playwright
pnpm test:perf          # Lighthouse + game FPS probe
pnpm test:security      # audit, gitleaks, ZAP/authz
pnpm verify:content     # data schemas + authenticity checks
pnpm build
pnpm verify             # orchestrates all required gates
```

Today `pnpm verify` runs docs/scaffold + the landing build/API tests. Phase 1 adds game lint/type/test/build/E2E; Phase 2 adds Mayar sandbox + live-data contract tests; Phase 4 adds account/E2E/perf; Phase 5 adds security/payment hardening; Phase 6 adds content/accessibility.

### 5.3 Evidence contract

Every phase stores:

```text
artifacts/verification/<phase>/<YYYY-MM-DD>/
  report.md              # what ran, results, known issues
  screenshots/           # desktop + mobile + key states
  video/                 # 30–90 s gameplay or flow
  traces/                # Playwright trace.zip
  performance/           # Lighthouse JSON, FPS CSV, renderer.info
  security/              # audit/ZAP/authz reports (redacted)
  payment/               # sandbox order IDs, webhook captures (redacted)
  db/                    # assertions/queries (no PII)
  checklist.md           # manual sign-off
```

- Evidence must be from the **current commit**; include `git rev-parse HEAD`.
- No secrets, tokens, emails, or full IPs in artifacts; redact.
- `artifacts/` is gitignored except the `report.md` + `checklist.md` summaries; large files stay in CI artifacts.
- A phase is not done until `report.md` links every gate.

### 5.4 Agent self-verification protocol

When implementing a phase:

1. **Read** `specs.md`, `design.md`, this plan, and the relevant architecture section.
2. **Restate** the smallest vertical slice and its acceptance criteria in the PR/issue.
3. **Write/adjust tests first** for the new behavior (unit + E2E where possible).
4. **Implement** the slice; do not expand scope silently.
5. **Run `pnpm verify`** (or the phase subset) and capture evidence.
6. **Inspect** screenshots/video/perf; do not trust a green test if the game looks/feels wrong.
7. **Fix** and re-run until the gate is green; if blocked by a product decision, stop and ask.
8. **Update** `status.md` with what changed, evidence links, known issues, next step.
9. **Self-review** the diff for security/privacy/accessibility/performance regressions.
10. **Do not claim done** without evidence; do not disable a gate to make it pass.

### 5.5 CI mapping

| Workflow      | Trigger                      | Jobs                                                                                                                   |
| ------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`      | PR + push                    | docs, scaffold, secret scan, lint/type/test/build (when apps exist), E2E, Lighthouse, security                         |
| `content.yml` | PR touching `data/`/`games/` | schema, station order, fare, door side, attribution                                                                    |
| `deploy.yml`  | manual + main (guarded)      | build, deploy static to VPS, migrate, restart API, smoke test, Cloudflare purge                                        |
| `nightly.yml` | schedule                     | Mayar sandbox reconciliation, live-provider budget/freshness check, dependency audit, backup restore check, link check |

Deploy is gated by `DEPLOY_ENABLED=true` and a GitHub Environment approval until the pipeline is proven.

---

## 6. Workstreams

| Stream                      | Phase focus | Owner             |
| --------------------------- | ----------- | ----------------- |
| Simulation/gameplay         | 1–2, 6      | Gameplay engineer |
| Three.js/render/performance | 1–2, 6–7    | Graphics engineer |
| Content/data/research       | 0–3, 6      | Content/design    |
| UI/UX/accessibility         | 1–7         | Designer/frontend |
| Web/motion                  | 0.5, 4, 7   | Frontend/design   |
| API/auth/payments/security  | 2, 4–5      | Backend/security  |
| Infra/CI/observability      | 0, 2, 5, 7  | Platform          |
| Narrative/copy/audio        | 2C, 6–7     | Writer/audio      |
| QA/playtest                 | every phase | QA/design         |

A solo developer can run streams sequentially; the phase gates stay the same.

---

## 7. Timeline scenarios

| Scenario                            | Full-time        | Part-time (~20 h/week) | Notes                   |
| ----------------------------------- | ---------------- | ---------------------- | ----------------------- |
| Docs + scaffold + landing           | done             | done                   | This pass               |
| Free-route slice (P1)               | 8–12 weeks       | 16–24 weeks            | Go/no-go                |
| Core + Live + subs (P2)             | 10–14 weeks      | 20–28 weeks            | All Maps + Mayar + live |
| Cities + platform/hardening (P3–P5) | 15–22 weeks      | 30–44 weeks            | Data/licences/security  |
| Content + launch (P6–P7)            | 7–10 weeks       | 14–20 weeks            | Content-heavy           |
| **v1 launch**                       | **~40–60 weeks** | **~80–120 weeks**      | Gates fixed             |

These are planning ranges, not promises. If the quality gate is red, the date moves; the gate does not.

---

## 8. Risk register

| Risk                                | Likelihood | Impact | Mitigation                                                                                    | Trigger                     |
| ----------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------- | --------------------------- |
| Core not fun / too stressful        | Medium     | High   | Phase 1 playtest, Santai mode, tone review, short runs                                        | Recognition/fun <70%        |
| Humour punches down / feels forced  | Medium     | High   | Native/punch-down review, one joke per beat, silent serious beats                             | Any “mocking” report        |
| Stale research drives a rewrite     | High       | High   | Per-phase brief/ADR, freshness expiry, revalidate before plan/code                            | Expired source/brief        |
| One-hand controls feel limited      | Medium     | High   | Four verbs, assists, real-device tests                                                        | <90% completion             |
| Three.js perf on low-end            | High       | High   | Budgets, instancing/LOD, adaptive quality, early spike                                        | FPS <30 or thermal throttle |
| Mayar personal KYC rejected/delayed | Medium     | High   | Apply early; verify individual/PT Perorangan path; sandbox first                              | No approval by Phase 2 gate |
| Payment bug/fraud                   | Low        | High   | Mayar API re-fetch, state machine, idempotency, reconciliation, pen test                      | Any mismatch/chargeback     |
| Content churn (Karet/Gapeka)        | High       | Medium | Versioned content, refresh drill, no hard-coded schedules                                     | Source change               |
| Live provider cost overrun          | Medium     | High   | Adaptive polling, corridor cache, budget caps, kill switch, weekly cost review                | >80% budget                 |
| Live data licence/terms issue       | Medium     | High   | Written provider terms; legal review; fallback to modeled data                                | No signed licence           |
| “Live crowded” overpromise          | Medium     | High   | Label estimates; no live occupancy claim; operator partnership gate                           | Marketing copy              |
| Mayar webhook forgery               | Low        | High   | Never grant from payload; API re-fetch; idempotency; IP allowlist if available                | Fake callback test          |
| IP/brand complaint                  | Medium     | High   | Original branding, no logos/announcements, legal review                                       | Any notice                  |
| PDP/PSE compliance gap              | Medium     | High   | Data map, privacy policy, DPO review, PSE registration                                        | Launch gate                 |
| Scope creep                         | High       | High   | Corridor ribbons, phase gates, explicit out-of-scope                                          | New feature without docs    |
| Solo-dev burnout                    | Medium     | High   | Phases, reusable engine, cut scope, ask for help                                              | Missed gates 2×             |
| Platform dependency                 | Low        | Medium | VPS + Cloudflare; backups; portable Postgres                                                  | Vendor change               |
| Real-world tragedy sensitivity      | Medium     | High   | ADR-0005 real-basis ledger, 12-month exclusion, no victims/identity blame, sensitivity review | Content review / complaint  |
| Drama fatigue or feels unfair       | Medium     | High   | Rarity/fairness test, max one major/run, no pity timer, two counterplays                      | Recall/share < target       |
| Marketing overpromises              | Medium     | Medium | Show real gameplay, no fake trailers, clear free/paid                                         | Conversion mismatch         |

---

## 9. Launch checklist (summary)

### Product

- [ ] Free route choice complete, both modes, one-hand, offline.
- [ ] All Maps content gated; no client unlock; every current map included.
- [ ] Daily seed/leaderboards/report card/share card.
- [ ] Tutorial <90 s; skip; re-teach.
- [ ] Accessibility settings and manual pass.

### Web

- [ ] Landing/game/pricing/FAQ/legal live.
- [ ] Lighthouse budgets; reduced motion; mobile/desktop.
- [ ] Auth Google + OTP; account export/delete.
- [ ] PWA install/update.
- [ ] WebView fallback.

### Payments

- [ ] Mayar production approved; live keys; Live tier configured.
- [ ] QRIS/e-wallet/VA tested with real low-value transaction.
- [ ] Mayar callback forged/replay tests pass; API re-fetch; reconciliation clean 7 days.
- [ ] Refund/revocation and subscription expiry/cancel tested.
- [ ] Receipts/tax/PSE/terms/privacy/refund/cancellation; Mayar/MoR disclosure.
- [ ] Support template + monitoring.

### Ops/security

- [ ] VPS hardened; backups + restore drill; rollback drill.
- [ ] Sentry/uptime/payment/live-provider/backup alerts.
- [ ] No critical/high vulnerabilities; CSP; secrets scan.
- [ ] Incident/privacy/payment runbooks.
- [ ] Load test; Cloudflare WAF/rate limits; live-provider budget kill switch.

### Go-to-market

- [ ] Trailer/screenshots/press kit/OG; live/estimated labels correct.
- [ ] Devlog + route guides + social clips.
- [ ] Soft launch cohort + feedback loop.
- [ ] Changelog/status page.
- [ ] Pricing/launch offer honest; All Maps 79k, Live 49k; no fake scarcity.

---

## 10. Definition of Done (v1)

1. All MUST requirements in `specs.md` §9 pass.
2. Research brief/ADR and source freshness current; free route and All Maps content complete; Live data/subscription gates pass.
3. Mayar production payments verified; entitlements/reconciliation/refunds/subscription lifecycle proven.
4. Performance/accessibility/security/privacy gates green.
5. PSE/IGRS/tax/legal readiness documented.
6. Backups/restore/rollback/incident runbooks tested.
7. Support inbox + FAQ + response templates live.
8. Soft launch metrics meet thresholds or have a signed remediation plan.
9. `status.md` and evidence report signed.
10. User accepts the release.

---

## 11. Decision log

| Date       | Decision                                                                                                    | Rationale                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 2026-10-19 | Free = choose one route; All Maps Rp 79k one-time; Live Rp 49k/month; no ads                                | User decision; free route is the real game; Live funds data; All Maps funds content        |
| 2026-10-19 | Subscription + live data in Phase 2; other cities in Phase 3                                                | User decision; live is the subscription’s reason to exist                                  |
| 2026-10-19 | Research-first gate: brief + ADR + benchmark/cost/security/WNI evidence before plan/code                    | Prevents stale-fact rewrites and unsafe cost/security assumptions                          |
| 2026-10-19 | Brand line: “Susahnya nyata, dramanya gratis.” / “Berangkat. Berjuang. Sampai. Gitu aja terus setiap hari.” | User direction; drama is core; dry, self-deprecating, expandable per game                  |
| 2026-10-19 | Drama = core, rare, real-basis, fictionalised, fair, shareable; ADR-0005                                    | User direction; freshness/memory/share engine; bounded to avoid exploiting real tragedy    |
| 2026-10-19 | Daily drama: 00:00 WIB AI research/draft, owner approval, no auto-publish; ADR-0006                         | User direction; daily freshness without legal/privacy/human-harm risk; human is final gate |
| 2026-10-18 | Real place names, original branding, no official logos                                                      | Authenticity without IP/trade-dress risk                                                   |
| 2026-10-19 | Payment provider: Mayar; sandbox until KYC                                                                  | User decision; supports one-time invoice + SaaS subscription; MoR but no tax processing    |
| 2026-10-19 | Live data: TomTom traffic/incidents + BMKG weather; crowding modeled/opt-in                                 | Only feasible real feeds today; no public KRL/TransJakarta live crowding                   |
| 2026-10-18 | Deploy to netcup VPS at `wniseries.ahaqqu.com`; Cloudflare edge                                             | Existing infra; Postgres/payment/cron/fixed IP favor VPS                                   |
| 2026-10-18 | Astro platform + Vite/Three.js game + Fastify/Postgres API                                                  | SEO/performance for web; control/determinism for game; robust payments                     |
| 2026-10-18 | One-hand portrait-first, offline-tolerant; live snapshot at run start                                       | The game is played during a commute; determinism/fairness                                  |
| 2026-10-18 | Versioned content packs with `effective_from`                                                               | Real-world data changes; no hard-coded timetables                                          |
| TBD        | Final subtitle/logo/voice budget; one-route change policy; All Maps future-city wording                     | Design/product open questions                                                              |

---

## 12. Immediate next steps (Phase 0 completion)

1. User provides/clarifies: Cloudflare access, VPS OS/SSH, Mayar account/KYC status, final brand/domain details, English launch requirement.
2. Write the Phase 1 research brief and ADR(s); run the latest-stack/reference-device benchmark and WNI experience plan.
3. Create the Mayar sandbox project and record API key/product/tier IDs in a password manager.
4. Run the Phase 0 stack spikes (Three.js, deterministic sim, auth, payment, deploy).
5. Fill `status.md` with evidence.
6. Only then start Phase 1: the free-route vertical slice (KRL first).

---

_End of plan.md. The gate is the promise._
