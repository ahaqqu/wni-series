# design.md — Pejuang Nafkah

**Game design, experience design, art direction, and web design**
**Version:** 4.3
**Date:** 2026-10-19
**Status:** design baseline — game/checkout not started; pre-alpha landing page exists
**Companion docs:** [specs.md](specs.md) · [plan.md](plan.md) · [architecture.md](architecture.md) · [brand](brand.md) · [research protocol](research/PROTOCOL.md) · [research refresh](research/2026-10-refresh.md) · [live-data/Mayar research](research/2026-10-live-data-and-mayar.md)

> **Design thesis:** the commute is not the obstacle between home and work. The commute _is_ the day — including the day it goes sideways. Make it playable with one thumb, make it recognisable in five seconds, and make the player feel competent, seen, and a little lighter when they arrive with a story to tell.

---

## 1. The feeling

### 1.1 The promise

> _“Oh — ini sama kayak perjalanan gue tiap pagi.”_
> _(“Oh — this is exactly my morning commute.”)_

The player should recognise:

- the road they actually take, the lane that always jams, the light that always turns red;
- the station order, the door side, the yellow line, the announcement rhythm;
- the angkot that stops anywhere, the ojol that cuts in, the busway barrier;
- the heat, the rain, the crowd, the smell of coffee, the sound of the door chime;
- the small social negotiations: a seat, a strap, a queue, a stranger’s shoulder;
- the emotional arithmetic: leave earlier vs sleep longer, ojek now vs walk, late vs broke;
- the day the city interrupted the plan: the flood, the demo, the stopped train, the small fight — and the fact that people still got to work, joking about it.

And they should feel:

- **competent** — the gaps are readable, the controls are fair, the failure is explainable;
- **recognised** — the game knows this life, without pitying it;
- **amused** — the absurdity is affectionate, not cruel;
- **relieved** — arrival is a real exhale;
- **curious** — tomorrow is different, and there is another route to try;
- **surprised** — “wah, ada drama apa hari ini?” — rare enough to be a story, fair enough to retell.

### 1.2 What this is not

- Not a racing game. There is no nitro, no lap time, no “beat the city”.
- Not a misery simulator. We do not wallow in suffering or use poverty as a punchline.
- Not a management spreadsheet. Money matters, but the player feels it, not audits it.
- Not a theme-park “Indonesia” with gamelan and batik wallpaper. Specificity is earned through roads, language, behaviour, and small details.
- Not a power fantasy where the player “fixes” Jakarta. The city is a condition, not a boss.
- Not a disaster simulator or a news reenactment. Drama is real-basis, fictionalised, rare, and never built on a real victim.

### 1.3 Emotional arc of one commute

| Phase                       | Feeling                          | Design tools                                                       |
| --------------------------- | -------------------------------- | ------------------------------------------------------------------ |
| **Subuh** (04:30–06:00)     | quiet, reluctant, hopeful        | dark blue light, empty roads, phone alarm, coffee, family messages |
| **Berangkat** (06:00–07:00) | momentum, small joys             | engine, wind, sunrise, favourite song, a lucky green light         |
| **Padat** (07:00–08:00)     | tension, crowding, time pressure | traffic, queues, door timers, crowd density, rising fatigue        |
| **Krisis** (08:00–08:25)    | urgency, sacrifice, dark humour  | delay, rain, missed train, risky shortcut, a kind stranger         |
| **Sampai** (08:25–08:35)    | relief, exhaustion, dignity      | office lobby, lift, AC, a quiet moment, report card                |
| **Pulang** (optional)       | release, reflection              | reverse commute, night lights, a call home, a small treat          |

The game should let the player **linger** in the quiet moments and **panic** in the tight ones, then give them a breath.

A major drama is not part of every arc. When it happens, it cuts across the phase table: the plan changes, the clock gets tighter, and the story becomes “hari ini ada drama”. The emotional target is not constant chaos; it is the relief of a day that could have gone worse, told with a laugh.

---

## 2. Design pillars

1. **Real places, real rules, real consequences.** Authenticity is the content.
2. **One thumb, one decision at a time.** The interface disappears into the hand.
3. **Struggle with agency.** Every obstacle has a readable counterplay; every failure teaches.
4. **Warmth over misery.** The tone is dry, human, and affectionate.
5. **Short legs, long days.** 5–15 minute runs; a week of small stories.
6. **The player is a commuter, not a hero.** No chosen one, no power fantasy.
7. **Beauty in the mundane.** Sodium light, rain on a visor, a station at dawn.
8. **Fair free, honest paid.** The free game is the game.
9. **Performance is part of the fantasy.** A stutter breaks the spell.
10. **Built to be replayed, not ground.** Daily seeds, different weather, different choices.
11. **Drama is rare, real, and retold.** The city interrupts the plan; the character shrugs, jokes, and finds a way; the player leaves with a story.

---

## 3. Core loop

### 3.1 The run loop

```text
PLAN  →  MOVE  →  READ  →  [DRAMA?]  →  DECIDE  →  FEEL  →  ARRIVE  →  REFLECT / SHARE  →  RETRY / NEXT
```

- **Plan:** choose route, mode, departure time, budget. Free/All Maps players use authored conditions; Live players get a timestamped traffic/weather/incident snapshot and a crowding estimate, then freeze it for the run.
- **Move:** auto-forward (motor) or train motion (KRL); the player controls lateral position, braking, bracing, boarding.
- **Read:** scan the road/crowd for telegraphs: brake lights, turn signals, angkot door, yellow line, door light, crowd pressure.
- **Drama?** rarely, the run interrupts the plan: water across the underpass, cones and a demo, a stopped train, a crowd argument. The drama is telegraphed and frozen into the run; the player chooses a response, not a reflex.
- **Decide:** one-thumb action with a clear risk/reward.
- **Feel:** audio/visual/haptic feedback; the world responds; resources tick.
- **Arrive:** the office/station/transfer; a short beat of relief.
- **Reflect:** report card, a “Cerita hari ini” line, a local share card.
- **Retry:** same seed to learn, or new seed for variety.

### 3.2 The day loop

- 1–3 legs (motor, KRL, walk/ojek) form a commute.
- The day has a clock, a budget, a body, a mind, and a dignity state.
- The player can stop after any leg; the day saves.
- At the office, a short “day at work” vignette (messages, coffee, a meeting) closes the loop without becoming a second game.
- The evening return is optional and shorter; it changes the next morning’s resources.

### 3.3 The week loop

- A week of commutes = a chapter.
- Rent/family obligations, a recurring cast, a small goal (save for a new helmet, fix the bike, get to Friday).
- Weekly report: punctuality, spending, sanity, a story headline (“Minggu ini kamu selamat.”).
- No punitive streak loss; missed days become narrative, not failure.

### 3.4 The series loop

- New corridors, new games, shared account/entitlements.
- A “WNI Series” passport: stamps for places/commutes; cosmetic, not competitive.

---

## 4. Dual mode design

### 4.1 Motor mode — “Selip”

**Fantasy:** _You know the gaps. You know which lane moves. You know the light cycle by heart. You are not faster than the city; you are more fluent in it._

**Camera:** third-person chase, slightly high and behind, with a low “visor” variant. Portrait-first; landscape adds peripheral vision. Camera leans into turns, dips on braking, shakes on potholes. FOV widens slightly with speed, never enough to distort.

**Speed model:** auto-throttle; the player does not hold “gas”. Base speed is a consequence of traffic density and lane choice. Free-flow on an open arterial is a rare, earned pleasure; most of the time the player is filtering at 15–25 km/h in a 14–16 km/h crawl. No speedometer as a hero number; the hero number is **ETA**.

**Core verbs:**

| Gesture                                    | Action                                     | Notes                                                                            |
| ------------------------------------------ | ------------------------------------------ | -------------------------------------------------------------------------------- |
| Drag left/right anywhere in the lower half | steer / change lane / filter               | relative drag, not absolute position; forgiving dead zone                        |
| Hold                                       | brake                                      | brake assist option; release to resume                                           |
| Quick swipe up                             | “lihat jauh” / look ahead                  | optional camera nudge; no gameplay advantage                                     |
| Tap hazard marker                          | inspect/decide (e.g., flood depth, police) | optional, not required while moving                                              |
| Double-tap                                 | horn                                       | social tool; can annoy NPCs, rarely helps, sometimes opens a gap; no spam reward |

