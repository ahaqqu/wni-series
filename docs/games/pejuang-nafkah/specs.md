# specs.md — Pejuang Nafkah (WNI Series #1)

**Product specification and quality contract**
**Version:** 4.1
**Date:** 2026-10-19
**Status:** design baseline — game/checkout implementation not started; pre-alpha landing page + waitlist implemented
**Owner:** WNI Series
**Support / privacy contact:** `wniseries@gmail.com`
**Canonical host:** `https://wniseries.ahaqqu.com`
**Related:** [design.md](design.md) · [plan.md](plan.md) · [architecture.md](architecture.md) · [research refresh](research/2026-10-refresh.md) · [live-data/Mayar research](research/2026-10-live-data-and-mayar.md) · [brand](brand.md) · [research protocol](research/PROTOCOL.md)

> This document is the source of truth for **what** we are building and **how we decide it is good**. If design, plan, or code disagree with a MUST in this file, this file wins until the user approves a change.

---

## 0. How to read this document

- **MUST / MUST NOT** = release-blocking requirement.
- **SHOULD** = expected; deviation needs a recorded decision.
- **MAY** = optional, only after core quality gates pass.
- Requirement IDs are stable and are referenced by `plan.md` and test names.
- “v1” means the first public paid release. “Series” means the reusable platform for future WNI games.
- Indonesian terms are intentional product language, not decoration. They are explained on first use and in the glossary appendix where present.

---

## 1. Vision

> **A game that feels like your actual commute — not a race, not a tycoon, not a meme.**
>
> You leave home in Jabodetabek before dawn. You choose the motorcycle, the KRL, or both. You deal with the same roads, stations, rules, crowds, weather, costs, and small human moments. You arrive at the office — tired, amused, relieved, sometimes late. Then you do it again tomorrow.

**One-line pitch:** _The one-hand commute game set on the real streets and trains of Jakarta, where getting to work is the adventure._

**Genre:** 3D web **commute-survival / slice-of-life sim** with arcade readability. Dual mode (motorcycle + KRL) and multimodal handoffs. Not a racing game.

**Platform:** installable web game (PWA) for mobile browsers and desktop browsers. Mobile portrait, one hand, playable on a moving train. Desktop gets keyboard/mouse and a wider view.

**Business:** free choice of one route; one-time **All Maps** (Rp 79,000); **Live** subscription (Rp 49,000/month, Phase 2) with real live data; optional cosmetics. No ads. No pay-to-win. No loot boxes.

---

## 2. Problem and opportunity

### 2.1 The real problem

Millions of people in Greater Jakarta spend one to three hours a day getting to work. The commute is not a fun challenge to them; it is a **second job** made of time, money, heat, crowding, uncertainty, and small indignities. Existing games either turn transport into a power fantasy (bus/truck/ojol sims), a management spreadsheet, or a meme. Almost none make the player feel **seen**.

At the same time, the commute is full of stories: the angkot that stops anywhere, the ojol cutting in, the train door about to close, the stranger who gives up a seat, the rain that changes every plan, the relief of arriving. That emotional texture is the product.

### 2.2 Why now

- **KRL scale:** 271.48 million Jabodetabek trips in Jan–Sep 2026; ~1.09 million per weekday. The shared experience is enormous and current.
- **Road reality:** Jakarta ranked 24th most congested city in the 2025 TomTom index, with average peak speed 17.8 km/h. The daily struggle is legible and quantifiable.
- **Market proof:** BUSSID (~239.5M installs) and Ojol Life (>1M downloads) show Indonesian transport sims can reach mass audiences. Neither owns the **emotional, one-hand, web-first, dual-mode commute** position.
- **Distribution:** 230M internet users, 45 Mbps median mobile speed, and a large desktop audience. A no-install web game can reach people where they already are — including on the train.
- **Payment rails:** Mayar provides QRIS/e-wallet/VA/card coverage and SaaS-style recurring billing for a personal merchant, with a documented API. It is feasible to sell a low-friction All Maps product and a live-data subscription without app-store fees.

### 2.3 The gap we fill

| Existing transport games     | Pejuang Nafkah                                        |
| ---------------------------- | ----------------------------------------------------- |
| Vehicle power fantasy        | **Commuter vulnerability and agency**                 |
| Open-world driving           | **Real named corridors and station order**            |
| Speed / cargo / tycoon       | **Time, money, body, dignity, social pressure**       |
| Two-hand, landscape, at home | **One-hand, portrait, on the move**                   |
| Ads or gacha                 | **Free route + All Maps + optional Live + cosmetics** |
| Generic city                 | **Jakarta/Jabodetabek specificity**                   |

---

## 3. Target players

### 3.1 Primary personas

**A. “Raka”, 27 — Bintaro office worker**

- Lives with parents in Bintaro; works at a tech company in SCBD.
- Commutes 60–90 minutes: motor to Jurangmangu/Pondok Ranji, KRL to Tanah Abang/Sudirman, walk/ojek.
- Plays mobile games in short bursts; often standing on the train with one hand on a strap.
- Wants: recognition, a laugh, a sense of mastery over a day that usually controls him.
- Frustrations: games that need two hands, long tutorials, timers, paywalls, fake “Indonesian” flavour.

**B. “Sari”, 34 — Depok worker / parent**

- Commutes on the Bogor line via Manggarai; sometimes drives a car.
- Plays to unwind; has 5–10 minutes, not 45.
- Wants: warmth, low pressure, a game that respects her intelligence and time.
- Frustrations: sexist stereotypes, misery porn, aggressive monetisation, noisy ads.

**C. “Dimas”, 21 — Bekasi student / gig worker**

- Uses a motorcycle; plays on cheap Android data plans.
- Wants: skill expression, bragging rights, shareable results, free content.
- Frustrations: heavy downloads, battery drain, pay-to-win, leaderboards full of cheaters.

**D. Curious global player**

- Interested in Jakarta, urbanism, or slice-of-life games.
- Needs English UI, clear context, no assumed local knowledge, fair price.

### 3.2 Audience rules

- **Age:** 13+ accounts; the game contains crowding, mild peril, traffic conflict, and in-game purchases, but no graphic violence, gambling, sexual content, or chat with strangers.
- **Device:** Android 10+ / iOS 17+ mobile browsers, current Chrome/Safari/Firefox/Edge desktop.
- **Context:** the primary play context is a **commute**: noisy, shaky, one-handed, interrupted, sometimes offline. Every design decision must survive that context.
- **Inclusivity:** women, men, non-binary players; commuters of different incomes; people with disabilities. The game must not turn poverty or harassment into a joke.

---

## 4. Jobs to be done

