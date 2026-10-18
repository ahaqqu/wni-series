# DESIGN.md — WNI Pejuang Nafkah (Jakarta Commute Simulator)

**Version:** 2.0 (research-backed)  
**Date:** 2026-10-18  
**Evidence:** `research/jakarta-commute-sim/REPORT.md` + `findings/F1–F5.md`  
**Genre:** 3D Web **Commute Survival Simulator** — *not a racing game*

---

## 1. Player promise

> **Feel one real Greater Jakarta morning:** the same roads, the same people, the same rules, the same drain on body and mind — and still make it to work (or fail like a real day).

**Target feeling:** *capek tapi harus jalan* (tired but must go) · realism with light satire · tension from *time, money, crowd, weather, rules* — not from top speed.

**Primary verb:** **Filter & decide** (steer through legal/illegal gaps, stop at lights, board, brace).

---

## 2. What “real” means (authenticity pillars)

| Pillar | Must match reality | Source |
| --- | --- | --- |
| **Geometry** | Named corridors, lane topology, Semanggi levels, busway median | F1 |
| **Participants** | Angkot stop-anywhere, ojol weaving, TransJakarta islands, PKL, police | F2 |
| **Rail** | JR 205 look, 6-door crush car, real station order, door side, fares | F3 |
| **Psychology** | Mental fatigue, helplessness, dignity, *tim subuh / pepes / war tempat duduk* | F4 |
| **Budget** | Real km, IDR fares, 55–110 min door-to-door peak, hub crush points | F5 |
| **Rules** | Traffic lights, ganjil-genap, busway sterilization, door timers, razia | F1/F2/F3 |

**Non-goals:** top-speed racing, cartoon power-ups as “fun”, abstract endless runner without map, photoreal open world.

---

## 3. Core loop contract

> Player **filters / waits / boards** to reach **kantor (SCBD / Sudirman)** before **08:30**, while **traffic rules + social obstacles + weather + cost + mental fatigue** create risk; success pays **gaji + time saved**, failure costs **money, dignity, punctuality** and teaches the next attempt.

| Clause | Implementation |
| --- | --- |
| verb | Drag steer / filter · hold brake · hold brace (KRL) |
| objective | Live map + clock + fare spent + fatigue |
| pressure | Signal queues, angkot, razia, banjir, Manggarai crush |
| reward | On-time bonus (gaji), fewer fares, dignity intact |
| failure | Terlambat / nabrak / gagal naik / dignity zero |
| retry | Instant restart *same morning* (roguelike day), not arcade lives |

---

## 4. Dual mode design

### Mode A — Motorcycle (*Pengendara Motor*)

**Fantasy:** *Selip-selip* to the office on real arterials under real rules.

**Roads (named in HUD + map):**
1. **Free trial:** Bintaro corridor → **Jl. Raya Bintaro / Pondok Aren** connectors toward **Jl. Jend. Sudirman** approach (simplified but named).
2. **Full:** BSD (**Jl. Raya Serpong / BSD Link** feed) · Depok · Bekasi → **Golden Triangle**: **Jl. Gatot Subroto / H.R. Rasuna Said / Jl. Jend. Sudirman (4.1 km)** via **Semanggi**.

**Road metrics (authentic targets):**
- Arterial cross-section: **3–4 lanes + busway** (Sudirman) with **concrete busway separators** + median island haltes.
- Free-flow ~40–60 km/h · peak crawl **14–16 km/h** (filter speed ~15–25).
- Intersection: **signalised** with queue (~270 m worst-case class), **yellow box**, motorcycle advance stop line where marked.
- **Semanggi**: ground Sudirman + flyover ramps (visual height 6–11.5 m class).

**Obstacle families (all telegraphed):**
| Family | Behaviour | Mechanic |
| --- | --- | --- |
| Private cars / taxis | Queue, brake lights, lane change | Near-miss optional, collision costly |
| **Angkot** | **Stop anywhere** in-lane | Hard stop event |
| TransJakarta bus | Busway lane only; doors at island | Illegal entry → razia / collision |
| Ojol (ojek online) | Weave *sela-sela*, sudden cut-in | Lateral pressure |
| **Traffic light** | Red/amber/green + queue drain | **Must stop**; running red = fine + integrity |
| **Pos polisi / razia** | Periodic on arterials | Ganjil-genap / helmet / mirror checks |
| **Banjir** | Puddle / underpass depth | Grip loss or forced detour |
| PKL / pedestrians | Edge chaos | Sudden lateral hazard |
| Construction | Barriers | Lane drop |
| Police / ambulance | Occasional | Pull over / give way |

**Not a racer:** no nitro, no lap timer. Speed is a **consequence** of gaps and light state.

**Live map (motorcycle):**
- SVG/canvas strip: real corridor polyline (lat/lng polyline simplified), **named streets**, **traffic light nodes**, **banjir pins**, **police pins**, GPS-like “you are here”, ETA vs 08:30, fare/park cost accrual.
- Camera: chase, slightly low for bike POV option.

### Mode B — KRL (*Pejuang KRL*)

**Fantasy:** *Berdesakan* like a real morning car on the **Rangkasbitung Line** (trial) and Bogor / Cikarang feed (full).