**Lane grammar:** 3–4 mixed lanes each way + protected busway + median. The “informal third lane” near the gutter is real but risky. Filtering between cars is faster but raises near-miss and collision risk. The player chooses **flow vs safety vs legality**.

**Obstacle families:**

1. **Cars** — queue, brake lights, sudden lane changes, doors opening.
2. **Angkot** — stops anywhere, door open, passengers crossing; the signature hazard.
3. **Ojol** — weaves, looks at phone, sudden U-turn; a mirror of the player.
4. **TransJakarta bus** — protected lane, island stops, pedestrians crossing to the island; illegal entry → fine/razia.
5. **Traffic lights** — long cycles, yellow box, queue drain; running red = fine + safety.
6. **Pedestrians/PKL** — sidewalk spill, carts, school zones; slow, telegraphed.
7. **Rain/flood** — grip loss, visor fog, underpass closure; route decision.
8. **Police/razia** — helmet, mirror, plate, busway; pull over or detour.
9. **Construction** — lane drops, barriers, steel plates.
10. **Emergency vehicles** — give way for a small social reward; messy lane parting.
11. **Broken-down vehicles** — lane blockage, no warning triangle.
12. **Taxis/ojek pickups** — sudden stop at the curb.

**Counterplay:** every hazard is telegraphed by at least two channels (visual + audio/road texture). The player always has a legal/safe-ish option, even if it costs time. No unavoidable damage.

**Scoring axes:** on-time, safety (near-miss/crash), calm (horn/rage/fatigue), cost (fuel/fine/parking), dignity (helping, not bullying). The report card names the story: “Selip rapi”, “Ngebut dikit, telat juga”, “Baik hati di lampu merah”.

**Failure:** late, fine, minor crash (fade to black, recovery choice), flood stall, fuel empty. No battery mechanic; too punitive.

**Content model:** corridor ribbons (not open world). Each corridor is a sequence of 300–800 m “blocks” with a signature landmark, a hazard pattern, and a decision gate. Blocks are assembled from a library but keyed to real geography.

### 4.2 KRL mode — “Berdesakan”

**Fantasy:** _You know which car is emptier, which door opens at the exit, which transfer is worth the walk. You are a small expert in a very large crowd._

**Camera:** first-person or close third-person inside the carriage; portrait-first. Head sway, train acceleration/braking, crowd compression. On the platform, a wider view of the yellow line, the queue, the train arrival.

**Core verbs:**

| Gesture                      | Action                                  | Notes                                        |
| ---------------------------- | --------------------------------------- | -------------------------------------------- |
| Drag left/right              | move through the aisle / shift weight   | collision with crowd; polite vs push         |
| Hold                         | brace (strap/pole/door frame)           | reduces fall risk during braking; grip meter |
| Tap door / swipe toward door | board / alight                          | timing window; alighting-first rule          |
| Tap a seat                   | sit / offer seat                        | social choice; dignity/energy trade          |
| Swipe up/down                | look up/down (route strip, feet, phone) | diegetic info; optional                      |
| Tap phone                    | check messages / next station           | brief focus; can miss a cue                  |

**Boarding loop:**

1. Train arrives; door position is telegraphed by the platform and the car marker.
2. Queue behind the yellow line; alighting passengers first.
3. Door opens; a short window (3–8 s) to board; crowd surge.
4. Choose: door area (crowded, easy exit), pole zone (stable), strap zone (balanced), seat (rare, social cost).
5. Door closes; brace; the train moves.

**In-train loop:**

- Crowd density rises at each station; the player’s position affects fatigue, dignity, and exit speed.
- Braking/acceleration events; holding a strap/pole prevents a fall; not holding risks a stumble/dignity hit.
- Seat decisions: sit (energy, but maybe give up for an elderly/pregnant passenger → dignity), stand (tired), lean (risky).
- Social events: someone needs a seat, a pickpocket attempt, a crying child, a street musician, a commuter asleep on your shoulder, a seat war.
- Transfer: at Tanah Abang/Manggarai, choose platform/walk; wrong choice costs time; signage is real.
- Alight: door side, queue, platform exit, last-mile choice.

**Physicality:** the train’s sway is rhythmic; the crowd has weight; the strap has tension; the door chime is a deadline. Haptics (where supported) pulse on braking and door close. The screen subtly compresses in a crush (optional; reduced-motion safe).

**Scoring axes:** on-time, safety (fall/crush), calm (panic/dignity), cost (fare/top-up), dignity (seat ethics, not pushing). Report card: “Berdesakan tapi tenang”, “Kursi didapat, hati-hati”, “Tim subuh”.

**Failure:** missed stop, door close, fall, pickpocket, panic attack? Handle panic with a breathing mini-interaction, not a fail state. Late arrival is soft failure.

**Content model:** station-to-station legs with real order, side, platform type, headway, crowding profile. The free trial is **Jurangmangu/Pondok Ranji → Tanah Abang → Sudirman/BNI City**; the full game adds Manggarai/Bogor/Bekasi hub stress.

### 4.3 Multimodal — “Satu hari, banyak kendaraan”

The canonical Pejuang Nafkah route:

```text
Home (Bintaro) → motor/ojek → Jurangmangu or Pondok Ranji
→ KRL Green Line → Tanah Abang
→ transfer/walk → Sudirman/BNI City
→ walk/ojek → SCBD office
```

**Design rules:**

- Each leg is playable; transitions are short, diegetic, and one-hand.
- Time, money, body, mind, and dignity carry across legs.
- The player can change plan mid-route (e.g., alight early, take ojek, walk) if time/money allow.
- The best route is not always the fastest; it depends on weather, crowding, budget, and the player’s state.
- The game never says “optimal route”; it says “this is what you chose, and here is what it cost.”

**Handoff micro-beats:**

- parking the bike (find a spot, lock, walk);
- buying/top-up the e-money card (queue, balance);
- the platform walk (escalator, crowd, signage);
- the transfer (Manggarai/Tanah Abang);
- the last mile (heat, sidewalk, lobby security).

These are 20–60 second interactions, not full mini-games. They are where the commute’s texture lives.

---

## 5. Systems

### 5.1 Clock and punctuality

- Office start: 08:30 (configurable 08:00/09:00 for difficulty).
- Real peak windows: 06:00–09:00. The game compresses time ~4–8× during travel; waits are real-time-ish to create tension.
- The HUD shows `07:42 · kantor 08:30 · 48 mnt` — ETA is the hero number.
- Late is graded: 1–5 min (“masih aman”), 6–15 (“HRD tanya”), >15 (“besok lebih awal”). No instant game over.
- The player can choose a later start for more sleep but higher risk; the trade-off is explicit.

### 5.2 Money

- Daily wage is based on UMP DKI 2026 (Rp 5,729,876/month → ~Rp 260k/day), but the game uses a **daily budget** rather than a full salary simulation.
- Costs: KRL fare, TransJakarta, ojek, fuel, parking, toll, fines, coffee, rain poncho.
- The player sees rupiah, not abstract coins. “Rp 12.000 = nasi uduk + kopi” is a real trade-off.
- Running out of money is a soft lock: walk, ask a friend, take the cheapest option, or accept being late. Never a paywall.

### 5.3 Body, mind, dignity

Three meters, each with a clear cause and effect:

| Meter                    | Rises from                                             | Falls from                                      | Effect                                              |
| ------------------------ | ------------------------------------------------------ | ----------------------------------------------- | --------------------------------------------------- |
| **Tenaga** (body)        | walking, standing, heat, pushing, rain                 | sitting, coffee, food, rest, AC                 | control wobble, slower movement, higher injury risk |
| **Kepala** (mind)        | noise, crowding, delays, phone news, conflict          | quiet, music, kindness, breathing, arrival      | tunnel vision, worse decisions, panic events        |
| **Harga diri** (dignity) | being pushed, falling, scolded, pickpocket, seat guilt | giving a seat, helping, being thanked, arriving | social confidence, dialogue options, report card    |