| When…                           | I want to…                                             | So I can…                                 |
| ------------------------------- | ------------------------------------------------------ | ----------------------------------------- |
| I am standing on the KRL        | play something meaningful for 5 minutes with one thumb | turn dead time into “me” time             |
| I am stuck in traffic           | laugh at the absurdity and feel competent              | release tension without doomscrolling     |
| I get to the office late        | tell the story of my morning                           | feel seen, not judged                     |
| I have a free evening           | make progress, unlock a route, beat my best            | have a reason to return                   |
| I want to support the developer | pay once, transparently                                | enjoy the full game without ads or tricks |

**Emotional jobs:** recognition (“that’s exactly my commute”), relief (“at least I made it”), mastery (“I found the gap”), connection (“I know that ibu”), hope (“tomorrow can be better”).

---

## 5. Product principles

These are non-negotiable. They are also the review checklist for every feature.

### P1. **Rasa-nya bener.** Authenticity is the feature

Real roads, station order, fares, rules, door sides, crowd behaviour, weather, and language. We invent mechanics, not geography. When reality is uncertain, we mark confidence and use a plausible range instead of pretending.

### P2. **Satu tangan, satu tujuan.** One hand, zero friction

The game MUST be fully playable in portrait with one thumb: no two-hand gestures, no precision taps in the top third, no mandatory audio, no timed text reading. Controls live in the bottom 40% of the screen. A new player can complete the first run without a manual.

### P3. **It is a commute, not a race**

Speed is a consequence of gaps, lights, crowds, and decisions. No nitro, no lap timer, no “beat the traffic” power fantasy. The score rewards arriving intact, on time, solvent, and with dignity — not being fastest.

### P4. **Struggle without misery.**

The game shows heat, crowding, delays, and cost honestly. It never mocks commuters, romanticises suffering, or makes poverty the punchline. Every run ends with a way forward. Warmth and dry humour are mandatory: the joke is how the character survives the day, not a verdict on the people living it.

### P5. **Free is a real game — you choose your commute.**

A free player chooses **one route** — the one they actually take — and gets the complete game on it: all modes, daily challenge, leaderboards, progression, and the full emotional arc. This is not a demo and not a crippled route. They can change that choice once within 14 days for a genuine mistake or move; further route changes require All Maps. The free route does not include live data.

### P6. **Pay once for maps, subscribe for live — no tricks.**

No ads. No energy. No loot boxes. No pay-to-win. No fake scarcity. **All Maps** is Rp 79,000 once and unlocks every map in Pejuang Nafkah, including Phase 3 cities. **Live** is Rp 49,000/month and adds real live traffic/weather/incidents plus estimated crowding and the real-trip planner; it is implemented in Phase 2, not sold before it exists. Prices are clear in rupiah, gross, and the free/paid boundaries are visible before purchase. Cancel any time; access lasts until the paid period ends.

### P7. **The player is trusted; the client is not.**

Entitlements, prices, paid content, and leaderboard scores are enforced server-side. The client may render, simulate, and cache; it may not mint value. Security is a product feature, not an afterthought.

### P8. **Privacy is part of the fiction.**

We collect only what the commute needs: an email/Google identity, a display name, progress, orders, and anonymous telemetry. No location tracking, contacts, NIK, phone number, or ad IDs. The game must be playable without being surveilled.

### P9. **Performance is respect.**

If the game stutters on a mid-range phone on a train, it has failed. 60 fps target, 30 fps floor, fast boot, small downloads, battery awareness, offline tolerance. The marketing site must load fast even when the hero is beautiful.

### P10. **Built for the series.**

Game one is not a one-off hack. Shared auth, payments, entitlements, analytics, UI primitives, content schemas, and the Three.js runtime are reusable. Adding game #2 must be a content/engine exercise, not a rewrite.

### P11. **Accessible by default.**

Reduced motion, colour-blind-safe signals, subtitles for audio cues, large touch targets, left/right-hand mode, pause anywhere, and readable type in sunlight. Accessibility is not a “settings” afterthought.

### P12. **Data has a date.**

Fares, stations, closures, and schedules change. Every content pack has a version and `effective_from`. A run is tied to the content version it was played on. We ship a refresh drill, not a promise of permanent accuracy.

### P13. **No dark patterns, no growth at any cost.**

No fake countdowns, no forced streaks, no “pay to avoid shame”, no pre-checked marketing, no disguised ads, no selling data. Retention comes from the loop and the story.

### P14. **Ship in phases, prove every gate.**

Quality is evidence, not opinion. Every phase has automated tests, visual evidence, a manual checklist, and a written status. We do not start the next phase with a red gate.

### P15. **Live data is honest, not theatre.**

Live traffic, weather, and incidents come from named providers with a timestamp and source. Crowding and transit delay are labelled **estimasi** unless an operator provides a live feed. We never fake a live signal, never change a deterministic run mid-play, and never promise a data source we do not have a licence for. The live layer is frozen into a snapshot at the start of a run; the planner is a planning aid, not navigation.

### P16. **Ketawa itu bertahan, bukan mengejek.**

The brand line is **“Susahnya nyata. Lucunya gratis.”** The game’s line is **“Berangkat. Berjuang. Sampai. Besok lagi.”** Humour is dry, specific, self-deprecating, and aimed at the situation/system/ourselves — never at the poor, women, disabled people, minorities, or real victims. One joke per beat, then warmth. A serious failure gets silence or kindness, not a punchline. The player is never forced to laugh. Full voice/slogan system: [brand.md](brand.md).

### P17. **Research first, then simplify.**

No detailed plan, estimate, dependency choice, architecture change, content lock, or implementation starts without a current research brief, an ADR for the choice, and evidence for the facts that could break it. Research covers latest supported technology, security/privacy, performance/load, cost caps, robustness/scaling, accurate real-world data, and how WNI commuters feel physically and emotionally. Unknowns are stop conditions. The protocol is [research/PROTOCOL.md](research/PROTOCOL.md); decisions live in [`docs/adr/`](../../adr/README.md).

---

## 6. Core objectives

### 6.1 Experience objectives

| ID  | Objective                           | Key result (v1)                                                                          |
| --- | ----------------------------------- | ---------------------------------------------------------------------------------------- |
| X1  | The player recognises their commute | ≥80% of 12+ playtesters say “this feels like my commute” within one run                  |
| X2  | One-hand play is real               | ≥90% of mobile playtesters complete the first run one-handed without instruction         |
| X3  | The game is fun, not just sad       | ≥70% choose “fun/would play again”; median session 6–12 min                              |
| X4  | Failure feels fair                  | ≥80% of failed runs say “I know what I’d do differently”                                 |
| X5  | The tone lands                      | ≥70% say “warm/funny/respectful”; ≤10% say “miserable/mocking”                           |
| X6  | Arrival feels good                  | ≥80% report relief/satisfaction at the arrival screen                                    |
| X7  | Live is useful, not decorative      | ≥60% of Live beta users used the plan for a real trip; ≥70% can explain Live vs Estimasi |

