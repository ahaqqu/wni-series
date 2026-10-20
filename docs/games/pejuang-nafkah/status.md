# status.md — Pejuang Nafkah

**Last updated:** 2026-10-20
**Current phase:** Phase 0 — foundation + pre-alpha landing page **+ standalone Draft 0 prototypes (non-canonical, local only)**
**Implementation:** landing page + waitlist API implemented; standalone station push-and-hold prototype (`/station.html`) and standalone push/hold arena test with camera/viral result, 1.8× inspect zoom, and charge/fall animation (`/`) in `games/pejuang-nafkah`; canonical game/checkout/auth not started; v4 pricing/live-data design and v4.3 brand/drama + daily-pipeline design documented; landing reflects v4.2, not in-game

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

## 1A. Standalone Draft 0 prototype — push & hold (2026-10-20)

A playable, **non-canonical** mechanic spike is now in `games/pejuang-nafkah`. It is not the canonical KRL mode and is not deployed.

- **Research/decision:** [push-and-hold brief](research/2026-10-push-hold-prototype.md); [ADR-0009](../../adr/0009-push-hold-prototype.md).
- **Scope:** Jurangmangu south gate → ticket-gate queue → optional coffee → platform → one of three candidate front-car door zones → train arrival → alighters → claim/board hold → seat/stand → result. Two waves (1:30/3:30), 4:00 limit, hard fail, quick retry.
- **Mechanic:** two-act hold (claim behind the yellow line, then board); sustained lean plus full-charge **Hentak** release; crowd pulses; station estimate vs revealed door zone; yellow-line whistle; alighters-first; protect a vulnerable passenger by releasing in time; camera warning → silent viral fail.
- **Resources:** run-only energy; gengsi (any loss can reach 0); rupiah fare/coffee; placeholder fare Rp 3.000 and coffee Rp 10.000, visibly labelled.
- **Build:** Vite 8.3.4, Three.js 0.186.1, TypeScript 6.0.3 in the game package (workspace tooling 7.0.2), Vitest 5.0.5. Pure `sim/`, Three.js `render/`, disposable DOM HUD at 10 Hz, fixed 60 Hz sim.
- **Evidence:** 17 sim tests pass; typecheck/build pass; Chromium screenshots at 390×844 and 1280×900; local only. See the [prototype report](../../../artifacts/verification/prototype-0/2026-10-20/report.md).
- **Not done:** real-device performance, one-hand commuter playtest, a11y/axe, E2E trace/video, offline check, native/sensitivity review, deploy. The prototype does not, by itself, close the Phase 0 Three.js reference-device or deterministic replay gates.

## 1B. Arena uji — push, charge, timed hold/revenge + camera/viral + inspect zoom + charge/fall animation (2026-10-20)

A second, **non-canonical** local test is now the default page (`/`): an empty circular arena with exactly **one player and three passengers** (A aggressive, B passive, C camera bystander). The station prototype is preserved at `/station.html`.