- Meters are **not health bars**. They are story states. Low dignity triggers quiet, human moments, not a “game over”.
- Recovery is diegetic: a coffee, a seat, a kind message, a breath, a joke.
- The game never shames the player for being tired or poor.

### 5.4 Safety

- Near-miss meter, not gore. A crash fades to black and offers recovery.
- Safety score rewards patience, signals, giving way, and helmet/visibility choices.
- The game explicitly says: “Fiksi. Di dunia nyata, patuhi aturan.” Do not make illegal riding look consequence-free.

### 5.5 Score and report card

Five axes:

1. **Tepat waktu** — arrival vs deadline.
2. **Selamat** — collisions/near-misses/falls.
3. **Tenang** — mental state, conflict, panic.
4. **Hemat** — spend vs budget.
5. **Bermartabat** — social choices, kindness, self-respect.

Total score is a weighted sum, but the **report card** is the emotional payload:

```text
RAPOR PERJALANAN — Senin, 19 Okt 2026
Jurangmangu → Sudirman · 06:12–07:41 · Rp 9.500
Tepat waktu  B+   Selamat  A-   Tenang  C+   Hemat  B   Dignity  A
“Kamu memberi kursi ke ibu hamil. KRL tetap penuh. Kamu sampai.”
```

- Grades are explainable; tapping a grade shows the events that caused it.
- Share card is generated locally; no PII; optional watermark.

### 5.6 Difficulty and assists

- **Mode Santai:** more space, slower traffic, clearer telegraphs, forgiving door timers, brake assist, no fines for minor mistakes.
- **Mode Pejuang:** the intended experience; real-ish density, tighter timers, harsher costs.
- **Mode Subuh:** start earlier, fewer crowds, darker, but sleep/fatigue penalty; optional.
- Assists are not “cheats”; they are accessibility. They do not affect leaderboard eligibility (separate boards or a flag).

### 5.7 Daily seed and variation

- The daily seed is `date + route + mode + contentVersion` hashed; all players get the same base scenario.
- Variation: weather (clear/rain/flood), small kejadian, rare drama (see §5.11), a “lucky” event, a social encounter, a road closure.
- Personal variation comes from decisions, not random punishment. Drama selection is seeded and frozen at run start; it is never a mid-run gotcha.
- Weekend seeds: lighter traffic, family errands, “pulang” mood.
- No live-service FOMO; the daily challenge is a reason to return, not a punishment for missing.

### 5.8 Progression

- **Commute familiarity:** playing a route unlocks small, diegetic knowledge (a shortcut marker, a station exit tip, a “known gap”), not raw stats.
- **Relationships:** recurring characters remember you; small favors unlock dialogue and cosmetics.
- **Bike/card/outfit:** sidegrades and cosmetics; no pay-to-win.
- **Passport:** stamps for corridors/stations; collection, not competition.
- **Weekly chapter:** a small narrative arc; completes in 5–7 days, not 5–7 weeks.

### 5.9 Leaderboards

- Categories: **Tepat Waktu**, **Paling Tenang**, **Paling Hemat**, **Paling Bermartabat** (and total).
- Daily/weekly/all-time; route/mode filters.
- Server-validated; top 100 require replay validation.
- Display name + avatar only; no location; no chat. Names are moderated for abuse.

### 5.10 Economy of attention (anti-dark-pattern)

- No energy, lives, timers, or “streak freeze” purchases.
- No notification spam; at most one optional “hari ini sudah siap” local notification if the user opts in.
- No “return in X hours” gating.
- No pre-checked consent; no hiding the free option.

### 5.11 Drama system

**Purpose.** Drama is the freshness and memory engine. It gives the player a reason to wonder “wah, ada drama apa hari ini?”, a story to retell, and a reason to share. It is not a difficulty spike and not a misery generator.

#### Layers

| Layer            | Target frequency            | Role                                          | Examples                                                                                                     |
| ---------------- | --------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Kejadian**     | 1–3 per run                 | Texture; small, low-stakes, often funny       | Card reader rejects, queue jump, strap tangles, angkot stops in-lane, forgotten helmet                       |
| **Drama**        | ~1 in 5 runs; max 1 per run | Changes the plan; creates the day's story     | Flooded underpass, permitted demo, minor accident congestion, signal failure, market crowd pinch             |
| **Drama langka** | ~1 in 25 runs               | Once-in-a-while city moment; highly shareable | A rare combination (heavy rain + road closure + power outage) or a once-a-season event, always fictionalised |

These are starting hypotheses, not locks. Tune after the frequency test; never add a pity timer that makes drama feel scheduled.

#### Selection and determinism

- Selected at **run start** from `runSeed + contentVersion + route + mode + departure time + weather + conditions`.
- Frozen for the run; no server push, no mid-run random event, no network needed.
- At most one major drama per run; the same major drama does not repeat within 5 runs on the same route.
- The daily seed gives all players the same **base** drama opportunity; personal choices and skill change the outcome, not the card.
- Each run pins the daily pack version (when daily drama is live); a pack update never changes an in-progress run.
- Live data may change the **conditions** (rain, incident probability) at generation time; it never rewrites a scored run.

#### Daily rhythm (Phase 2D)

The daily layer is editorial, not a live feed.

- **00:00 Asia/Jakarta:** a scheduled agent researches recent public events and drafts 3–10 anonymous candidates. It writes to a review queue only; it has no production publish credential.
- **Owner review:** the owner selects, comments, requests regeneration, and approves each card, then the pack. A revision never inherits approval.
- **Approved pack:** `daily-YYYY-MM-DD` with a signed manifest, content hash, `publishedAt`, `expiresAt`, and an approval record. A run pins the pack version.
- **Daily Challenge:** the approved headline drama is guaranteed in the Daily Challenge, clearly labelled “Drama hari ini”. Normal runs use the same pack with the usual rarity, so the daily layer adds freshness without turning every commute into chaos.
- **No approved pack:** the game serves the last approved pack or the evergreen bank. The daily job failing is a skipped day, not a broken run.
- **No auto-publish:** a timer cannot publish. Publishing is an authenticated owner action with 2FA, an approval record, and an audit entry.

The agent may be creative in the **writing**, but the facts, anonymity, and ethics checks are constraints. Full pipeline: [ADR-0006](../../adr/0006-daily-drama-pipeline.md) and [daily drama research](research/2026-10-daily-drama-pipeline.md).

#### Real basis, fictional detail

Every card carries:

```json
{
  "id": "drama-flood-underpass-01",
  "family": "flood",
  "rarity": "drama",
  "realBasis": "Recurring flash flooding at a low-lying underpass on the corridor",
  "sourceIds": ["src-bpbd-flood-2026", "src-news-flood-underpass-2025"],
  "retrievedAt": "2026-10-19",
  "confidence": "high",
  "fictionalised": "Composite location detail and timing; no real victim or event reconstruction",
  "sensitivity": "low",
  "conditions": { "weather": ["heavy-rain"], "time": ["05:30-09:00"] },
  "telegraph": "Water line, stalled motorbikes, riders turning back",
  "choices": ["wait", "detour", "push-through-slowly", "ask-for-help"],
  "bangLines": ["Kolam renang gratis. Sayangnya bukan hari libur."],
  "shareHeadline": "Underpass jadi kolam. Muter, telat, sampai."
}
```

No card ships without `realBasis`, ≥2 `sourceIds`, a `fictionalised` note, and a sensitivity review. See [ADR-0005](../../adr/0005-drama-system.md) and the [source-bank plan](research/2026-10-drama-system.md).

**Hard exclusions:** real recent tragedy (default 12 months), identifiable victims/bystanders, mass-casualty events, terrorist attacks, communal/religious/ethnic blame, graphic injury, real person's name/likeness, disaster tourism, comedic rescue.

#### Fairness

