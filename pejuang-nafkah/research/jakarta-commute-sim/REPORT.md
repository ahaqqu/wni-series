# REPORT — Jakarta Commute Reality (research synthesis)

**Date:** 2026-10-18  
**Sources:** 5 parallel research passes (F1–F5), public web  
**Purpose:** Evidence base for `DESIGN.md` + `PLAN.md` of *WNI Pejuang Nafkah*

## Core conclusion
A convincing commute sim is **not** a racer. The fantasy is **surviving a real morning**: fixed arterial geometry, unpredictable social traffic, official rules (ganjil-genap, busway, door timers), and a mental budget that drains under heat, crowd, delay, and cost.

---

## 1. Roads & infrastructure (F1)

| Fact | Game use |
| --- | --- |
| Golden Triangle spine: **Jl. Jend. Sudirman 4.1 km**, **Jl. Gatot Subroto 6.98 km**, **Jl. H.R. Rasuna Said 4.9 km** | Named corridor map + HUD route strip |
| **Semanggi** multi-level cloverleaf + 2017 flyovers (6–11.5 m) over ground Sudirman | Signature landmark + vertical road layers |
| **TransJakarta busway**: dedicated lane + concrete separators + **median island haltes**; Corridor 1 on Sudirman–Thamrin; flat **Rp 3.500** | Hard spatial constraint — player cannot casually invade busway |
| Peak intersection example (Fatmawati, PKJI 2023): DoS **0.86**, queue **271 m**, delay **~85 s/veh** | Traffic-light queue model + motorcycle lateral filter |
| Motorcycle **lane filtering** endemic; congested arterial crawl **~14–16 km/h** | Default “speed” is crawl, not race |
| **Ganjil-genap** Sudirman/Rasuna Said weekdays **06–10 & 16–21** (cars) | Rule system / police razia flavour |
| Open: exact per-corridor `lanes=*` and signal cycle seconds | Plan Phase 2: OSM extract + Dishub drawings |

**Visual:** wide arterials, busway median, elevated Semanggi ramps, tall CBD glass, ojek swarm on lane edges, yellow box junctions.

## 2. Street obstacles & participants (F2)

| Fact | Game use |
| --- | --- |
| **Angkot (MPU) may stop anywhere** for pick/drop | Primary random obstacle family |
| Ojek/ojol weave through *sela-sela kemacetan* | AI agent type (filtering, not racing) |
| TransJakarta ~**252 haltes**, **1.4–1.6M** riders/day | Busway islands + boarding queues |
| **PKL** encroach sidewalks → ped step into roadway | Edge clutter + sudden pedestrian |
| **Banjir** paralyzes roads (e.g. March 2025 Bekasi/Jakarta); official sensors **pantaubanjir.jakarta.go.id** | Mode-gating flood zones |
| Razia / ganjil-genap / joki 3-in-1 culture | Police checkpoint + social workaround flavour |
| MRT/LRT construction squeezes arterials | Temporary barriers + lane drops |
| Social frictions (emak-emak, lawan arah, sudden putar balik) | Low-cite design flavour — telegraphed hazards |

## 3. KRL physical + operational (F3)

| Fact | Game use |
| --- | --- |
| **JR 205** dominant (~800 units), 8/10/12-car, **4-door + 6-door crush cars** (SaHa 204), ~54 seats + 90–120 standees | Hero train model; 6-door car = authentic crush set-piece |
| KAIC **red–yellow** livery | Material palette |
| Free corridor (real order): **Tanah Abang → Palmerah → Kebayoran → Pondok Ranji → Jurangmangu** (Rangkasbitung Line) | Exact free-trial station list |
| **Manggarai** ~230k daily transfers (multi-level) | Full-map climax |
| **Sudirman** ~17k pax/day, always crowded → SCBD | Finish / alight pressure |
| Fare: progressive **Rp 3.000 / 25 km + Rp 1.000 / 10 km** | Economy |
| Ticket: **KRL Access / KMT / e-money** | Entry UI |
| Door open side **right** at side platforms (this corridor) | Interior / platform interaction |
| Headway 3 min–1 h (peak vs off) | Wait tension |
| Open: door-dwell SOP, pax/m² crush numbers | Tunable game params |

## 4. Psychology / daily struggle (F4)

| Finding | Mechanic |
| --- | --- |
| Heat + crowd + delay + cost → **kelelahan mental** → **rasa tidak berdaya** (time stolen by traffic) [Kompas psychologist interview] | Mental fatigue meter + helplessness events |
| **Tim subuh**, **war tempat duduk**, **kayak pepes** | UI/meter language (authentic, not cartoon) |
| 4M daily in–out scale | World density / population feel |
| Rain + flood stack on top of delay | Weather as stress multiplier, not cosmetics |
| Moral load from corruption news / family pull | Optional “mental load” flavour ticks |
| Motor safety anxiety | Crash cost not just HP — **time + money + body** |

## 5. Routes & budgets (F5)

| Corridor | Backbone | Budget feel |
| --- | --- | --- |
| **Bintaro** | Rangkasbitung: Pondok Ranji **13.1 km** / Cisauk **26.1 km** → Tanah Abang; KRL **Rp 3–4k** | Free-trial teaching loop |
| **BSD** | Cisauk + **BSD Link** skybridge shuttle | Multimodal pin |
| **Depok** | Bogor Line → Sudirman/Dukuh Atas | Classic pejuang route |
| **Bekasi** | Cikarang loop; Sudirman ≈ **21.2 km** loop-odometer | Tol accident / delay cascade |
| Multimodal | Ojek + KRL + walk / TransJakarta | **~Rp 25–70k** and **55–110 min** door-to-door peak |
| Hubs | Manggarai **231k**, Tanah Abang **155k** transfers | Pressure points |
| Handoffs | Intrans Bintaro, BisKita Trans Depok | Live map pins |

---

## Design mandates (from evidence)
1. **Geometry first**: named arterials, real station order, busway as hard constraint.
2. **Obstacle, not race**: crawl speeds, queues, angkot stops, police, banjir.
3. **Rules as drama**: traffic light cycles, ganjil-genap, door timers, fares.
4. **Feel the budget**: clock, money (UMR-aware), mental fatigue, dignity in crowd.
5. **Social texture**: ojek, emak, pedagang, crowd metaphors in Bahasa Indonesia.
6. **Live map = real corridor**, not abstract minimap fantasy.

## Open questions
- Exact `lanes=*` per arterial & official signal timing sheets (OSM / Dishub follow-up).
- Door-dwell seconds & crush density standards (tune from video studies).
- Live ojek fare APIs (use static estimates for v1).

## Sources
Primary claim URLs live in `findings/F1.md`–`F5.md` (each claim has URL + date + confidence). Access date: **2026-10-18**.