- **Research/decision:** [push/hold arena brief](research/2026-10-push-hold-arena.md); [ADR-0010](../../adr/0010-push-hold-arena.md).
- **Scope:** joystick movement; **DORONG** physical shove (tap = normal, hold/release = hard); **TAHAN** timed brace; one passive passenger (B) who can be shoved and can take revenge; one aggressive passenger (A) who telegraphs and shoves back; one camera bystander (C) who can end the run; a render-only 1.0×–1.8× inspect camera; render-only charge wind-up and push-direction fall animation. No station, timer, energy/gengsi/rupiah, or score. Reset and repeat.
- **Mechanic v1:** A winds up for **0.9 s**; the green hold window is the last **0.30 s**. Press and hold inside the window to brace (`PAS`); early/late/absent holds are knocked back; a push during the wind-up interrupts (`DIBLOK`); stepping out of range misses (`MELESET`). Push is mass-scaled, has a cooldown, and moves a real body.
- **Mechanic v2 (2026-10-20):** hold **DORONG** ~0.5 s and release for a **hard push** (impulse 11.5/mass, knockdown). Being shoved now throws the player farther and **knocks them down** (0.95 s; no move/push/brace until get-up); the same 0.9 s/0.30 s hold still answers A. Pushed passengers gain deterministic anger; a hard shove makes B **angry**, and after getting up B returns with a **revenge quick shove: 0.55 s lead / 0.18 s window**, orange `BALAS DENDAM · CEPAT` read. A can also revenge after enough shoves.
- **Mechanic v3 (2026-10-20):** a third passenger, **C**, stands at the back with a phone and is **not a push target**. The first successful push starts a deterministic camera cycle: **`SIAP` 0.9 s** (phone up, amber cone/label, HUD strip + draining meter) → **`MEREKAM` 1.8 s** (red phone/cone/label/ring/strip) → **`TURUN` 0.7 s** → `DIAM`. A push that **hits A or B while C is recording** freezes the sim, captures a still from the arena camera, and opens a fictional Instagram-style viral popup with eight authored negative comments, then **GAME OVER** and **COBA LAGI**. Pushes during SIAP/TURUN and whiffs are not caught. The capture is a still with video chrome, not encoded video; no Instagram API/account/upload/network/assets are used.
- **View v4 (2026-10-20):** a compact **`− 1.0× +`** control under RESET, **pinch** on the canvas, **mouse wheel**, and **Z / X** change a **render-only orthographic zoom** from **1.0× to 1.8×** (0.2 steps; buttons disable at the limits). It enlarges the characters without touching the sim. The camera stays arena-centred; there is **no pan/follow**, so a character at the far edge or a narrow viewport can crop. RESET/`R`/COBA LAGI keep the current zoom. The 1.8× cap keeps all four default-position characters fully visible at 390×844; 2.0× cropped B.
- **Animation v5 (2026-10-20):** holding **DORONG** now loads the player visibly: the whole body leans back, shifts weight behind the ring, and lowers slightly, scaled continuously by `pushCharge`; release flashes forward. Falls now latch the knockback direction on the first `fallen` frame and tilt the body around a horizontal axis, so a face-to-face shove lands on the **back**, side hits fall sideways, and hits from behind fall forward. Player, A, and B use the same render path, with a ~0.1 s fall/recover blend. The sim still owns `fallen`, velocity, facing, and timers; no sim rules changed.
- **Build:** the same Vite 8.3.4 / Three.js 0.186.1 / TypeScript 6.0.3 / Vitest 5.0.5 package, now with two HTML entries and a separate pure arena sim.
- **Evidence:** 18 arena `AR-SIM-*` tests + the 17 station `PA-SIM-*` tests pass (**35 total**); typecheck and multi-page build pass; Chromium 390×844 / 1280×900 screenshots of camera idle/SIAP/MEREKAM/viral popup/after retry and desktop camera/viral, plus v4 zoom default/1.8× idle/1.8× action/desktop and v5 full-charge/player-fall/get-up/passenger-fall captures; live `J` tap path for the camera loop and charge. Build sizes: arena 46.32 kB (13.99 kB gzip), shared 579.84 kB (146.54 kB gzip), station 74.49 kB, CSS 33.61 kB (7.32 kB gzip). Zoom and the animation poses add no sim tests; the 35 tests/typecheck/build pass. See the [v5 animation report](../../../artifacts/verification/prototype-0/2026-10-20-arena-v5/report.md), [v4 zoom report](../../../artifacts/verification/prototype-0/2026-10-20-arena-v4/report.md), [v3 camera/viral report](../../../artifacts/verification/prototype-0/2026-10-20-arena-v3/report.md), [v2 report](../../../artifacts/verification/prototype-0/2026-10-20-arena-v2/report.md), and [v1 report](../../../artifacts/verification/prototype-0/2026-10-20-arena/report.md).
- **Caveat:** the arena is deliberately **two-thumb** and does **not** satisfy the v1 one-hand MUST. It does not close any Phase 0 gate. The **0.18 s quick revenge window**, the camera's **0.9 s SIAP / 1.8 s MEREKAM** read, and the **viral-popup tone** are unvalidated; no real-phone timing/tone test, a11y audit, real video/E2E trace, or real-device perf. The 1.8× zoom has no real-phone pinch/comfort or a11y test; no pan/follow, and close framing can crop at 320 px or when characters move to the edge. The charge/fall poses are render-only approximations: no rigged limbs/ragdoll, no real-phone read, and no automated animation test; they use a foot pivot and one merged mesh. Headless FPS is SwiftShader-bound and is not a perf result; draw calls 44 in the desktop viral capture.

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
| Prototype    | Standalone Draft 0 station push-and-hold spike; hard fail/energy/viral are non-canonical; local only; ADR-0009               |
| Arena test   | Standalone push/hold arena (1 player, 3 passengers) at `/`; charge/release hard push, knockdowns, revenge quick shove; camera bystander → viral popup/game over; render-only 1.0×–1.8× inspect zoom; charge wind-up + push-direction fall animation; two-thumb; no resource scoring; local only; ADR-0010 |
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

**Draft 0 note (2026-10-20):** the standalone prototypes are playable locally and have deterministic simulations, but they do **not** close the Three.js reference-device gate, the deterministic replay gate, or the Phase 1 research gate. The arena is an even narrower two-thumb feel test. The camera/viral popup is an authored local mock, not a social feature or a canonical fail state; the 1.8× inspect zoom is a lab view aid, not a camera system; the charge/fall poses are presentation, not a rigged animation system. The canonical game is still not started. Both prototypes are allowed by [ADR-0009](../../adr/0009-push-hold-prototype.md) and [ADR-0010](../../adr/0010-push-hold-arena.md) and do not change the v1 specs.

## 4. Next action

**Immediate, before more prototype work:**