- **Telegraph before commitment:** the water line, the cones, the crowd swell, the brake lights, the station announcement. The player should be able to say “I saw that coming”.
- **At least two readable responses**, and at least one viable out. Costs are bounded: time, money, dignity, or fatigue.
- **No unwinnable drama.** A bad choice can hurt the grade, not delete the run.
- **No QTE-only drama** and no precision tap in the top third; it must work one-handed on a moving train.
- If the player ignores every telegraph, the consequence is still explainable on the report card.

#### Response verbs

| Verb            | What it does                        | Cost       | Reward                    |
| --------------- | ----------------------------------- | ---------- | ------------------------- |
| **Santai**      | Accept the delay; protect calm      | Time       | Tenang, dignity           |
| **Akal**        | Detour, reroute, negotiate, fix     | Money/time | Tepat waktu, mastery      |
| **Bantu**       | Help someone in the mess            | Time       | Bermartabat, relationship |
| **Bercanda**    | Break the tension with a small joke | Small time | Tenang, social beat       |
| **Putar balik** | Retreat to a safer plan             | Time       | Selamat, no shame         |

The player may also do nothing. Silence is a valid response; the game does not force a punchline.

#### Character and tone

- Bang Nafkah names the absurdity, shrugs, and offers the next move: “Bercanda dulu, panik belakangan.”
- The joke comes **after** the player understands the problem, never instead of the problem.
- A serious beat (injury, someone in distress) gets warmth or silence; no quip, no score pop-up.
- The character never blames a crowd, a worker, a religion, or an ethnicity for the drama. The system, the weather, the city, and the situation are fair targets.

#### Memory and sharing

- Report card: **“Cerita hari ini”** headline + drama stamp + the Bang line.
- **Cerita** journal: unlocked drama stories, replayable, no gacha.
- Weekly recap: “Drama minggu ini” — a short, shareable summary.
- **Share card:** generated on-device after arrival; 1:1 and 9:16 variants; route corridor, drama type, grade, headline, “Gitu aja terus setiap hari.”
  - Web Share API where available; download/copy fallback.
  - No upload, no account, no public feed, no UGC in v1.
  - No precise home/work pin, real name, photo, or provider data. Corridor-level only.
  - Text fallback if image generation exceeds the low-end budget.

#### Monetization

Drama is part of the free game. It is never sold, never gated by All Maps/Live, never a gacha. Cosmetics may style the share card; they do not change the drama.

#### Content operations

- Source bank refreshed before each city/season release; a stale source is a red gate.
- Kill list and correction/takedown path; a card that ages badly can be disabled by content flag without a code release.
- Native + sensitivity review recorded in the content pack.
- Frequency/fairness/recall test with 8–12 players before content lock.

---

## 6. World and content

### 6.1 Launch map

**Free corridor (complete):**

- Bintaro/Jurangmangu/Pondok Ranji → Tanah Abang → Sudirman/BNI City → SCBD last mile.
- Motor: Jl. Raya Bintaro / Pondok Aren / Ciputat Raya connectors → Jl. Jend. Sudirman approach.
- KRL: Rangkasbitung/Green Line station order, right-side doors at side platforms; Tanah Abang transfer; Sudirman/BNI City alight.
- Multimodal: the canonical route above.

**All Maps corridors (Rp 79,000 once):**

- **BSD:** Cisauk/BSD Link → Tanah Abang → Sudirman; motor via Jakarta–Serpong/JORR.
- **Depok:** Depok/Depok Baru → Manggarai → Sudirman/BNI City; motor via Depok–Antasari/Jagorawi.
- **Bekasi:** Bekasi → Jatinegara/Manggarai → Sudirman/BNI City; motor via Becakayu/JORR Cikunir.
- **Hub set-pieces:** Manggarai (multi-level transfer, 230k+ daily transfers), Tanah Abang (155k+ transfers), Semanggi, Dukuh Atas.
- **Tim subuh** variants and weekend/pulang routes.
- **Phase 3 city maps:** Bandung, Surabaya, Yogyakarta (candidates) are included in All Maps when released.

**Free route choice:** at first launch, the player picks one corridor from the available map catalogue. Phase 1 has one corridor (Bintaro/Jurangmangu ↔ Sudirman); Phase 2 adds the catalogue so the choice is meaningful. One courtesy change is allowed within 14 days. The free route includes all modes and the complete loop, but not Live data.

### 6.2 Map and route UI

- **In-game live map:** SVG/canvas strip, not a generic minimap. Real corridor polyline, named streets/stations, light pins, flood/police pins, “you are here”, ETA vs 08:30. On Live, the strip can show a snapshot traffic/rain/incident layer with `as of` time; it is not navigation.
- **Route planner:** a “transit board” with time, cost, transfers, crowding risk/estimate, and a simple “ini rute kamu” confirmation. No spreadsheet. Live adds a real-trip planner that compares departure windows from the same snapshot.
- **Station diagram:** line colour, station codes, next station, door side, transfer icon.
- **World map (marketing):** a beautiful, motion-designed isometric/route map of Jabodetabek, not a game minimap. Use real geography, simplified.

### 6.3 Time, weather, light

- Time of day drives colour, traffic, crowd, and sound. Dawn blue → sodium orange → harsh white → rain grey → night amber.
- Weather is a system, not a particle effect: rain reduces grip, increases ojek prices, fills underpasses, changes KRL choice, and makes the visor a canvas.
- Heat shimmer, wet asphalt reflections, fog, and light shafts are the visual signature.

### 6.4 Live data and the real-trip planner

**Promise:** “Mainkan pagi ini dengan kondisi pagi ini — lalu pakai rencananya untuk perjalanan nyata.” The subscription is useful, not a second game.

**Snapshot model:** when a Live player starts a briefing, the server returns a frozen snapshot: traffic delay/incidents (TomTom), weather/nowcast (BMKG), crowding/transit estimate, source timestamps, confidence, and expiry. The run uses that snapshot; no mid-run network dependency and no score advantage from a changing feed. The planner can request a fresh snapshot later.

**Briefing UI:**

- one-line verdict: “Hujan mulai 06:20. Tanah Abang padat. Alternatif: berangkat 06:05.”
- corridor cards: ETA, cost, transfers, crowding estimate, confidence, `as of`.
- explicit `Live` / `Estimasi` / `Stale` chips; never a fake live badge.
- “Rencanakan perjalanan nyata” button.

**Planner:** compare up to three departure windows on the selected corridor; show time/cost/comfort trade-offs and the assumptions. It is a planning aid, not turn-by-turn navigation. No GPS permission; the user picks a known corridor/origin/destination from the catalogue.

**In-run:** only the frozen snapshot. Live traffic can change the authored event probabilities at generation time, not mid-run. If the network drops, the run continues from the cached snapshot.

**Post-run:** “Yang berubah” card compares the snapshot with the next snapshot (if available); “Rencana nyata” repeats the plan and a disclaimer.

**Crowding:** modelled from time/direction/headway/weather/calendar/incidents plus opt-in rider reports. Label `Estimasi` and show confidence. True live occupancy is a future operator partnership, not a launch promise.

**Attribution:** TomTom for traffic/incidents; BMKG for weather/nowcast; Open-Meteo/PetaBencana only when licensed. Attribution is visible in the briefing and legal/data pages.

**Subscription ethics:** cancel in two taps; show renewal date; no fake urgency; Live is optional; free and All Maps still work if Live is unavailable. Cost-aware degradation: if the provider budget is exhausted, show cached data with a stale label rather than a broken screen.

### 6.5 Events and drama

- **Drama is the headline event layer.** Kejadian provide texture; drama changes the plan; rare drama becomes the story of the week. Full system: §5.11.
- **Composite, not documentary:** a flood card is a plausible composite of known points, not a specific recent tragedy. No real victims, no real accident recreations.
- **Telegraphed:** the player sees the water line, the queue, the police cones, the crowd swell before committing.
- **Counterplay:** detour, wait, pay, ask, walk, turn back. There is always a choice, even if all choices cost something.
- **Stories, not loot:** event outcomes create a “Cerita hari ini” line, a relationship beat, a share card, or a new route marker.
- **Rarity is content:** not every run gets a drama. The absence is part of the rhythm; the presence is the story.
- **Daily pack:** when daily drama is live, an owner-approved pack adds a featured story for the Daily Challenge and fresh cards for normal runs; an unapproved or missing pack falls back to evergreen. No auto-publish.