### 6.2 Product objectives

| ID  | Objective              | Key result (v1)                                                                                              |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| P1  | Complete free route    | One chosen route playable end-to-end, both modes + multimodal, no ads                                        |
| P2  | Paid expansion is fair | All Maps unlocks every Pejuang Nafkah map; Live adds data, not score; no gameplay advantage in leaderboards  |
| P3  | Daily replay           | Daily seed, 3 leaderboard categories, shareable report card                                                  |
| P4  | Retention              | D1 ≥35%, D7 ≥15% among playtest cohort; daily challenge participation ≥20% of DAU                            |
| P5  | Conversion             | 2–5% of monthly players buy All Maps; 1–3% of eligible active players start Live; refunds <3% of paid orders |
| P6  | Series-ready           | Adding a second game requires no auth/payment/live-data fork; documented in architecture                     |

### 6.3 Business objectives

| ID  | Objective                | Key result                                                                                                                   |
| --- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| B1  | Sustainable micro-studio | Payment + live-provider + infra costs covered by live subscriptions and All Maps sales; provider budget capped and monitored |
| B2  | Price clarity            | All Maps Rp 79,000 gross; Live Rp 49,000/month gross; tax treatment confirmed; no hidden fees                                |
| B3  | Low fraud                | <0.5% chargeback/fraud rate; 100% order↔entitlement reconciliation; Mayar callbacks verified server-side                     |
| B4  | Own the audience         | Email/account list with consent; no dependency on a single portal                                                            |

### 6.4 Technical objectives

| ID  | Objective                | Key result                                                                                               |
| --- | ------------------------ | -------------------------------------------------------------------------------------------------------- |
| T1  | Smooth on target devices | 60 fps target on mid-range Android/iPhone; 30 fps floor on low-end; no long tasks >50 ms during play     |
| T2  | Fast to play             | Game boot to menu ≤5 s on 4G mid-range; first play ≤8 s; marketing LCP ≤2.0 s                            |
| T3  | Reliable payments        | p95 checkout API <600 ms; callback verified via Mayar API within 5 s; zero double-grants                 |
| T4  | Secure by design         | No critical/high vulnerabilities; payment tamper/replay tests pass; CSP enforced                         |
| T5  | Offline-tolerant         | A run can start, pause, and finish without network; sync later                                           |
| T6  | Observable               | Errors, payment mismatches, live-provider spend/freshness, and availability alerts reach a human         |
| T7  | Live data is bounded     | Snapshot cache hit ≥80%; provider budget enforced; stale/failure path visible; no per-user provider call |

### 6.5 Trust objectives

| ID  | Objective    | Key result                                                                    |
| --- | ------------ | ----------------------------------------------------------------------------- |
| R1  | Privacy      | Only necessary data; export/delete work; no ad trackers                       |
| R2  | Legal        | PSE registered; IGRS status tracked; terms/privacy/refund published           |
| R3  | Support      | Human response within 2 business days; payment issues within 1 business day   |
| R4  | Transparency | Public changelog; data-source dates; live/estimated labels; known issues page |

---

## 7. Scope

### 7.1 In scope — v1

- **Free route choice:** each account chooses one route (one corridor, all modes) and can play it completely. Phase 1 ships the Bintaro/Jurangmangu ↔ Sudirman corridor as that route; Phase 2 adds the full Jabodetabek map catalogue so the choice is meaningful.
- **KRL mode:** boarding, crowding, bracing, seat decisions, transfer, alighting, door timers, announcements, real station order and platform sides.
- **Motor mode:** real arterial corridor, lane filtering, traffic lights, angkot stops, ojol, busway separators, pedestrians/PKL, rain/flood, police/razia as fictionalised events.
- **Multimodal:** route planning, handoffs, time/cost/fatigue trade-offs.
- **Systems:** clock, punctuality, money, body/mental fatigue, dignity, safety, score/report card, daily seed, leaderboards, save/sync, settings/accessibility.
- **All Maps content (Rp 79,000 once):** every Pejuang Nafkah map, including the Jabodetabek launch set (Bintaro/Jurangmangu, BSD, Depok, Bekasi, Manggarai/Tanah Abang) and every map released in Phase 3 cities. It does not include Live data or future games.
- **Live (Rp 49,000/month, Phase 2):** all maps + live traffic/incidents (TomTom), live weather/nowcast (BMKG), estimated crowding and transit delay with confidence labels, real-trip planner, and live snapshot briefing. It is not a navigation service and does not change a scored run mid-play.
- **Platform web:** landing page, game page, route map, pricing, devlog, FAQ, legal pages, account, checkout, support.
- **Auth:** Google + email OTP, guest trial, account linking, deletion/export.
- **Payments:** Mayar sandbox → production; one-time All Maps, Live subscription, cosmetics; server-side entitlements, refund/revocation, reconciliation.
- **PWA:** installable, offline-tolerant free/All Maps play, update flow; Live requires network for a fresh snapshot and degrades to the last cached snapshot with a stale label.
- **Admin:** orders, refunds, entitlements, subscriptions, reconciliation, live-data cost/call dashboard, audit log, feature flags.
- **Analytics:** privacy-first product funnel and game telemetry; no PII.

### 7.2 Out of scope — v1

- **True live KRL/TransJakarta crowding and live train/bus positions without an operator partnership.** We model and label them as estimates.
- **Turn-by-turn navigation or safety-critical real-time routing.** The planner is a game/planning aid, not a navigation product.
- Multiplayer, chat, UGC, guilds, trading.
- Car driving mode, bus driving mode, ojol driver career mode.
- Photoreal open world, full Jakarta road network, free-flight camera.
- Native iOS/Android apps, Steam/console.
- Ads, loot boxes, gacha, paid consumables, paid leaderboard advantage.
- Voice chat, social feeds, public profiles beyond display name/avatar.
- User-generated routes or mods.
- Official KAI/TransJakarta branding, logos, or announcements.
- AI-generated live dialogue (static authored content only for v1).

### 7.3 Phase 3 candidates (not commitments)

- **Bandung, Surabaya, Yogyakarta** first; each requires route/transit data, traffic/weather coverage, local copy review, and a cost gate.
- Other cities (Medan, Makassar, Semarang) only after the first three prove the pipeline.
- `Pulang` — Lebaran homecoming / mudik narrative.
- `Warung` — small food-stall survival.
- `Kampung` — neighborhood flood/community game.
- Car mode / ojol driver mode as expansions.
- Series bundle, level editor, official transit partnerships.

- `Pulang` — Lebaran homecoming / mudik narrative.
- `Warung` — small food-stall survival.
- `Kampung` — neighborhood flood/community game.
- Car mode / ojol driver mode as expansions.
- Series bundle, level editor, official transit partnerships.

---

## 8. Experience contract

### 8.1 The run