1. Open the local arena (`/`) on a real phone and test the two-thumb layout: is the joystick reachable; does **DORONG** move a body with weight; can the charge be read and released deliberately; is the 0.30 s normal window readable; can anyone intentionally hit the **0.18 s revenge window**; does the first push give enough warning to read **SIAP**, and can the player reliably avoid pushing for **MEREKAM**'s 1.8 s? Note early/late/avoid rates, whether knockdowns feel like a setback rather than a stunlock, and whether the viral popup reads as consequence rather than mockery. Also try the 1.8× zoom buttons and pinch: can you read the character/action, does the control get in the way, and does a cropped edge character frustrate the inspect view? Charge a full DORONG facing sideways and check whether the wind-up reads without delaying the release; get shoved face-to-face and confirm the back-first fall reads. Tune before adding anything else.
2. Open the station build (`/station.html`) one-handed; note whether the hold/drag, the gate cut, the coffee window, and the protect release are reachable with a thumb.
3. Run 5–8 short commuter playtests: can they explain why they failed; did the station claim hold feel tense rather than tiring; was the door-zone read fair; did the viral beat feel serious rather than mocking; did the arena push/hold feel physical rather than button-mashy.
4. Decide whether the arena's two-thumb control model is acceptable for any v1 context. If not, keep the station one-hand rule and treat the arena as a lab; if yes, write the spec/ADR change before touching the canonical game.

**Phase 0 continues:**

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
- The standalone prototypes are **playable locally only**, not deployed, and **non-canonical**. Real-device FPS, one-hand commuter playtest, a11y/axe, E2E trace/video, offline/service-worker behaviour, and native/sensitivity review of the viral beat are pending. Headless Chromium in this container is SwiftShader-bound (single-digit fps), so its fps is **not** a performance result.
- The arena test is **two-thumb** and therefore conflicts with the one-hand MUST. Its 0.9 s lead / 0.30 s window, the revenge 0.55 s / 0.18 s window, and the camera 0.9 s/1.8 s/0.7 s cycle are tuned to feel, not sourced frame data; it has no real-phone test yet. The 0.18 s window and ~0.5 s charge threshold are the most likely tuning failures; the camera's SIAP/MEREKAM read and viral-popup tone are next. The zoom is capped at 1.8× with no pan/follow; pinch discoverability/comfort, close-framing crops, and a11y are untested. The charge/fall animation is a whole-body lean and a direction-based foot-pivot tilt, not a rig or ragdoll; its 0.1 s blend and the fall direction from knockback need a real-phone read. Do not treat any of it as the v1 control/camera/animation system.
- Canonical game, checkout/auth, live-data implementation, and production deployment are still not started.
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
| 2026-10-20 | Draft 0 | Push-and-hold station prototype: [brief](research/2026-10-push-hold-prototype.md), [ADR-0009](../../adr/0009-push-hold-prototype.md), `games/pejuang-nafkah`; 17 sim tests + root `pnpm verify` pass; Chromium evidence 390×844 and 1280×900 in [prototype report](../../../artifacts/verification/prototype-0/2026-10-20/report.md); **no real-device/commuter/a11y evidence** |
| 2026-10-20 | Draft 0 | Standalone push/hold arena (iteration 1): [brief](research/2026-10-push-hold-arena.md), [ADR-0010](../../adr/0010-push-hold-arena.md); 10 arena `AR-SIM-*` + 17 station tests pass (27); typecheck/multi-page build pass; Chromium 390×844/1280×900 + live pointer/keyboard smoke in [arena report](../../../artifacts/verification/prototype-0/2026-10-20-arena/report.md); **two-thumb, no real-phone/a11y/perf evidence** |
| 2026-10-20 | Draft 0 | Arena iteration 2: charge/release hard push, knockdowns + get-up, deterministic anger/revenge quick shove (0.55 s/0.18 s); 14 arena + 17 station tests pass (31); build 31.08 kB arena / 555.94 kB shared chunk; [v2 report](../../../artifacts/verification/prototype-0/2026-10-20-arena-v2/report.md); **0.18 s window, two-thumb, no real-phone/a11y/perf evidence** |
| 2026-10-20 | Draft 0 | Arena iteration 3: camera bystander C, `SIAP` 0.9 s → `MEREKAM` 1.8 s → `TURUN` 0.7 s; hit during recording → captured still + fictional Instagram-style viral popup + GAME OVER/retry; 18 arena + 17 station tests pass (35); build 42.47 kB arena / 579.83 kB shared chunk; [v3 report](../../../artifacts/verification/prototype-0/2026-10-20-arena-v3/report.md); **still is not encoded video; two-thumb, no real-phone/a11y/perf evidence** |
| 2026-10-20 | Draft 0 | Arena iteration 4: render-only **1.0×–1.8× inspect zoom** with buttons, pinch, wheel, Z/X; cap keeps all four visible at 390×844; reset keeps zoom; 35 tests unchanged; build 44.78 kB arena / 33.61 kB CSS; [v4 report](../../../artifacts/verification/prototype-0/2026-10-20-arena-v4/report.md); **no pan/follow, no real-phone pinch/a11y evidence; close framing crops at 320/moving edge** |
| 2026-10-20 | Draft 0 | Arena iteration 5: render-only charge wind-up + push-direction fall; real A shove falls back-first; player get-up restored; B hard-shove fall back-first; 35 tests unchanged; build 46.32 kB arena / 13.99 kB gzip; [v5 report](../../../artifacts/verification/prototype-0/2026-10-20-arena-v5/report.md); **no rigged animation/a11y/perf; no automated render test** |

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