### 6.6 Characters and narrative

Recurring cast (small, optional, non-intrusive):

- **Pak Slamet** — ojol driver, philosopher, knows every back road; offers a ride when you’re stranded (costs money or a favor).
- **Bu Wati** — coffee vendor at the station; remembers your order; a small daily ritual.
- **Dimas** — coworker, always late, always cheerful; a mirror and a friend.
- **Sari** — HRD; the punctuality clock has a human face, not a villain.
- **Mas KRL** — the commuter who always gets the seat; a running joke that becomes a small story.
- **Ibu** — family messages; the reason for the commute; never a guilt meter.

**Narrative delivery:** short cards before/after a run, phone messages, station posters, overheard lines, a weekly chapter. No long cutscenes during one-hand play. All story content skippable and replayable.

### 6.7 Tone, slogans, and copy

**Series line:** **“Susahnya nyata, dramanya gratis.”**
**Long line:** **“Jadi WNI itu susah. Untung di game bisa di-pause.”**
**Game line:** **“Berangkat. Berjuang. Sampai. Gitu aja terus setiap hari.”**
**Support:** “Bukan balapan. Ini perjalanan menuju gajian.” / “Satu jempol. Satu tujuan: gajian.”

- **Voice:** Jakarta Indonesian, dry, warm, code-switching natural (“udah telat, hujan pula”). Not forced meme-speak.
- **Humor:** observational, self-deprecating, never punching down. The joke targets the situation, the system, or the narrator’s own optimism — not the poor, women, disabled people, minorities, or real victims.
- **Punchline, then warmth:** one joke per beat; after the laugh, land on something human. Example: “Angkot berhenti di tengah jalan. Katanya cari penumpang. Kita semua cari nafkah.”
- **Sadness:** quiet, specific, no melodrama. A serious failure gets no punchline. Example: “Kamu sampai. Sepatu basah. Rapat jam sembilan.”
- **Respect:** never call the player stupid; never call commuters “NPC”; never make poverty a joke.
- **Bilingual:** Indonesian primary; English secondary with local terms preserved/glossed.
- **Bang Nafkah:** the narrator/brand face. Tired, observant, funny; the voice in the player’s head, not the player. Catchphrases: “Gitu aja terus setiap hari.”, “Bercanda dulu, panik belakangan.”, “Drama boleh. Panik jangan.”, “Gajian dulu.”, “Kursi kosong itu mitos.”, “Yang penting sampai.” Full rules: [brand.md](brand.md).
- **No forced laughter:** the player can be tired, quiet, or angry. Humour is an invitation, not a demand.
- **Drama tone:** the character meets drama with bercanda dan santai, not denial. The joke is a breath before the practical move, never a substitute for it. A serious beat gets silence or kindness. See §5.11.
- **Tone layer:** the website uses a “sodium dawn + warung sticker” layer: highlighter series line, sambal “Gitu aja terus setiap hari.” punchline, ticker, drama stamps, a single Bang Nafkah card, and the “Tidak ada jebakan. Kecuali macet.” pricing heading. Serious data/payment/legal sections stay straight. See §10.5a and [brand.md](brand.md).

**Sample copy:**

| Moment       | Copy                                                               |
| ------------ | ------------------------------------------------------------------ |
| Loading      | “Menyiapkan perjalanan…” / “Nunggu angkot dulu.”                   |
| Late 3 min   | “Telat tiga menit. Masih bisa bilang ‘macet’.”                     |
| Door closing | “Pintu mau tutup. Pilih: masuk, atau tunggu kereta berikutnya.”    |
| Low dignity  | “Ada bahu orang asing di lehermu. Kamu diam saja.”                 |
| Arrival      | “Sampai. Capek. Tapi sampai. Gitu aja terus setiap hari.”          |
| Drama        | “Banjir, demo, dan motorku mati. Sampai juga.”                     |
| Report card  | “Hari ini kamu tidak menang. Kamu berangkat. Itu sudah sesuatu.”   |
| Purchase     | “Sekali bayar. Tidak ada iklan. Tidak ada jebakan. Kecuali macet.” |

---

## 7. One-hand UX

### 7.1 Layout

Portrait, 390×844 reference:

```text
┌─────────────────────────────┐
│ clock / ETA / money         │  top 10% (read-only)
│ route strip / next station  │
├─────────────────────────────┤
│                             │
│         3D WORLD            │
│      (no essential taps)    │
│                             │
├─────────────────────────────┤
│ body / mind / dignity       │  bottom 25% (read-only)
│ [ BRAKE ]   [ MOVE PAD ]    │  bottom 25% (interactive)
│ [ optional contextual ]     │
└─────────────────────────────┘
```

- The top third is **read-only**; no required taps.
- Thumb arc: primary action within 60° of the bottom corner, ≥64 px.
- Left/right hand mirror flips the cluster; haptics/sound confirm.
- Safe-area insets for notch/home indicator; no UI under the keyboard.
- Landscape: HUD moves to sides; same gestures; never required.

### 7.2 Gesture vocabulary

Keep it to **four** core gestures:

1. **Drag** (steer/move).
2. **Hold** (brake/brace).
3. **Tap** (contextual: board, sit, inspect).
4. **Swipe** (look/phone/door).

No pinch, no two-finger, no long-press menus during play. Pause is a single tap on a fixed corner button, not a gesture.

### 7.3 Assist and forgiveness

- Input buffering ~120 ms.
- Steering has a small dead zone and a soft return; no drift.
- Brake assist prevents rear-ending at low speed if the player reacts late (optional).
- Gap highlight pulses the safe gap in “Santai”; subtle in “Pejuang”.
- Door-timer warnings use audio + a large visual bar; never a surprise.
- If the player’s thumb leaves the screen, the game does not jerk; it holds the last input briefly and decays.

### 7.4 Interruption and resume

- Auto-pause on tab hide, call, notification, Bluetooth disconnect, or 2 s of no input in a menu.
- Resume restores the exact simulation frame, camera, and audio state.
- The “Lanjutkan” button is the largest element on screen.
- If the app is killed, the run is restored from the last checkpoint (every 10 s or at each beat).

### 7.5 Desktop and keyboard

| Action      | Touch      | Keyboard   |
| ----------- | ---------- | ---------- |
| Steer/move  | drag       | A/D or ←/→ |
| Brake/brace | hold       | Space      |
| Context     | tap        | E/Enter    |
| Look/phone  | swipe      | Q/Shift    |
| Pause       | tap corner | Esc/P      |
| Mute        | settings   | M          |

Desktop gets a wider camera, optional 16:9 HUD, and a “cinematic” mode for screenshots. No desktop-only mechanics.

---

## 8. Game feel

### 8.1 Camera

- **Motor:** damped follow, lean, look-ahead, speed FOV, subtle handheld noise; no shaky-cam nausea. Collision hitstop 80 ms max.
- **KRL:** first-person head at 1.65 m; train sway; crowd parallax; occasional glance down at phone; no free-look during a brace (keeps one-hand focus).
- **Arrival:** a slow push-in, a breath, the office AC sound; the camera settles.

### 8.2 Animation

- Low-poly, 12–24 fps stylised animation for crowds, interpolated at 60 fps.
- Motor: lean, handlebar, suspension, wheel spin, rider weight shift.
- KRL: door leaves, strap swing, crowd compress, alighting-first choreography.
- UI: transit-signage motion, not bouncy mobile-game juice. Doors wipe, line draws, dot-matrix flips.

### 8.3 Audio