A **run** is one leg or one complete commute. It is composed of **beats**: a decision, a skill moment, a social moment, or a wait. A beat lasts 3–20 seconds; a leg lasts 5–15 minutes; a full multimodal commute lasts 10–20 minutes; a day can be completed in one or two sittings.

**Micro loop (3–15 s):** read the situation → choose lane/gap/seat/brace → execute with one thumb → receive clear feedback (audio/visual/haptic) → adjust.
**Meso loop (5–15 min):** manage time, money, body, mind, dignity → arrive → get a report card → retry or continue.
**Macro loop (day/week):** plan departure, choose route, earn/spend, build relationships, unlock cosmetics, chase personal bests.
**Meta loop (series):** new corridors, new games, shared account/entitlements.

### 8.2 Modes

| Mode           | Fantasy                          | Core verb                          | Session          | Failure                                          |
| -------------- | -------------------------------- | ---------------------------------- | ---------------- | ------------------------------------------------ |
| **Motor**      | _Selip_ through the morning      | Steer/filter, brake, read gaps     | 4–8 min per leg  | Late, fine, minor crash, soaked, stranded        |
| **KRL**        | _Berdesakan_ like a real morning | Board, brace, move, alight, decide | 5–10 min per leg | Missed stop, door close, fall, dignity hit, late |
| **Multimodal** | The full Pejuang Nafkah day      | Plan, hand off, adapt              | 10–20 min        | Missed connection, budget blowout, exhaustion    |

### 8.3 One-hand contract

- Portrait-first. Landscape supported on desktop/tablet, never required.
- Primary controls are in the bottom 40% of the viewport, respecting safe areas.
- All gestures are discoverable by doing; no gesture requires two fingers, pinching, or reaching the top third.
- Tap targets ≥44×44 CSS px; the primary action ≥64 px.
- A “left hand / right hand” setting mirrors the control cluster.
- The game pauses automatically on `visibilitychange`, incoming call, or app background; resume is a single large button.
- No mandatory audio; every audio cue has a visual/subtitle equivalent.
- The first run is playable without sign-in; account prompt appears after arrival.

### 8.4 Failure and recovery

- **Soft failure is the default.** Late, fined, wet, embarrassed, exhausted: the run continues and the day ends with a report card. No “game over” screen for ordinary life.
- **Hard failure only for safety:** a crash fades to black, offers “istirahat / lanjut pelan / panggil bantuan”, and does not shame the player.
- **No lives, energy, or pay-to-continue.**
- **Retry is instant** with a new seed or the same seed; the player chooses.
- **Streaks have grace:** missing a day never destroys progress; it becomes a story beat (“kemarin libur”).

### 8.5 Win condition

Arrive at the office before the grace cutoff with enough body/mind/dignity and money to function. “Win” is a **report card**, not a victory screen: punctuality, safety, calm, cost, dignity, and a one-line story of the day.

---

## 9. Functional requirements

Priority: **M** = must for v1, **S** = should, **C** = could.

### 9.1 Accounts and identity

| ID      | Requirement            | Priority | Acceptance                                                                         |
| ------- | ---------------------- | -------- | ---------------------------------------------------------------------------------- |
| AUTH-01 | Sign in with Google    | M        | OAuth PKCE; verified email; account created/linked; E2E test                       |
| AUTH-02 | Sign in with email OTP | M        | 6-digit OTP, 10 min expiry, single use, 5 attempts, 60 s resend; E2E test          |
| AUTH-03 | Guest trial            | M        | First run playable without account; local save; prompt after arrival               |
| AUTH-04 | Account linking        | M        | Same verified email links Google + OTP without takeover; test conflicting accounts |
| AUTH-05 | Session management     | M        | HttpOnly/Secure/SameSite cookie; 30-day rolling; revoke all; device list           |
| AUTH-06 | Account deletion       | M        | Request → confirm → soft-delete → hard-delete per retention; email confirmation    |
| AUTH-07 | Data export            | M        | JSON export of profile, saves, orders, entitlements; delivered within 14 days      |
| AUTH-08 | Admin access           | M        | Separate role + Cloudflare Access + 2FA; no public admin login                     |
| AUTH-09 | Age gate               | M        | 13+ attestation; under-13 blocked; purchase copy requires 18+/parent               |

### 9.2 Game modes

| ID      | Requirement         | Priority | Acceptance                                                                          |
| ------- | ------------------- | -------- | ----------------------------------------------------------------------------------- |
| GAME-01 | KRL mode            | M        | One complete leg; boarding, brace, seat, transfer, alight; door timer; crowd; score |
| GAME-02 | Motor mode          | M        | One complete leg; filtering, lights, angkot, ojol, busway, rain, police; score      |
| GAME-03 | Multimodal          | M        | Motor → KRL → last mile with state carried across legs; time/cost/fatigue persist   |
| GAME-04 | One-hand controls   | M        | All interactions possible with one thumb; automated input test + 12-user test       |
| GAME-05 | Pause/resume        | M        | Pause on background; exact state restored; no lost run                              |
| GAME-06 | Offline run         | M        | Start/finish a free run with network disabled; sync on reconnect                    |
| GAME-07 | Daily seed          | M        | Same date/route/mode/version gives same base scenario for all players               |
| GAME-08 | Scoring/report card | M        | 5 axes + total; no hidden score; shareable card                                     |
| GAME-09 | Save/sync           | M        | Local IndexedDB + server snapshot; conflict prompt; versioned schema                |
| GAME-10 | Difficulty/assists  | M        | Santai/Pejuang modes; brake assist, gap highlight, crowd assist, reduced motion     |
| GAME-11 | Leaderboards        | M        | Daily/weekly/all-time per mode/route; server-validated; top 100 replay validation   |
| GAME-12 | Content version pin | M        | Run tied to content version; results remain valid after updates                     |
| GAME-13 | Tutorial            | M        | Diegetic, skippable, <90 s, teaches one-hand controls; no modal wall                |
| GAME-14 | Settings            | M        | Audio, music, haptics, reduced motion, colour-blind mode, language, hand, text size |
| GAME-15 | Share card          | S        | Canvas-generated image with route/score/funny line; no PII; download/share          |

### 9.3 World and content

| ID         | Requirement       | Priority | Acceptance                                                                |
| ---------- | ----------------- | -------- | ------------------------------------------------------------------------- |
| CONTENT-01 | Real route data   | M        | Named roads/stations; ordered stations; distances; source/date per record |
| CONTENT-02 | Real rules        | M        | Fares, odd-even, busway, helmet, door side, speed ranges; effective dates |
| CONTENT-03 | Real obstacles    | M        | ≥8 obstacle families; each telegraphed; each forces a decision            |
| CONTENT-04 | Versioned content | M        | `contentVersion` + `effective_from`; game bootstrap pins version          |
| CONTENT-05 | Attribution       | M        | OSM + public sources credited in game and site; licences recorded         |
| CONTENT-06 | Refresh drill     | M        | Simulate Karet-style closure/Gapeka change without code release; test     |
| CONTENT-07 | Fictional events  | M        | Flood/accident/police events are composites, not real recent tragedies    |
| CONTENT-08 | Language          | M        | Indonesian primary; English secondary; all strings in i18n catalogs       |

