# Research Brief — Jakarta Commute Simulation (WNI Pejuang Nafkah)

**Date:** 2026-10-18  
**Depth:** deep (research feeds game design + implementation phases)  
**Owner:** design/plan for a physically + psychologically realistic Jakarta commute game (NOT a racing game)

## Refined question
What must a 3D web game capture so a Greater Jakarta office worker feels **the same daily commute** — roads, vehicles, people, rules, weather, stress, and micro-decisions — on motorcycle and on KRL?

## In scope
- Real Jakarta / Jabodetabek road geometry cues: lane widths, arterial names (Jl. Jend. Sudirman, Gatot Subroto, H.R. Rasuna Said, JORR, Bintaro–BSD corridors), intersections, traffic light behaviour, medians, flyovers/underpasses, markings
- Traffic participants & obstacles: private cars, angkot, TransJakarta busway, ojek online, trucks, pedestrians, pedagang kaki lima, police/pos polisi, construction, banjir points
- KRL Commuter Line physical reality: JR 205 (and similar) train look, station platform layout, door timing, crowd density, handrails, announcements, peak hours
- Psychological / behavioural struggle of Pejuang Nafkah: cost, time, safety, fatigue, dignity, "already late", rain, missing train, salary pressure, mental load
- Realistic route templates: BSD / Bintaro / Depok / Bekasi → SCBD / Dukuh Atas / Sudirman
- Gameplay systems that encode those struggles as mechanics (not collect-a-thon arcade)

## Out of scope
- Full photoreal city open world / GPS-accurate every alley
- Multiplayer, real-time traffic API feed
- Commercial vehicle physics engines as a product dependency (unless needed later)
- Implementing code in this research phase (design.md + plan.md only after findings)

## Assumptions
- Target: Indonesian office workers (and curious global players) on mobile + desktop web
- Stylized-but-authentic low-poly art (readability over photo), but **behaviour, layout, and names must be real**
- Free trial + Paywuz full map remains monetization
- Research uses public web sources (articles, official KAI/KRL pages, OSM-related road facts, news, forums)

## Angles (parallel)
1. **Roads & traffic infrastructure** — lane widths, arterial routes to SCBD, intersections, traffic lights, busway, flyover patterns, typical speeds in macet
2. **Traffic participants & street obstacles** — angkot/ojek/TransJakarta/police/pedagang/banjir/construction; how they force decisions
3. **KRL physical + operational reality** — JR 205, stations, doors, crowd, peak, real corridors (Bintaro/Rangkasbitung, Depok/Bogor, Bekasi)
4. **Psychological & daily-struggle research** — stress, fatigue, cost, time poverty, dignity, weather, “terlambat” culture, mental load
5. **Route templates & commute budgets** — realistic distance/time/cost Bintaro–BSD–Depok–Bekasi to SCBD; multimodal handoffs

## Deliverable after research
1. `research/jakarta-commute-sim/REPORT.md` (cited)
2. `artifacts/DESIGN.md` (game design: systems, mechanics, authenticity checklist)
3. `artifacts/PLAN.md` (phase-by-phase implementation plan)
