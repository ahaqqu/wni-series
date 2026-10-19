# Phase 1 research pre-flight — plan (not yet evidence)

**Status:** **DRAFT / NOT STARTED.** This is the work plan for the Phase 1 research gate, not a completed brief. Do not start Phase 1 implementation from this document.
**Decision it informs:** the free-route vertical slice architecture, corridor content, performance budgets, security model, cost envelope, and WNI experience test.
**Protocol:** [PROTOCOL.md](PROTOCOL.md). **Gate:** brief + ADR + source log + benchmark + cost/security/UX notes.

---

## 1. Questions to answer before code

### R-TECH — latest tech

- Current stable **Three.js**, **Vite**, **Astro**, **TypeScript**, and browser support as of the research date; official release notes/changelogs, EOL/support, licence.
- WebGL2 baseline vs WebGPU; fallback and feature detection; iOS Safari/Android Chrome behaviour.
- Deterministic sim boundary: fixed timestep, input replay hash, no DOM/Three imports in `sim/`.
- Offline/PWA: service worker scope, cache versioning, update prompt, IndexedDB save, no stale code.
- Bundle/perf: tree-shaking, Draco/KTX2/WebP, draw calls, shader variants, worker use, memory ceiling.
- Security advisories and supply-chain risk for every new dependency; licence compatibility.

**Evidence:** official docs/release notes, a minimal benchmark on reference devices, `renderer.info`, bundle analyzer, replay hash.

### R-DATA — accurate real-world data

- Jurangmangu/Pondok Ranji → Tanah Abang → Sudirman/BNI City station order, door side, platform type.
- Fares/formula, headway ranges, first/last train, transfer walk, crowding profile, KRL rules.
- Road rules for the motor/last-mile segment; odd-even, busway, parking, angkot/ojol behaviour.
- OSM geometry/licence/attribution; no unofficial operator logos/trade dress.
- Two independent confirmations for volatile facts; `effectiveFrom`/`retrievedAt`/`expiresAt`; snapshot of the source.

**Evidence:** source registry + validation sheet; re-check 7 days before content lock and before release.

### R-SEC — security/privacy

- Phase 1 is static/local-first; no auth, payment, or server-owned run in scope.
- CSP/headers, asset integrity, no unreviewed third-party scripts, no client secrets.
- localStorage/IndexedDB: no PII, safe schema, corruption recovery, XSS surface.
- Dependency audit, lockfile, pinned Actions; font/image/audio licences.
- Threat model: cheating a local score is not a security boundary; server validation arrives with leaderboards.

**Evidence:** threat model note, CSP/header check, dependency/secret scan, save-corruption test, licence list.

### R-PERF — performance/load

- Budgets: 60 fps target / 30 fps floor on mid/low devices; frame-time p95; memory; load; battery/thermal.
- Reference devices: at least one low-end Android, one mid-range Android, one older iPhone, one desktop; 4G/3G and offline.
- Measure first-run load, station scene, crowd scene, transfer, pause/resume; `renderer.info`; long-session memory.
- No live network in a run; no mid-run provider calls.

**Evidence:** raw profile JSON/CSV, device names/OS/browser, commit, scene, pass/fail vs budget.

### R-COST — cost control

- Phase 1 incremental cost: static hosting on the existing VPS/R2/Cloudflare, CI minutes, asset egress, no provider API.
- Cost per 1k/10k players at expected asset sizes; worst case egress; cache hit.
- Cap/alerts for any paid service; no hidden recurring dependency.

**Evidence:** cost sheet with prices/dates/FX; cache/egress assumption; what would make it non-zero.

### R-SCALE — robustness/scaling

- Static assets at 10× concurrent: Cloudflare cache, origin egress, bundle size, release atomicity.
- No DB/API dependency in Phase 1; if a leaderboard stub is added, state its boundary and failure mode.
- Rollback/versioned assets; offline cache upgrade; corrupted save recovery.
- Failure injection: WebGL context loss, asset 404, slow network, storage full, tab suspended.

**Evidence:** load/cache test, failure-injection log, rollback test.

### R-WNI — emotional and physical experience

- 6–8 ride-alongs/diary participants on the chosen corridor; consent/compensation.
- Observe: standing, heat, rain, crowding, transfer, phone use, one-hand reach, balance, fatigue, dignity, safety, cost stress.
- Body map; emotional interview; what feels funny vs disrespectful; native/punch-down review.
- Accessibility: low-end device, small screen, reduced motion, screen reader, disabled/elderly/pregnant commuters where relevant.
- Synthesize journey map + design implications; state limitations.

**Evidence:** anonymised notes, consent log, themes, quotes, design changes; no PII/faces/voices without release.

### R-LEGAL — content/licence

- OSM ODbL attribution; font/image/audio licences; no official operator logo/trade dress/PA audio.
- Real place names are facts, but check no implied endorsement.
- No real recent tragedy or victim content.

**Evidence:** licence/attribution registry; legal review for any ambiguous asset.

---

## 2. Method and sequence

1. **Desk research (R1):** official docs/data/price pages; source log; draft questions.
2. **Technical spike (R1/R2):** minimal Three.js corridor, deterministic replay, reference-device benchmark; ADR for renderer/sim/offline.
3. **Field research (R2):** ride-along + diary + body map + interviews; synthesis.
4. **Data validation:** station/fare/door-side/geometry sheet; second source; content snapshot.
5. **Security/cost/scale review:** threat model, headers, dependency scan, cost sheet, failure injection.
6. **Gate review:** protocol checklist; unresolved unknowns become stop conditions.

## 3. Deliverables

- [ ] `2026-10-phase-1-brief.md` (findings, options, recommendation, unknowns)
- [ ] ADR(s): renderer/sim/offline/content pipeline as needed
- [ ] Source log + data validation sheet
- [ ] Benchmark JSON/CSV + reference device list
- [ ] Cost sheet with date/FX/worst case
- [ ] Threat model/security note
- [ ] WNI experience note (anonymised)
- [ ] Native/punch-down review note
- [ ] Go/no-go recommendation to the user

## 4. Stop conditions

- Latest versions/support/security cannot be confirmed.
- Station order/door side/fare/road rule is unverified or conflicts.
- OSM/asset licence is unclear.
- Benchmark misses 30 fps floor on the low-end reference device without a credible fix.
- Field research cannot be recruited/consented; do not substitute stereotypes.
- The cost/scale/security model has no cap or the worst case is unacceptable.
- The user has not approved the Phase 0 gate/Phase 1 scope.

## 5. Known inputs (not a substitute for the above)

- [2026-10 refresh](2026-10-refresh.md) — transport/market facts (revalidate volatile items).
- [2026-10 live-data/Mayar](2026-10-live-data-and-mayar.md) — not used in Phase 1, but relevant to Phase 2 boundaries.
- [design.md](../design.md) — experience/one-hand hypotheses to test, not proof.
- [specs.md](../specs.md) — MUSTs and release criteria.