### 9.4 Web platform

| ID     | Requirement           | Priority | Acceptance                                                                          |
| ------ | --------------------- | -------- | ----------------------------------------------------------------------------------- |
| WEB-01 | Landing page          | M        | Hero, promise, modes, route proof, pricing, FAQ, CTA; mobile-first                  |
| WEB-02 | Motion design         | M        | Scroll narrative + micro-interactions; reduced-motion fallback; 60 fps              |
| WEB-03 | Game page             | M        | Screenshots, trailer/GIF, controls, authenticity, free/paid, CTA                    |
| WEB-04 | Pricing               | M        | Free one-route vs All Maps Rp 79k vs Live Rp 49k/month; gross/tax note; refund link |
| WEB-05 | Legal                 | M        | Terms, privacy, refund, contact, PSE/IGRS status, cookie notice                     |
| WEB-06 | SEO                   | M        | Metadata, OG images, sitemap, structured data, hreflang, canonical                  |
| WEB-07 | Performance           | M        | Lighthouse mobile ≥90 performance, LCP ≤2.0 s, INP ≤200 ms, CLS ≤0.05               |
| WEB-08 | Analytics             | M        | Privacy-first, cookieless where possible; consent for non-essential                 |
| WEB-09 | Support               | M        | `wniseries@gmail.com`, contact form, FAQ, response SLA, spam protection             |
| WEB-10 | PWA                   | M        | Installable; offline game shell/free content; update prompt                         |
| WEB-11 | Auth pages            | M        | Sign-in, account, purchases, delete/export; accessible                              |
| WEB-12 | Checkout              | M        | Order summary, terms, Mayar redirect, return/poll, pending/failed states            |
| WEB-13 | Browser compatibility | M        | Chrome/Edge/Firefox/Safari current-1; iOS 17+; Android 10+                          |
| WEB-14 | WebView handling      | M        | Detect Instagram/TikTok/Facebook WebView; offer “open in browser”                   |
| WEB-15 | Devlog                | S        | MDX/Content collections; RSS; share cards                                           |
| WEB-16 | Subscription mgmt     | M        | Active plan, renewal date, cancel, payment issue, restore; no dark patterns         |
| WEB-17 | Live labels           | M        | `Live` vs `Estimasi`; source + timestamp + confidence; stale state visible          |

### 9.5 Payments and entitlements

| ID     | Requirement            | Priority | Acceptance                                                                                                                                        |
| ------ | ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| PAY-01 | Product catalog        | M        | Server-side SKUs/prices; client sends SKU only; integer IDR                                                                                       |
| PAY-02 | Checkout               | M        | Server-owned price; select an active payment method; idempotency key; one active pending order per user/SKU; returns payment URL                  |
| PAY-03 | Mayar integration      | M        | Invoice/payment request for one-time; SaaS membership for Live; hosted checkout; merchant bears fees; sandbox + production config; no client keys |
| PAY-04 | Webhook                | M        | Treat callback as untrusted trigger; fetch Mayar transaction/member state; merchant/product/amount/customer checks; replay-safe; fast ack         |
| PAY-05 | Order status           | M        | Client polls server; return/redirect params never trusted; provider status/API fallback                                                           |
| PAY-06 | Entitlements           | M        | Server-side grant in same transaction as PAID; unique; revocable; audit                                                                           |
| PAY-07 | Paid content gating    | M        | Paid manifests/assets require entitlement; signed URLs; no client flag                                                                            |
| PAY-08 | Refunds                | M        | Admin workflow; manual transfer; revoke entitlement; audit; email                                                                                 |
| PAY-09 | Reconciliation         | M        | Daily order/settlement check; mismatch alerts; zero unexplained                                                                                   |
| PAY-10 | Tax                    | M        | Gross price; if PKP, PPN 11% included; receipt breakdown; accountant-reviewed                                                                     |
| PAY-11 | Invoices/receipts      | M        | Email receipt with order ID, SKU, amount, tax, support contact                                                                                    |
| PAY-12 | Chargebacks            | M        | Evidence pack; revoke; flag repeat; appeal process                                                                                                |
| PAY-13 | Prices                 | M        | All Maps Rp 79,000 gross; Live Rp 49,000/month gross; cosmetics Rp 15–25k; no hidden fees                                                         |
| PAY-14 | Entitlements           | M        | `free_route`, `maps_all`, `live`; server-side; All Maps permanent; Live time-bound; idempotent grant/revoke                                       |
| PAY-15 | Payment method UX      | M        | QRIS, one e-wallet, one VA, card; final price shown before redirect; no surprise fee                                                              |
| PAY-16 | Subscription lifecycle | M        | Register/member, invoice, renewal, expired, cancel, grace; access until period end; provider IDs stored; tests                                    |
| PAY-17 | Provider cost caps     | M        | Daily/monthly Mayar and live-provider budgets; alerts; degrade/disable Live without breaking maps                                                 |
| PAY-18 | No ads/no pay-to-win   | M        | No ad SDK, no gameplay advantage for sale; review gate                                                                                            |

### 9.6 Live data and planner

| ID      | Requirement         | Priority | Acceptance                                                                                                 |
| ------- | ------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| LIVE-01 | Provider adapters   | M        | TomTom traffic/incidents + BMKG weather/nowcast; keys server-only; normalized derived metrics              |
| LIVE-02 | Snapshot semantics  | M        | Snapshot frozen at run start; no mid-run network; planner separate from scored run                         |
| LIVE-03 | Source/freshness    | M        | Every value carries source, `asOf`, `expiresAt`, confidence; UI shows `Live` vs `Estimasi` vs `Stale`      |
| LIVE-04 | Planner             | M        | Compare corridor/departure window; ETA/delay/cost/comfort; no turn-by-turn navigation; disclaimer          |
| LIVE-05 | Attribution/licence | M        | TomTom + BMKG attribution; source registry; no raw provider redistribution; PetaBencana only after licence |
| LIVE-06 | Cache/cost controls | M        | Corridor/time-bucket cache; single-flight; adaptive polling; daily/monthly budget; kill switch             |
| LIVE-07 | Failure/degrade     | M        | Provider timeout/429/5xx → last snapshot + stale label; Live features degrade, free/All Maps unaffected    |
| LIVE-08 | Crowding honesty    | M        | Modelled/opt-in crowding labelled estimate + confidence; no “live occupancy” claim without operator feed   |
| LIVE-09 | Transit data        | M        | KRL/TransJakarta schedules versioned; no scraping; live positions/crowding only with a signed partnership  |
| LIVE-10 | Entitlement gating  | M        | Live endpoints require active `live`; maps_all/Free behavior enforced server-side                          |
| LIVE-11 | Cost dashboard      | M        | Admin sees calls, spend, cache hit, snapshot age, provider errors; alerts at 80/100% budget                |

