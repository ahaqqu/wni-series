# PLAN.md — Phase-by-phase delivery

**Project:** WNI Pejuang Nafkah (Jakarta Commute Simulator)  
**Date:** 2026-10-18  
**Design:** `artifacts/DESIGN.md` · Research: `research/jakarta-commute-sim/`

**Rule:** each phase ends with **Playwright evidence** (screenshots + probe) and a short `artifacts/game-progress.md` update. Ship quality over speed.

---

## Phase 0 — Data & map foundation *(current)*
**Goal:** real geometry data drives the game, not hard-coded fantasy.

| Task | Output |
| --- | --- |
| 0.1 Collect OSM/`lanes=*` + corridor polylines (Sudirman, Gatot Subroto, Rasuna Said, Bintaro, BSD, JORR) | `src/data/roads/*.json` |
| 0.2 Station master (Rangkasbitung, Bogor, Cikarang) with real order + km | `src/data/stations.json` |
| 0.3 Landmark pins (Semanggi, Manggarai, Dukuh Atas, SCBD) | same |
| 0.4 Rule tables (ganjil-genap windows, light cycle defaults, fare formula) | `src/data/rules.json` |
| 0.5 Live map renderer (SVG) reading those JSONs | `src/ui/LiveMap.ts` |

**Exit:** map shows named real corridor + stations; unit test/parse OK.

---

## Phase 1 — Road authenticity (motorcycle)
**Goal:** play a **named** corridor with lights and busway.

| Task | Detail |
| --- | --- |
| 1.1 Corridor mesh builder | Lane width 3–3.25 m · busway 3.5 m + concrete separator · median · sidewalk |
| 1.2 **Traffic light system** | 3-light poles, queue cars, yellow box, motorcycle filter gap |
| 1.3 **Semanggi landmark** | Ground Sudirman + flyover ramps (visual, optional drive-up) |
| 1.4 Obstacle pass 1 | Angkot stop-anywhere · ojol weave · TransJakarta bus in busway · pedestrian edge |
| 1.5 **Razia / ganjil-genap** | Pos polisi event; plate odd/even for cars; player bike always allowed |
| 1.6 Live map wire-up | Street names on strip, light pins, ETA vs 08:30 |
| 1.7 Feel | Crawl-speed tuning 14–25 km/h · brake lights · lean · hitstop only on crash |

**Exit (Playwright):** desktop+mobile active-play · light turns red and queue forms · angkot stop event · map names visible · no console errors.

---

## Phase 2 — Psychology & economy layer
**Goal:** daily struggle becomes systems.

| Task | Detail |
| --- | --- |
| 2.1 Clock + leave time | Start 05:30–07:30; office 08:30 hard |
| 2.2 **Kelelahan mental** | Heat/noise/delay drain; low = control wobble + vignette |
| 2.3 **Biaya (UMR-aware)** | Parkir, tilang, ojek offer, tol; running out removes options |
| 2.4 Helplessness events | “Macet mencuri waktu” after long queue |
| 2.5 Weather | Hujan grip · banjir zone pins (pantaubanjir-style) |
| 2.6 UI copy ID | *Telat lagi*, *Nabung ongkos*, *Capek jalan*, *Tim subuh* toggle |

**Exit:** fatigue + money change decisions in probe run; banners fire on real events.

---

## Phase 3 — KRL authenticity
**Goal:** interior + station reality.

| Task | Detail |
| --- | --- |
| 3.1 JR 205 exterior | Stainless, red-yellow, 4-door + **6-door crush car** |
| 3.2 Interior upgrade | Straps, priority seats, LED strip, right-side doors |
| 3.3 Station list free | **Tanah Abang → Palmerah → Kebayoran → Pondok Ranji → Jurangmangu** (correct order) |
| 3.4 Platform | Yellow line, tactile, name board, gate/e-money entry |
| 3.5 Ops | Headway wait · door timer · dwell · announcement text |
| 3.6 Crowd physics | Crush, oxygen, dignity, *war tempat duduk*, Manggarai transfer surge (full) |
| 3.7 Live map | Line-colored station diagram + train dot + fare accrual |
| 3.8 Economy | Rp 3.000/25km + Rp 1.000/10km |

**Exit:** interior screenshot + map with real names/order · door timer fail path · fare displayed.

---

## Phase 4 — Full map & multimodal
**Goal:** Pejuang Nafkah full day.

| Task | Detail |
| --- | --- |
| 4.1 Corridors | BSD (Cisauk + BSD Link) · Depok (Bogor Line) · Bekasi (Cikarang) |
| 4.2 Hubs | Manggarai 230k crush set-piece · Tanah Abang 155k transfer |
| 4.3 Multimodal handoffs | Ojek→station→walk/TransJakarta (Rp 25–70k · 55–110 min class) |
| 4.4 Disaster cascade | Tol accident / signal failure / banjir reroute |
| 4.5 Paywuz unlock | Full corridors + *tim subuh* + outfits |

**Exit:** full route choose UI · one complete day loop onboarding→alight SCBD.

---

## Phase 5 — Polish, audio, QA, release
| Task | Detail |
| --- | --- |
| 5.1 Audio | Horns, angkot calls, KRL door/announcement, rain, station bed |
| 5.2 Motion QA | Camera interior/exterior, hitstop, fatigue vignette |
| 5.3 Performance | Instancing for traffic/crowd; budget calls ≤ 300 desktop stretch |
| 5.4 Visual harness | Snapshot matrix: light-queue, angkot-stop, krl-crush, banjir, map |
| 5.5 Bot playtest | Document struggle metrics (late rate, crash rate, fare spent) |
| 5.6 Release | `npm run build`, evidence manifest, deploy notes |

---

## Parallel workstreams (any phase)

| Stream | Owner | Depends |
| --- | --- | --- |
| Map JSON + OSM extract | data | P0 |
| Traffic AI (lights, angkot, ojol) | gameplay | P1 |
| Interior KRL + stations | gameplay | P3 |
| HUD/LiveMap | UI | P0 continuous |
| VFX/audio | polish | after P1/P3 |

---

## Risk register

| Risk | Mitigation |
| --- | --- |
| Exact lane counts unsourced | Use OSM `lanes=*`; visual “measured stylized” |
| Scope creep to open world | Corridor ribbons only |
| Too hard / stressful | Difficulty = leave time + mode; *tim subuh* optional |
| Performance with crowds | Instancing + LOD; 6-door car only when relevant |
| Real names/brands IP | Use public infrastructure names (roads/stations); avoid private brand lockups in assets |

---

## Definition of Done (game)
1. Player can finish **one authentic commute** (motor *or* KRL) with named map.
2. At least **5 real obstacle types** force decisions.
3. Fatigue + biaya + clock interact (not bolted on).
4. Playwright pass-8 style evidence updated for every phase.
5. Design authenticity checklist (DESIGN.md §11) all green for that phase’s scope.