- **Music:** adaptive, three layers (subuh, rush, rain); city-pop/lo-fi/ambient with subtle Indonesian instruments; original, licensed buyout. No copyrighted songs.
- **Ambience:** station murmur, rails, rain, distant mosque/church/horn layers (respectful, non-tokenised), warung, office AC.
- **SFX:** engine, horn language, angkot door, e-money beep, KRL chime, strap creak, crowd swell, footsteps, coffee pour.
- **Voice:** original Indonesian/English PA and character lines; no copied KAI/TransJakarta announcements. Hire voice actors with releases.
- **Mix:** fatigue low-pass; rain masks; crowd swells; volume sliders; mono option; no jumpscares.
- **Silence:** use it. The quiet before arrival is part of the design.

### 8.4 Haptics

- Mobile only where supported: short pulse on braking, door close, near-miss, seat offered, arrival.
- Respect system settings and an in-game toggle; never rely on haptics for essential information.
- iOS Safari lacks the Vibration API in many versions; design without it.

### 8.5 VFX

- Rain on visor, wet reflections, spray, heat shimmer, exhaust, brake glow, station fluorescent flicker (no strobing), dust, paper, leaves.
- No screen-filling particles; no bloom that obscures hazards on mobile.
- Colour grading: warm sodium vs cool dawn, desaturated rain, warm office.

---

## 9. Art direction

### 9.1 Style

**“Measured low-poly Jakarta”** — stylised, readable, atmospheric. Geometry is simplified but proportions, lane counts, landmarks, and signage placement are measured. Materials are matte with selective wetness; lighting does the emotional work. Think _cinematic diorama_, not _photoreal_.

- Real landmarks: Semanggi cloverleaf/ramps, Sudirman towers, Dukuh Atas, Manggarai multi-level, Tanah Abang market, Bintaro shophouses, BSD blocks, Senayan.
- People: diverse silhouettes, office wear, batik, ojol jackets, school uniforms, vendors, security, elderly. Low-poly but not caricatures.
- Vehicles: generic but recognisable silhouettes; original liveries; no official logos.
- Surfaces: asphalt patchwork, faded lane paint, yellow box, concrete busway barriers, tactile paving, yellow line, station name boards with original design language.

### 9.2 Palette

| Token       | Hex       | Use                       |
| ----------- | --------- | ------------------------- |
| **Subuh**   | `#0B1B2B` | pre-dawn sky, UI dark     |
| **Sodium**  | `#FFB347` | streetlights, warmth, CTA |
| **KRL Red** | `#D7263D` | train accent, urgency     |
| **TJ Teal** | `#0B6E99` | busway, transit UI        |
| **Rain**    | `#2A9D8F` | weather, calm             |
| **Paper**   | `#F4EBDD` | light UI, report card     |
| **Aspal**   | `#2F3437` | asphalt, text             |
| **Signal**  | `#F2C14E` | warnings, lights          |
| **Dignity** | `#E76F51` | social/fatigue accents    |

- Contrast checked for WCAG AA; traffic lights always paired with shape/label.
- Avoid “tropical cliché” green/yellow overload; the city is grey-blue with pockets of sodium and neon.

### 9.3 Typography

- **Display:** Bricolage Grotesque / Archivo Expanded / Sora (choose one, self-hosted, subset).
- **Body:** Inter / Source Sans 3.
- **Transit:** IBM Plex Mono for codes, times, fares.
- **Indonesian signage:** condensed uppercase, high contrast; original name boards inspired by transit signage, not copies.
- **Accessibility:** minimum 16 px body, 4.5:1 contrast, 200% zoom, no text in images for essential info.

### 9.4 Motion language

- **Transit-signage motion:** line draws, dot-matrix flips, door wipes, destination-board rolls.
- **Natural motion:** lean, sway, rain, crowd; eased, never bouncy.
- **UI:** 120–240 ms; no gratuitous spring; reduced-motion fallback is a crossfade.
- **Arrival:** a slow exhale, not a confetti explosion.

### 9.5 Original branding (legal guardrail)

- Real road/station names (facts) are used.
- No KAI/TransJakarta/JR logos, no exact trade dress, no copied announcements, no official app UI.
- Train livery is “red-yellow inspired” but with an original mark and pattern.
- Busway buses are teal, original.
- Credits: “Not affiliated with PT KAI, KAI Commuter, or TransJakarta. Real place names are used descriptively.”
- OSM attribution: “Map data © OpenStreetMap contributors, ODbL.”

---

## 10. Web design — the shopfront

The website is not a landing page bolted onto a game. It is the **first act of the commute**: it should make the visitor feel the game before they press play.

### 10.1 Goals

1. Make a visitor understand the promise in 5 seconds.
2. Let them play the free route in ≤2 clicks.
3. Make the free/paid boundary honest and attractive.
4. Rank for Indonesian commute/game searches.
5. Load fast on a mid-range phone; no motion sickness; no dark patterns.

### 10.2 Information architecture

```text
/                         landing
/games/pejuang-nafkah     game page (trailer, screenshots, modes, routes)
/peta                     route atlas (real corridors, station order)
/harga                    free one-route vs All Maps vs Live vs cosmetics
/devlog                   development notes / research stories
/devlog/[slug]
/faq
/tentang
/kontak
/privasi
/syarat
/refund
/masuk                    sign in
/akun                     account, purchases, devices, export/delete
/checkout/return          payment return/status
/play/pejuang-nafkah/     game host (noindex)
/admin                    operations (Cloudflare Access)
```

### 10.3 Landing page narrative

A scroll-driven “one morning” in five scenes:

1. **05:12 — Alarm.** Dark room, phone glow, a hand reaching. Copy: “Setiap pagi, kamu berangkat lebih awal dari yang orang lihat.”
2. **05:40 — Motor.** Headlight cone, wet asphalt, a gap opening. Copy: “Selip. Rem. Gas. Ulang.”
3. **06:15 — Stasiun.** Yellow line, train lights, crowd. Copy: “Berdesakan. Tapi semua orang juga mau sampai.”
4. **07:10 — Di dalam.** Straps, shoulders, window reflections. Copy: “Tiga puluh menit. Satu tangan. Kadang ada drama.”
5. **08:29 — Kantor.** Lift doors, AC, a breath. Copy: “Sampai. Capek. Tapi sampai. Gitu aja terus setiap hari.” CTA: **Main gratis**.

The narrative is skippable, reduced-motion friendly, and readable without animation.

### 10.4 Motion design system

- **Hero:** a living diorama of a KRL window / Sudirman dawn. Layers: sky, towers, train lights, rain, foreground strap. Mouse/touch parallax; subtle idle motion. Optional Three.js diorama only on capable desktops, lazy-loaded after idle; fallback is a pre-rendered AVIF/WebP + CSS parallax.
- **Scroll:** scene pinning, line draws, kinetic type, route map reveals. Use `IntersectionObserver` + CSS transforms; avoid layout thrash; pause offscreen.
- **Micro-interactions:** magnetic CTA, ticket tear, door wipe on section change, fare counter, station-board flip on hover.
- **Page transitions:** View Transitions API progressive enhancement; fallback instant.
- **Sound:** off by default; a single “nyalakan suara” toggle; no autoplay.
- **Performance:** animate only transform/opacity; `content-visibility`; lazy media; no smooth-scroll hijack; 60 fps; reduced motion disables all non-essential motion.
- **Accessibility:** keyboard focus, skip links, visible focus, captions for trailer, alt text, no flashing, contrast.

### 10.5 Visual identity

- **Logo:** a wayfinding arrow + strap loop forming a “P/N” mark; warm sodium on subuh navy. Works at 16 px.
- **Wordmark:** “PEJUANG NAFKAH” in condensed grotesque; “WNI SERIES” as a small passport stamp.
- **Photography/renders:** in-game cinematic stills, not stock photos. Real commuters only with consent; otherwise illustrated/rendered.
- **Social:** share cards with route, time, report card, a dry line; vertical 9:16 clips for TikTok/Reels; no fake testimonials.

### 10.5a The tone layer (v4.1)

The visual identity is **“sodium dawn + warung sticker.”** The atmospheric base stays cinematic; the humour is applied in a thin, deliberate layer so the serious parts remain serious.