### 9.7 Security, privacy, operations

| ID      | Requirement                | Priority | Acceptance                                                                                                                         |
| ------- | -------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| SEC-01  | Server-side trust boundary | M        | Price, entitlement, score, and paid assets enforced server-side                                                                    |
| SEC-02  | AuthZ matrix               | M        | Anonymous/user/paid/admin/webhook tested; IDOR tests pass                                                                          |
| SEC-03  | Webhook hardening          | M        | Mayar callback untrusted; API re-fetch; merchant/product/amount/customer checks; IP allowlist if available; replay/duplicate tests |
| SEC-04  | Session security           | M        | CSRF/origin checks; fixation/rotation; logout/revoke tests                                                                         |
| SEC-05  | OTP abuse protection       | M        | Per-email/IP limits; enumeration-safe responses; reuse blocked                                                                     |
| SEC-06  | Security headers           | M        | CSP, HSTS, COOP/CORP, X-Content-Type-Options, Referrer-Policy                                                                      |
| SEC-07  | Dependency/supply chain    | M        | Lockfile, audit, Dependabot, pinned actions, no untrusted postinstall                                                              |
| SEC-08  | Secrets                    | M        | No secrets in client/repo; server env 600; rotation runbook                                                                        |
| SEC-09  | Admin hardening            | M        | Cloudflare Access, 2FA, role, audit, no public surface                                                                             |
| SEC-10  | Rate limiting              | M        | Auth, OTP, checkout, webhook, leaderboard, support form, live planner                                                              |
| SEC-11  | Backups                    | M        | Encrypted daily DB backup to R2; restore drill quarterly; RPO ≤6h                                                                  |
| SEC-12  | Incident response          | M        | Runbook; 72h PDP breach notification; contact tree                                                                                 |
| SEC-13  | Provider keys              | M        | TomTom/BMKG/Mayar keys server-only; no client keys; rotation                                                                       |
| SEC-14  | Cost abuse                 | M        | Per-user live refresh/planner limits; global provider budget; alerts                                                               |
| PRIV-01 | Data minimisation          | M        | No NIK/phone/location/contacts/ad ID; data map in architecture                                                                     |
| PRIV-02 | Consent                    | M        | Marketing opt-in separate, unchecked; analytics consent where needed                                                               |
| PRIV-03 | Retention                  | M        | Account/order/log/backup retention defined and enforced                                                                            |
| PRIV-04 | DSR                        | M        | Export/delete/rectify/objection; 14-day target, ≤30 days                                                                           |
| PRIV-05 | Cross-border               | M        | Vendors disclosed; safeguards/consent per GR 33/2026                                                                               |
| PRIV-06 | Breach                     | M        | 72h notification to DPA/data subjects; runbook tested                                                                              |
| PRIV-07 | Children                   | M        | 13+; no chat/UGC; parental purchase guidance; no targeted ads                                                                      |
| OPS-01  | Environments               | M        | local/staging/production isolated; no prod secrets in CI logs                                                                      |
| OPS-02  | CI gates                   | M        | lint/type/test/build/e2e/security/perf required before merge                                                                       |
| OPS-03  | Deploy                     | M        | Atomic release, migrations expand/contract, rollback tested                                                                        |
| OPS-04  | Observability              | M        | Sentry + uptime + payment alert + backup alert                                                                                     |
| OPS-05  | Runbooks                   | M        | deploy, payment, backup/restore, incident, privacy request                                                                         |
| OPS-06  | Status page/changelog      | S        | Public known issues + changelog                                                                                                    |

---

## 10. Non-functional requirements

### 10.1 Performance budgets

| Surface                              | Budget                                                  |
| ------------------------------------ | ------------------------------------------------------- |
| Marketing LCP (4G mid-range Android) | ≤2.0 s                                                  |
| Marketing INP / CLS                  | ≤200 ms / ≤0.05                                         |
| Marketing initial JS                 | ≤150 KB gzip                                            |
| Game boot to menu                    | ≤5 s warm, ≤8 s cold on 4G mid-range                    |
| Game first playable                  | ≤10 s after menu                                        |
| Game frame rate                      | 60 fps target; ≥30 fps floor on low-end preset          |
| Draw calls                           | ≤150 mobile / ≤300 desktop                              |
| Triangles                            | ≤300k mobile / ≤800k desktop                            |
| Texture memory                       | ≤64 MB mobile / ≤256 MB desktop                         |
| Main-thread long tasks during play   | 0 >50 ms per 10 s window                                |
| Input-to-photon                      | ≤100 ms                                                 |
| Initial free download                | ≤15 MB; full free content ≤40 MB; paid pack incremental |
| API p95 from Jakarta                 | ≤600 ms (Europe origin + Cloudflare)                    |
| Webhook processing                   | ≤1 s p95; 200 returned quickly                          |
| Crash-free sessions                  | ≥99.5%                                                  |
| Uptime                               | ≥99.9% monthly (API); static via CDN                    |

### 10.2 Accessibility (WCAG 2.2 AA where applicable)

- Keyboard navigation for all web/menu surfaces; visible focus.
- Screen-reader labels for menus, settings, checkout, and report card.
- Canvas game provides non-visual route/score summaries and pause/menu access.
- Contrast ≥4.5:1 for text; traffic-light states use shape + label + colour.
- Reduced motion, screen-shake toggle, FOV comfort, flash-free.
- Subtitles/captions for audio cues and announcements.
- Text scaling ≥200% on web; in-game HUD scales.
- No reliance on colour, hearing, or two hands.

### 10.3 Reliability and data integrity

- Payment state machine is append-only and idempotent.
- No “paid but no entitlement” state; reconciliation job repairs or alerts.
- Every order/entitlement change has an audit record.
- Save corruption is detected and recoverable; previous save kept.
- Content version is recorded on every run.
- Deploy is atomic; previous release retained; rollback <5 min.

### 10.4 Maintainability

- TypeScript strict; no `any` in domain code without justification.
- Simulation is deterministic and framework-independent; renderer can be swapped.
- Shared contracts (Zod) between client/server; no duplicated price/entitlement logic.
- Game manifest and content schema allow adding a game without editing core API code.
- Documentation and runbooks updated with every phase.

---

## 11. Monetization specification

### 11.1 Offer