**Physical (F3):**
- Train: **JR 205** stainless body, **red-yellow KAIC** livery, 8/10/12-car, **4-door + 6-door crush cars**.
- Interior: **straps (tsuriwa)**, long benches, **priority seats**, poles, LED route strip, windows.
- Platform: **yellow safety line**, tactile paving, **name board**, right-side door opening on this corridor.
- Operations: door timer, dwell, headway wait, announcement (“Perhatian…”, “Silakan…”).

**Real stations (free trial order is fixed):**
**Tanah Abang → Palmerah → Kebayoran → Pondok Ranji → Jurangmangu**  
*(Full: … → Manggarai (hub stress) → Sudirman / Dukuh Atas SCBD)*

**Mechanics:**
- Boarding: queue, **door timer**, crowd surge.
- In-train: inertia (gas/brake), **oxygen / crush**, **dignity**, handrail, *war tempat duduk*.
- Economy: progressive fare **Rp 3.000 / 25 km + Rp 1.000 / 10 km**.
- Live map: line diagram with **real station names**, train dot, “Berikutnya”, hub warnings.

---

## 5. Psychological systems (F4)

| System | Player experience | Tuning |
| --- | --- | --- |
| **Jam kantor** | Clock 05:30→08:30; leave-later = more pressure | Real peak windows 06–10 |
| **Kelelahan mental** (fatigue) | Heat + noise + delay drain it; low → worse control / screen edge vignette | Rises in padat merayap |
| **Rasa tidak berdaya** | Random “waktu dicuri macet” events (delay meters) | After queue / razia |
| **Biaya (UMR-aware)** | Ojek, parkir, fine, toll; running out of cash = worse options | F5 budgets |
| **Harga diri** | KRL crush, fall, miss door, kena marah | Dignity meter |
| **Tim subuh** | Early start option = fewer people, darker sky, more fatigue from waking | Optional difficulty |
| **Weather stack** | Hujan → grip, flood, longer ETA | F2 banjir |

Tone: Indonesian UI copy (*Macet total*, *Telat lagi*, *Naik kereta dulu deh*) — warm satire, not mockery of players.

---

## 6. World & art (stylized-authentic)

- **Low-poly but measured**: lane widths ~3–3.25 m, busway ~3.5 m, median islands, Semanggi ramps at authentic relative height.
- **Palette:** asphalt grey-blue, busway concrete, TransJakarta teal, KAIC red-yellow, ojek green, safety yellow.
- **Crowds:** mixed corporate (kemeja), ojek jackets, ibu-ibu, pelajar — high variety, low poly.
- **Landmarks:** Semanggi, Sudirman towers, Dukuh Atas, Manggarai multi-level, Bintaro shophouses, BSD modern blocks.
- **UI:** glass + transit-signage typography; map uses **real line colors** (Green Rangkasbitung, Red Bogor).

---

## 7. Live routing UI (both modes)

```
[ HUD top ] Jam · Gaji · Fatigue · Dignity · Biaya
[ Live map ] corridor polyline · station/street names · light pins · train/car marker · ETA
[ Play field ] 3D action
[ Bottom ] progress · next decision hint (e.g. “Lampu merah 40m”, “Pintu tutup 8s”)
```

Map data model (Phase 2):
- `routes/*.json`: ordered nodes `{ name, lat, lng, type: station|light|junction|halte|banjir|police|landmark }`
- Live position from run progress (0–1 along polyline).
- Free trial uses **Bintaro→Palmerah/Tanah Abang** JSON; full unlocks more corridors.

---

## 8. Free vs Full (Paywuz)

| Free | Full |
| --- | --- |
| Bintaro→Palmerah/Tanah Abang KRL | All stations → Sudirman/Dukuh Atas + Manggarai event |
| Short BSD/Bintaro motor trial | Full Golden Triangle + Semanggi + banjir network |
| Standard scooter / basic outfit | More bikes, outfits, difficulty *tim subuh* |
| Trial end → paywall | Persistent unlock |

---

## 9. Controls (unchanged accessibility)

| | Mobile | Desktop |
| --- | --- | --- |
| Motor | Swipe L/R · hold brake | Drag · hold LMB brake |
| KRL | Drag aisle · hold brace | Drag · hold brace |
| Shared | Tap map icons for next decision | Same |

---

## 10. Success criteria (playtest)

1. Player names a real road/station within 30s of play.
2. Average session feels like **struggle**, not speedrun joy.
3. Light / angkot / door timer cause **decisions**, not just dodge spam.
4. Fatigue + biaya create **second-order** choices (ojek now vs walk vs wait).
5. Scorecard: World + Rules + UI ≥ premium (≥2.3 avg) with **map authenticity** checklist green.

---

## 11. Authenticity checklist (QA)

- [ ] Station names/order match KRL line (trial: Tanah Abang→Palmerah→Kebayoran→Pondok Ranji→Jurangmangu)
- [ ] Busway is a **protected** lane, not decorative
- [ ] Traffic lights change and **queues form/drain**
- [ ] Angkot can stop **in lane**
- [ ] Ganjil-genap / razia appear as **events**
- [ ] Banjir affects **grip / route**
- [ ] JR 205 + 6-door car present
- [ ] Fare numbers use progressive formula
- [ ] UI language uses authentic commute metaphors
- [ ] Live map shows **named** places, not abstract nodes only