- **Series line:** **“Susahnya nyata, dramanya gratis.”** on a highlighter sticker in the hero, footer, OG, and about page.
- **Game punchline:** **“Gitu aja terus setiap hari.”** as a sambal-red sticker under the hero title; the fourth beat after “Berangkat. Berjuang. Sampai.”
- **Ticker:** a highlighter-yellow receipt strip between hero and the first content section: “Berangkat · Berjuang · Sampai · Gitu aja terus setiap hari · Kursi kosong itu mitos · Gajian dulu.” Pauses/static-wraps under reduced motion.
- **Drama section:** a compact “Hari ini dramanya apa?” block with 3 stamps (“PERNAH TERJADI”, “LANGKA”, “JANGAN DITIRU”), a share-card mock, and the rule that drama is rare, real-basis, and never at a real victim’s expense.
- **Bang Nafkah:** an original cream sticker portrait (teal helmet, amber thermos, tired smile) with a speech bubble. He is the narrator, not the player. One card is enough; do not turn every section into a mascot parade.
- **Stamps/tape:** recognition cards get a small tape strip and a rotated stamp (“RELATE”, “8 DETIK”, “BASAH”); pricing gets one “PALING MASUK AKAL” stamp. These are seasoning, not structure.
- **Headline jokes:** “Tidak ada jebakan. Kecuali macet.” / “Satu jempol. Satu tujuan: gajian.” / “Kadang harganya parkir.”
- **Palette:** existing subuh navy/amber/teal + highlighter yellow `#F7E45A`, sambal red `#FF5A4E`, paper cream `#F4EBDD`, kangkung green as a rare accent.
- **Rules:** highlighter only for the series line/stamps, never body copy; all sticker text must meet contrast; no joke in a live-data warning, payment error, or serious failure; no forced laughter. Full voice: [brand.md](brand.md).

### 10.6 Conversion design

- Primary CTA above the fold: **“Main gratis — pilih rute kamu”** once the game is playable; pre-alpha uses **“Daftar tunggu”**.
- Secondary: **“Lihat cara main”** (30 s video).
- Trust row: “Gratis untuk satu rute pilihan · Tanpa iklan · All Maps Rp 79k sekali · Live Rp 49k/bulan”.
- Pricing table: Free one-route / All Maps / Live; honest feature comparison; no strikethrough fake discounts except a real launch window. Show that Live is Phase 2 and not yet sold.
- Payment trust: Mayar, QRIS/e-wallet/VA/card icons; “Pembayaran diproses Mayar”; support email; refund link; subscription cancellation copy.
- Checkout: show the final price, tax note, and available methods (QRIS/e-wallet/VA/card) before redirect; no surprise surcharge; remember the last successful method (no dark default).
- Risk reversal: clear refund policy; “kalau ada masalah, email kami”.
- No sign-in wall before first play; account prompt after arrival.
- Mobile sticky CTA respects safe area; desktop header CTA.

### 10.7 Content and SEO

- **Keywords:** game KRL, simulator macet Jakarta, game ojek, game perjalanan Jakarta, game satu tangan, browser game Indonesia.
- **Pages:** route guides (“Rute Jurangmangu–Sudirman”), research devlogs (“Kenapa angkot berhenti di mana saja”), station spotlights, “cara main satu tangan”.
- **Structured data:** `VideoGame`, `FAQPage`, `Organization`, `BreadcrumbList`.
- **OG images:** generated per page with route/score motifs.
- **i18n:** Indonesian default, English `/en`; hreflang; language switcher persisted.
- **Performance:** static Astro, minimal JS, no third-party embeds above the fold, self-hosted fonts, image optimization, CDN cache.

---

## 11. Monetization design

### 11.1 Offer architecture

| Tier          | Promise                                                                                          | Price            |
| ------------- | ------------------------------------------------------------------------------------------------ | ---------------- |
| **Free**      | One chosen route, both modes, daily challenge, leaderboards, complete loop, no Live data, no ads | Rp 0             |
| **All Maps**  | Every Pejuang Nafkah map, including Phase 3 cities; all modes; permanent                         | Rp 79,000 once   |
| **Live**      | All Maps + live traffic/weather/incidents + estimated crowding + real-trip planner; recurring    | Rp 49,000/month  |
| **Cosmetics** | Expression, not power                                                                            | Rp 15,000–25,000 |

Live is implemented in Phase 2. Do not advertise a checkout before it exists; the pre-alpha site uses a waitlist.

### 11.2 Ethical rules

- The free experience is not a demo; it is a complete short game on the route the player chooses.
- The paywall comes after the first arrival, never before.
- No “pay to avoid a penalty”, no “pay to keep a streak”, no “pay to skip”.
- No loot boxes, gacha, or randomized paid rewards.
- Cosmetics are visible but not status-gated; free players earn a good set.
- Prices are in rupiah, with the applicable tax shown clearly on the receipt (PPN if PKP; otherwise the applicable status).
- Refunds are human-reviewed; see `specs.md`.

### 11.3 Why no ads

- Web eCPM in Indonesia is low; ads would interrupt the mood and the one-hand flow.
- BUSSID proves ads can work at massive mobile scale; we are not at that scale, and our promise is premium calm.
- A one-time All Maps purchase and an optional Live subscription align incentives: we want the player to finish, recommend, and get real utility — not to farm impressions.

---

## 12. Accessibility and comfort

- **Vision:** contrast, scalable text, colour-blind palettes, no colour-only signals, screen-reader menus, optional high-contrast HUD.
- **Hearing:** captions/subtitles for all cues, visual door/brake indicators, mono audio.
- **Motor:** one-hand, large targets, input buffering, brake assist, auto-pause, no timed menu.
- **Cognition:** short tutorials, clear goals, no overloaded HUD, pause and think, “Santai” mode.
- **Motion:** reduced motion, camera shake off, FOV comfort, no flashing, horizon lock.
- **Language:** plain Indonesian, glossary for local terms, English translation.
- **Economic:** free route complete, no pay-to-win, no ads, no gambling.
- **Safety:** no real-world encouragement of dangerous riding; in-game consequences; disclaimer.

---

## 13. Onboarding

### 13.1 First 90 seconds

1. **Cold open:** a dark room, alarm, phone. “Berangkat?”
2. **Choice:** motor / KRL / ikut alur (recommended).
3. **Diegetic tutorial:** one gesture at a time, learned in traffic/on the platform. No modal wall.
4. **First decision:** a green light vs a gap; a door vs a seat.
5. **First arrival:** a breath, a report card, “Simpan perjalanan?” account prompt.

### 13.2 Teaching principles

- Teach by doing, not by reading.
- One new verb per beat; repeat in a safe context before pressure.
- Failure in the tutorial is impossible or consequence-free.
- Skip is always available; the game remembers if you skipped.
- Re-teach contextually (“Tahan untuk pegangan” when the train brakes).

### 13.3 First-session route choice

- After a short, honest explanation, ask: “Rute mana yang paling sering kamu lewati?” Show the real map, not a list of abstract levels.
- Default to the player’s likely corridor if they entered from a route page; still require confirmation.
- Explain the boundary in one sentence: “Rute ini gratis selamanya, semua mode. Kamu bisa ganti sekali dalam 14 hari; setelah itu All Maps membuka semua rute.”
- Do not hide the boundary behind a fake “recommended” preselection. No pre-checked paid option.
- If the player is unsure, offer “Coba rute Bintaro dulu” and remind them of the one-change window.
- Never charge before the first complete run. Live is offered after the player has a route and understands the value.

---

## 14. Playtest and authenticity validation

### 14.0 Lived-experience research (before prototype)

Desk research alone is not enough for a game about bodies in transit. Before locking a corridor beat, the team does at least two of:

- **Contextual inquiry / ride-along:** 4–8 commuters, with consent; observe standing, heat, rain, crowding, transfers, phone use, and one-hand constraints.
- **Diary study:** 7–14 days of short entries (time, weather, wait, cost, body, mood, one good/funny moment); no precise location or unnecessary PII.
- **Body map:** where the commute hurts/tightens; what one thumb can reach while holding a strap; what causes a stumble.
- **Emotional interview:** “When did you feel like a number?”, “When did you laugh?”, “What would feel disrespectful if a game showed it?”
- **Accessibility check:** low-end Android, small screen, reduced motion, screen reader, disabled/elderly/pregnant commuters where relevant.
- **Tone/punch-down review:** 3+ native Indonesian readers; check who the joke targets.