| Product           | Price (IDR, gross) | Contents                                                                                                                                       | Notes                                                                         |
| ----------------- | -----------------: | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Free**          |                  0 | One chosen route, all modes on that route, daily challenge, leaderboards, progression, core systems; scheduled/estimated conditions only       | Complete game on that route; no ads; one courtesy route change within 14 days |
| **All Maps**      |         **79,000** | Every Pejuang Nafkah map: Jabodetabek launch set + all Phase 3 city maps; all modes on every map; daily challenge/leaderboards                 | One-time, permanent; no Live data                                             |
| **Live**          |   **49,000/month** | All Maps + live traffic/incidents (TomTom), live weather/nowcast (BMKG), estimated crowding/transit delay, live briefing and real-trip planner | Recurring; implemented Phase 2; access until paid period ends; cancel anytime |
| **Cosmetic pack** |      15,000–25,000 | Outfits, helmets, bike skins, train card designs                                                                                               | No gameplay effect; optional                                                  |

- Prices are gross. If we are a PKP, PPN 11% is included and remitted; otherwise no PPN is charged. Confirm with an accountant.
- No ads, no loot boxes, no paid consumables, no paid leaderboard advantage, no “pay to avoid waiting”.
- A launch discount is allowed only if real and time-boxed; do not fake a countdown.
- Live is not sold until Phase 2 is implemented, the provider licences are signed, and the cost dashboard is live.
- All Maps includes Phase 3 cities. It does **not** include future games or spin-offs.

### 11.2 Free/paid boundary rules

- A free player can finish the entire chosen route, replay it forever, compete on its leaderboard, and experience the full emotional arc.
- All Maps is about **more places**; Live is about **more useful current conditions**. Neither sells “fun” or score.
- The paywall appears only after the player has experienced a complete run and understands the value; never before the first arrival.
- A Live subscriber who cancels keeps access until the end of the paid period. After expiry, maps revert to the free route unless All Maps was purchased separately.
- All Maps is permanent. Live expiry never revokes All Maps.
- Cosmetics never affect gameplay and are not required to “complete” the game.

### 11.3 Unit economics (planning estimate)

Using Mayar QRIS + Starter (2026-10-19 research):

- **All Maps:** Rp 79,000 gross − 2.2% = **Rp 77,262 net** per sale; no recurring provider cost.
- **Live:** Rp 49,000/month gross − 4.7% = **Rp 46,697 net/month**; provider + weather + infra ~Rp 4 juta/month at 10 corridors and 1,000 subs (~Rp 4k/sub), less at 30-min refresh.
- At 100 Live subs, provider/weather/infra can consume ~40–86% of net depending on refresh; run 30-min polling at this scale. At 1,000+ it is ~8–10%.
- Mayar Business (Rp 349k/month) becomes cheaper at ~712 active subs; re-check before switching.
- One-time sales fund the live layer and Phase 3; they are not a subscription substitute.

Full workings and source links: [live-data-and-Mayar research](research/2026-10-live-data-and-mayar.md).

### 11.4 Ethical rules

- No fake scarcity, fake “live” labels, or hidden renewals.
- Cancellation is as easy as subscribing; renewal reminders before charge where Mayar allows.
- Live data is optional and clearly separate from the single-player game.
- Refunds follow the published policy and statutory rights; subscription cancellation and refund are distinct.
- No selling email/waitlist data; no ad trackers.

---

## 12. Security and anti-fraud requirements (summary)

The full threat model is in `architecture.md` §11. Non-negotiable outcomes:

1. **Price tampering is impossible.** Client sends SKU; server reads price.
2. **Webhook forgery is rejected.** Mayar callbacks are treated as untrusted; the server re-fetches transaction/member state from Mayar, validates merchant/product/amount/customer, and never grants from the payload.
3. **Replay is harmless.** Unique Mayar transaction/member/event constraints; state machine; idempotent handler.
4. **Redirect tampering is ignored.** Only server-side order status/webhook grants.
5. **Entitlement forgery is useless.** Entitlements live in Postgres; paid content manifests/assets require a server check and short-lived signed URL.
6. **IDOR is blocked.** Every order/save/run is scoped to the session user; tests cover cross-user access.
7. **OTP abuse is bounded.** Per-email/IP rate limits, attempt caps, single-use, generic responses.
8. **Admin compromise is contained.** Cloudflare Access + 2FA + role + audit + no public admin route.
9. **Leaderboard cheating is costly.** Server-issued run token/seed; deterministic simulation; replay validation for top ranks.
10. **Secrets never reach the client.** Mayar, TomTom, BMKG (where applicable), OAuth, DB, JWT, and Resend secrets are server-only.

**Threats explicitly accepted:** a determined player can modify their own local client or extract free content; we protect paid content and leaderboard integrity, not the player's own single-player experience. We do not use invasive DRM.

---

## 13. Privacy and compliance requirements

- **Lawful bases:** contract (account/game), legal obligation (tax/accounting), consent (marketing/optional analytics), legitimate interest (security/fraud) with documented balancing.
- **Data map:** email, name, avatar URL, locale, IP hash, user agent, session metadata, saves, runs, **chosen free route**, orders, entitlements, **Mayar customer/member IDs**, **live planner inputs (origin/destination chosen from a list, not GPS)**, support emails, anonymous events.
- **No sensitive data:** no NIK, phone, address, precise location/GPS, health, biometrics, religion, sexual orientation, contacts, ad ID. Live planner never requests device location; the user picks a known corridor.
- **Retention:** account until deletion + 30 days; orders/tax records 10 years; subscription IDs until end + 90 days (tax 10 years); live planner inputs 30 days; live rider reports 90 days pseudonymous; logs 30 days; analytics 14 months; backups 30 days; IP hashes 30 days.
- **Rights:** access/export, correction, deletion, portability, objection, automated decision explanation. Target 14 days, max 30.
- **Cross-border:** netcup (EU region to be confirmed), Cloudflare, Mayar, TomTom, BMKG, Google, Resend, Sentry; disclose and use appropriate safeguards/consent.
- **Breach:** 72-hour notification to data subjects and DPA when required; incident runbook.
- **PSE:** register via OSS before public launch; display TDPSE status/contact.
- **IGRS:** self-classify 13+ with content descriptors; submit when IGRS resumes.
- **Consumer:** clear price, terms, refund, cancellation, support; no dark patterns; receipts; subscription renewal reminder.
- **Tax:** gross price; PPN 11% if PKP; personal income tax; accountant review; e-Faktur if required.

---

## 14. Content and authenticity requirements

Every content pack MUST include:

1. `contentVersion`, `effectiveFrom`, `retrievedAt`, `sourceIds`.
2. Route graph with named nodes, distances, lane counts, speed profile, turns, landmarks.
3. Station master with code, order, km, platform side, facilities, hub flag.
4. Rules table with fares, odd-even, busway, helmet, fines, door timing range.
5. Obstacle/scenario table with weights, telegraphing, counterplay.
6. Attribution/licence file (OSM ODbL, fonts, audio, voices).
7. QA sheet with confidence and known gaps.

**Authenticity checklist (must pass for each corridor):**

- [ ] Station names/order match the current official line at `effectiveFrom`.
- [ ] Door side and platform type are correct.
- [ ] Fares match the current formula.
- [ ] Busway is protected, not decorative.
- [ ] Angkot can stop in-lane.
- [ ] Traffic lights queue and drain.
- [ ] Odd-even affects car density/police, not the motorcycle rule.
- [ ] Flood points are plausible and dated.
- [ ] Landmarks are recognisable without official logos.
- [ ] No copied announcements, logos, or trade dress.
- [ ] Indonesian copy is reviewed by a native speaker.
- [ ] Volatile facts have two independent confirmations and a revalidation date.
- [ ] No real recent tragedy is used as entertainment.
- [ ] Humour is reviewed for punch-down risk; one joke per beat; serious failure gets no punchline.
- [ ] The Bang Nafkah narrator and the slogan/voice rules in `brand.md` are followed.
- [ ] Bang Nafkah is original: no real-person/celebrity likeness, official uniform, or operator logo.

---

## 15. Success metrics and validation

### 15.1 Playtest protocol

- 12–16 participants: 6 KRL commuters, 6 motorcyclists, 2 multimodal; gender-balanced; 20–45 years; at least 3 low-end Android devices.
- Session A: first-run observation, no instructions; measure one-hand completion, time to first decision, confusion points.
- Session B: 20-minute free play; interview “what felt real / what felt fake / what felt disrespectful”.
- Session C: two-week diary/telemetry (optional) for retention and daily habit.
- Evidence: recordings, notes, SUS/UX questionnaire, recognition score.

### 15.2 Product metrics

| Metric                            | Target                          | Instrumentation    |
| --------------------------------- | ------------------------------- | ------------------ |
| First-run completion              | ≥65%                            | event funnel       |
| One-hand completion without help  | ≥90%                            | playtest           |
| “Feels like my commute”           | ≥80%                            | survey             |
| D1 / D7 retention                 | ≥35% / ≥15%                     | anonymous cohort   |
| Median session                    | 6–12 min                        | telemetry          |
| Runs per active day               | ≥1.5                            | telemetry          |
| Daily challenge participation     | ≥20% DAU                        | telemetry          |
| All Maps conversion               | 2–5% of MAU                     | orders             |
| Live conversion                   | 1–3% of eligible active players | subscriptions      |
| Live data cost / active sub       | ≤Rp 5,000/month at 1,000+ subs  | provider dashboard |
| Live snapshot freshness (p95)     | ≤10 min peak / ≤35 min off-peak | live metrics       |
| Refund rate                       | <3% of paid orders              | orders             |
| Crash-free sessions               | ≥99.5%                          | Sentry             |
| p95 API latency (Jakarta)         | ≤600 ms                         | metrics            |
| Payment reconciliation mismatches | 0 unexplained                   | daily job          |

### 15.3 Quality gates

A phase is not done unless:

- Research brief/ADR and source-freshness gate are green; volatile facts are within their revalidation window.
- All MUST requirements in scope pass automated tests.
- Playwright evidence exists for desktop + mobile.
- No P0/P1 bugs; no console errors; no unhandled rejections.
- Performance budgets pass on reference devices/network.
- Live data: source licence/attribution recorded, `Live`/`Estimasi`/`Stale` labels verified, snapshot freshness/cache/cost caps pass, provider failure degrades safely.
- Security checklist passes; no critical/high findings.
- Accessibility checks pass (axe + manual keyboard/screen reader).
- Privacy/legal checklist passes for the phase.
- `status.md` updated with evidence links and known issues.

---

## 16. Release criteria (v1 Definition of Done)

1. Research brief/ADR for the release is current; sources, licences, costs, security, performance, and WNI experience evidence are stored.
2. Free route choice works end-to-end, both modes + multimodal, one-hand, offline-tolerant; free users can complete and replay their chosen route.
3. All Maps content is complete and server-gated; All Maps unlocks every current map including Phase 3 cities; no client-side unlock.
4. Google + email OTP auth, guest trial, account linking, deletion/export.
5. Mayar production payments working for one-time All Maps (QRIS + one e-wallet + one VA) and Live subscription; sandbox E2E evidence for both.
6. Mayar callback is verified by API re-fetch (not payload trust); replay/tamper tests pass; daily reconciliation clean; refund/cancel/expiry tested.
7. Live data adapters (TomTom traffic/incidents, BMKG weather/nowcast) pass cache, freshness, stale, budget-cap, and kill-switch tests; every value is labelled `Live`/`Estimasi`/`Stale` with source and timestamp.
8. Crowding/transit-delay estimates are labelled estimates; no “live occupancy” claim without an operator feed; PetaBencana only after a commercial licence.
9. Marketing site meets Core Web Vitals and accessibility budgets; legal pages live and reflect Mayar, subscription/cancellation, and the 79k/49k offer.
10. PSE registered; IGRS status documented; terms/privacy/refund published; tax treatment confirmed.
11. Backups + restore drill + incident runbook + payment runbook + live-provider incident runbook complete.
12. Monitoring/alerts live; support email monitored; response templates ready; provider-cost dashboard live.
13. 12+ playtest recognition ≥80%; one-hand completion ≥90%; D1 proxy ≥30% in beta.
14. No critical/high security findings; CSP enforced; secrets scanned.
15. Launch checklist signed in `status.md`.

---

## 17. Open decisions and assumptions (v4)

1. **Free-route change:** one chosen route, one courtesy change within 14 days, then All Maps required. Confirm before implementation.
2. **All Maps future maps:** includes every Phase 3 city map for Pejuang Nafkah; excludes future games/spin-offs. Confirm wording before publishing.
3. **Live scope:** live traffic/weather/incidents + estimated crowding/transit delay + planner. True live KRL/TransJakarta crowding/positions requires an operator partnership.
4. **Mayar KYC:** individual vs PT Perorangan; production approval, payout account, product/tier IDs, and whether a webhook signature/IP allowlist exists.
5. **Provider licences:** TomTom commercial terms for a game/derived data; PetaBencana commercial licence if the flood layer ships; Open-Meteo commercial fallback only if needed.
6. **Tax/PKP:** accountant confirms PPN 11% treatment; Mayar does not process sales tax.
7. **Cities:** Phase 3 order/shortlist (Bandung, Surabaya, Yogyakarta candidates) and per-city data/licence/cost gate.
8. **Support/identity:** KYC/legal business name, address, phone, and whether support moves from `wniseries@gmail.com` to a domain address.
9. **Live cost policy:** 30-min polling below ~300 subs; 5-min peak above; hard monthly provider budget and kill-switch behaviour.