**Ethics:** informed consent, compensation, right to withdraw, no faces/voices without release, redact PII, no covert recording, no trauma mining. Store anonymised notes only.

**Synthesis:** journey map + physical constraints + emotional beats + design implications. State sample size and limitations; 6 people are not statistical proof. Full protocol: [research/PROTOCOL.md](research/PROTOCOL.md).

### 14.1 Recognition test

Show 5-second clips/screenshots of:

- Jurangmangu platform at dawn;
- Tanah Abang transfer crowd;
- Sudirman busway/median;
- an angkot stopping in-lane;
- a KRL interior with straps.

Ask: “Where is this? What time is it? What is happening?” Target: ≥80% correct/recognised by Jabodetabek commuters.

### 14.2 One-hand test

- Participant holds a phone with one hand (standing if safe), plays the first run.
- Measure: completion, errors, hesitation, thumb reach, fatigue, grip/balance, heat/rain comfort, “did you need your other hand?”
- Target: ≥90% complete without instruction; ≤3 confusion moments; no unsafe posture required.

### 14.3 Emotional test

- Post-run: “What did this remind you of?”; “Did it feel respectful?”; “Did you want to play again?”; “Would you show a friend?”; “What drama happened?”; “Would you retell it?”; “Did any card feel like it mocked a real victim?”
- Compare with the lived-experience themes from §14.0; note where the game overclaims or flattens.
- Target: ≥70% positive; ≤10% “miserable/mocking”; ≥60% can retell a drama unprompted; ≥30% would share the card.

### 14.4 Authenticity checklist

Use `specs.md` §14. Every corridor must pass before content lock. A single wrong station order is a P1 content bug. Every drama card must show `realBasis`, source IDs, a `fictionalised` note, and a sensitivity review before it can ship.

---

## 15. Content pipeline (design view)

```text
Public sources → source registry → normalized data → hand-authored gameplay graph
→ kejadian/drama bank (real basis + sensitivity) → native copy review
→ playtest (rarity/fairness/recall) → content pack → release

Daily (Phase 2D):
00:00 WIB research → candidate drafts → automated checks → owner review/comment
→ regeneration → approval → signed daily pack → game/Daily Challenge
→ correction/takedown → new version
```

- **Source registry:** URL, retrieval date, confidence, licence.
- **Normalized data:** stations, routes, rules, landmarks, flood points.
- **Gameplay graph:** lane nodes, decision gates, hazard weights, camera cues; hand-authored for fun.
- **Scenario design:** weather/incident/event combinations, seeded weights, anti-frustration rules.
- **Drama bank:** real-basis ledger, source IDs, rarity, conditions, choices, effects, Bang lines, share headlines, kill list, sensitivity review.
- **Daily pipeline:** source allowlist, AI draft schema, anonymisation/PII checks, owner approval state machine, immutable revisions, signed pack, fallback, audit/correction.
- **Copy:** Indonesian native review, sensitivity review, glossary.
- **Validation:** schema, station order, distances, fare formula, door side, landmark check.
- **Release:** version, `effective_from`, changelog, in-game date stamp.
- **Refresh drill:** simulate a station closure/Gapeka change without a code deploy; verify old runs remain valid.

---

## 16. Risks and design debt

| Risk                     | Design response                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| Too stressful / not fun  | “Santai” mode, readable telegraphs, soft failure, humor, short runs                                |
| Too realistic / boring   | Decision density, social beats, daily variation, beautiful moments                                 |
| Misery porn              | Tone rules, sensitivity review, kindness mechanics, no real tragedies                              |
| Drama feels exploitative | Real-basis ledger, 12-month tragedy exclusion, no victims/identity blame, kill list, native review |
| Drama fatigue / too rare | Frequency test, at most one major run, no pity timer, rare variants, recall/share metric           |
| One-hand feels limited   | Four verbs, contextual depth, assists, test on real phones                                         |
| Content churn            | Versioned data, refresh drill, no hard-coded timetables                                            |
| IP/brand risk            | Original branding, no logos/announcements, legal review                                            |
| Performance on low-end   | Stylised low-poly, instancing, LOD, adaptive quality, budgets                                      |
| Web marketing too heavy  | Static Astro, lazy 3D, reduced motion, performance budgets                                         |
| Monetization backlash    | Free complete core, no ads, clear price, refunds                                                   |
| Leaderboard cheating     | Deterministic sim, server replay, top-100 validation                                               |
| Scope creep              | Corridor ribbons, v1 scope, phase gates                                                            |

---

## 17. Open design questions

1. Final subtitle/tagline and logo direction.
2. Portrait-first motorcycle camera: does it feel as good as landscape in playtest?
3. Exact free corridor endpoint: Sudirman vs BNI City vs SCBD last mile.
4. How much “day at work” vignette is enough without becoming a second game?
5. Voice-over budget and whether PA announcements are voiced or text + chime.
6. Which 3 cosmetics are free vs paid at launch.
7. Whether `tim subuh` is a difficulty or a separate mode.
8. How to depict pickpocket/harassment without trivialising it (likely omit harassment; pickpocket as a tense, non-graphic event).
9. Share-card format/watermark after the share test; exact drama rarity after the frequency test.
10. Daily drama cadence (daily vs weekdays), owner review SLA, source/AI provider, and whether Daily Challenge ships with Phase 2D.
11. English localization depth (UI only vs full story).
12. Confirm one-route free choice + one courtesy change in 14 days.
13. Confirm whether All Maps explicitly includes every future Phase 3 city (recommended: yes for Pejuang Nafkah, not future games).
14. Confirm the exact Live data set at launch (traffic/weather/incidents + estimated crowding) and whether PetaBencana flood layer waits for a commercial licence.

---

## 18. Appendix

### 18.1 Launch route matrix

| Corridor                                     | Mode               | Access         | Signature                       |
| -------------------------------------------- | ------------------ | -------------- | ------------------------------- |
| Bintaro/Jurangmangu → Tanah Abang → Sudirman | KRL + motor + walk | Free if chosen | The canonical morning           |
| BSD/Cisauk → Tanah Abang → Sudirman          | KRL + BSD Link     | All Maps       | Skybridge, long ride            |
| Depok → Manggarai → Sudirman                 | KRL                | All Maps       | Manggarai crush                 |
| Bekasi → Jatinegara/Manggarai → Sudirman     | KRL                | All Maps       | Loop direction, industrial edge |
| Bintaro → SCBD                               | Motor              | All Maps       | Selip, lights, angkot           |
| BSD → SCBD                                   | Motor/toll         | All Maps       | JORR/Serpong choice             |
| Depok → SCBD                                 | Motor              | All Maps       | Jagorawi/Antasari volatility    |
| Bekasi → SCBD                                | Motor/toll         | All Maps       | Cikunir, Becakayu               |

### 18.2 Economy sketch (tunable)

| Item                   | Range                            |
| ---------------------- | -------------------------------- |
| KRL fare               | Rp 3,000–5,000                   |
| TransJakarta           | Rp 3,500                         |
| Ojol short             | Rp 10,000–20,000                 |
| Parking                | Rp 2,000–5,000                   |
| Fuel                   | Rp 10,000/L; ~40 km/L            |
| Toll (motor)           | Rp 16,000 class                  |
| Fine                   | Rp 50,000–500,000 (game-scaled)  |
| Daily budget           | Rp 25,000–70,000                 |
| Daily wage (reference) | ~Rp 260,000 (UMP 2026 / 22 days) |

### 18.3 Decision gates (design)

- Gate A: one-hand first run ≥90% without help.
- Gate B: recognition ≥80%.
- Gate C: “fun/would play again” ≥70%.
- Gate D: performance budgets on reference devices.
- Gate E: authenticity checklist green for the corridor.
- Gate F: tone review by 3 native Indonesian readers.

---

_End of design.md. The web is the first act; the commute is the whole play._
