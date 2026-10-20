# Push-and-hold prototype (Draft 0) — research brief

**Status:** current for 2026-10-20. Prototype pre-flight, not a release gate and not Phase 1 evidence.
**Decision:** build a standalone browser greybox for the two-act **claim → board** mechanic at Jurangmangu, with no server, accounts, payments, live data, or production deploy.
**Owner:** WNI Series
**Related:** [specs.md](../specs.md) · [design.md](../design.md) · [brand.md](../brand.md) · [ADR-0001](../../../adr/0001-research-first.md) · [ADR-0009](../../../adr/0009-push-hold-prototype.md)

> This prototype is deliberately **non-canonical**. It uses a hard fail, a run-only energy stat, and a viral social fail that do not match the v1 KRL rules. If the mechanic graduates, those conflicts require a separate spec decision and the full Phase 1 research gate.

---

## 1. What this prototype is

One short, replayable run at **Stasiun Jurangmangu (JMU)**:

**South gate → ticket-gate queue → optional coffee → platform (three candidate front-car door zones) → train → alighters → push/hold → board → seat/stand → result.**

The prototype tests four things:

1. Is the **two-act hold** readable and tense with one thumb: claim a spot behind the yellow line, then convert it into a boarding position?
2. Does the **hybrid push** work: sustained lean, with a full-charge release (`Hentak`) as a risky burst?
3. Is the **three-zone door read** a fair read, not a coin flip, when the station estimate can be wrong?
4. Does the **viral fail** register as a serious consequence without turning vulnerable passengers into a joke?

It does **not** test the full commute, the in-train stage, the drama layer, live data, payments, accounts, or the public site.

## 2. Evidence and sources

| Source | Used for | Confidence / limits |
| --- | --- | --- |
| [Push'em All — App Store](https://apps.apple.com/se/app/pushem-all/id1479551182?l=en-GB) (retrieved 2026-10-20) | One-tap action; push enemies with a stick; force/ragdoll reference | Official store copy, but the game is an arena-clearing game, not a queue/hold game |
| [iOSGames — Push'em All](https://iosgames.net/Pushem-all/) (retrieved 2026-10-20) | Player description: hold then release the move control; gold bar = massive push; giants/traps | Third-party review, not an official mechanic specification |
| [Stasiun Jurangmangu — Wikipedia ID](https://id.wikipedia.org/wiki/Stasiun_Jurangmangu) (retrieved 2026-10-20) | Two high side platforms; track 1 toward Tanah Abang; track 2 toward Serpong–Rangkasbitung; south-side entrance; BXc pedestrian tunnel; 2024 revitalization | Community encyclopaedia; station order/door side still needs operator confirmation |
| [OpenStreetMap node 318720710](https://www.openstreetmap.org/node/318720710) (retrieved 2026-10-20) | Station coordinates, name, `JMU`, operator tag, platform tags | ODbL; good exterior geometry, sparse interior detail |
| [Wikimedia Commons — Jurangmangu Station](https://commons.wikimedia.org/wiki/Category:Jurangmangu_Station) (retrieved 2026-10-20) | South-gate, platform 2, and access-road reference photographs | CC BY-SA 4.0 / CC BY 4.0; reference only, not textures; attribution required if reused |

### What is confirmed

- The station is **at grade**, with two high side platforms and two tracks.
- The south side has the entrance/parking frontage used in this prototype.
- A pedestrian connection exists toward Bintaro Jaya Xchange (the so-called Sunken Gate).
- Real place names and `JMU` are descriptive facts; no KAI/Commuter logo, trade dress, or copied announcement is used.

### What is approximate

- Number and arrangement of ticket gates, queue rails, and the coffee kiosk.
- Exact stopping point of a car door, door markers, and front-car formation.
- Actual morning headway and crowding. The prototype compresses time and uses two authored train waves.
- Fare and coffee price. The prototype uses clearly labelled placeholder values; no real tariff is claimed.

## 3. Prototype design contract

### 3.1 Loop and timing

- Run limit: **4:00**.
- Train waves: **1:30** and **3:30**.
- Board the first train: run ends successfully.
- Miss the first: the platform crowd grows; the second wave is denser and the front-car stop is re-rolled.
- Miss the second, or reach 0 gengsi, or reach 4:00 still outside: run ends in failure.
- No accounts, no persistence, no leaderboard. A local retry is enough for the test.

### 3.2 Three candidate front-car door zones

The three platform zones (A/B/C) are candidate stops for the **front car door**. The train extends to the right, so a zone can be the front car, a later car, or empty platform if the train stops further right.

- A station board shows `Perkiraan pintu depan: <zone>`. It is an estimate and can be wrong.
- The train's actual stop is revealed as it arrives. The player can scramble to another zone, but loses the claimed spot.
- The front car gives the best position. Boarding a later car still completes the run at a lower position score.
- The actual stop and the estimate are seeded per run; the same input/seed reproduces the same result.

This turns the choice into a read: the estimate, the crowd movement, and the train's visible doors all matter. It is not a hidden random door.

### 3.3 Two-act hold

**Act 1 — Claim (behind the yellow line).**

- The player holds/releases to keep a position marker inside a safe band between "pushed to the back" and "over the yellow line".
- Crowd pulses push the marker backward. Holding pushes it forward and drains energy.
- If the marker leaves the back of the band, the spot is lost; the player restarts at the back of the queue.
- If the marker crosses the yellow line before the train stops, a whistle and gengsi penalty reset the claim. If the crowd pushed the player across, no penalty.
- The wait is two or three pulses, not a continuous 90-second button-hold.

**Act 2 — Board (after the train stops).**

- Alighters come out first. Pushing during the outflow costs gengsi and pushes the player back.
- After the outflow, the boarding window opens. Hold to push; the boarding meter fills against crowd resistance.
- Releasing at full charge triggers **Hentak**: a burst that adds boarding progress, spends extra energy, and risks a stumble. Releasing early simply stops.
- If the player is at an empty zone, they must scramble to a zone with a door or miss the train.
- The first player through the front-car door gets the best spot.

### 3.4 Inside choice

The first-in at a car gets a one-tap choice, if a seat is available:

- **Duduk** — seat: future energy.
- **Berdiri** — standing: choose pole/stability or door/exit by position.
- If the player is not first, or no seat is free, the spot is assigned automatically.

For v0 the result stores a `Posisi` profile: `seat`, `pole`, `door`, or `deep`, with future trade-offs (energy / stability / exit speed). The in-train stage is out of scope.

### 3.5 Resources and social rules

- **Energi:** run-only stamina, resets every run, never purchasable with real money. Holding, Hentak, cutting, and protecting spend it.
- **Gengsi:** social face/score. Line cuts, shoving, and camera warnings reduce it; coffee and protecting raise it. **Any** gengsi loss can reach 0 and end the run.
- **Rupiah:** fare + optional coffee. Placeholder fare/price, visibly marked as prototype values.
- **Vulnerable passengers:** shoving one is possible but marked; a camera warning gives a chance to release/steer away. Continuing triggers a silent viral fail and gengsi 0. If another passenger is about to shove someone, the player can hold to protect, spending energy and position for gengsi. No victim close-up, no comic sound, no reward for harm.
- **Body diversity:** body mass is physics, not personality. Aggression is independent of body type. No weight-based jokes or labels.

### 3.6 Controls and HUD

- Portrait, one thumb, controls in the bottom 40%.
- Hold the large pad to push/claim/anchor; slide left/right to switch zones; release early to stop; release at full charge to Hentak.
- Gate payment is automatic on approach (with a visible fare deduction); coffee is one tap; seat/stand is one tap.
- HUD: clock/next train/rupiah at the top (read-only), energy and gengsi near the pad, a claim/door marker in the world, and contextual `TAHAN` / `DORONG` / `HENTAK` labels.
- Keyboard for desktop: Space to hold, A/D or ←/→ to switch zones, C for coffee, 1/2 for seat/stand.
- Reduced-motion option: no camera shake; camera cuts become crossfades.

## 4. Technical approach

- **Stack:** existing workspace pins — Three.js `0.186.1`, Vite `8.3.4`, TypeScript `6.0.3` in the game package (workspace dev tooling `7.0.2`), Vitest `5.0.5`, Node 26.
- **Simulation:** deterministic, fixed 60 Hz, pure TypeScript in `sim/`; no DOM or Three.js imports; seeded PRNG; the same seed and explicit inputs replay identically; a persisted input log is not implemented in Draft 0; no `Math.random`, `Date.now`, or `performance.now` inside the sim.
- **Rendering:** Three.js isometric orthographic diorama; one scene; merged low-poly crowd geometry; no ragdoll; procedural lean/stumble animation. 20–30 agents.
- **HUD:** DOM overlay, 10 Hz updates, no React dependency for v0. This is a deliberately disposable prototype decision; the sim/render boundary is the reusable part.
- **Performance targets:** 60 fps target, 30 fps floor; draw calls and frame time recorded in the evidence note; mobile real-device test still pending.
- **Security/privacy:** no network, no analytics, no cookies, no PII, no auth/payments, no secrets. Static local build only.
- **Cost:** zero incremental; no provider calls, no VPS deployment, no paid assets.
- **Robustness:** WebGL context loss, asset-free fallback, resize/orientation, pointer cancel, hidden-tab pause; the prototype is a local static build.
- **Data:** station graph is authored from OSM/photos with `confidence` and `approx` flags; OSM attribution and CC photo credits are recorded. No official logos or copied announcements.

## 5. Test and evidence plan

- Unit tests for energy, claim band, yellow-line penalty, alighters-first, Hentak, viral fail, gengsi 0, two-wave timing, door-zone empty state, score, and deterministic replay.
- Build/typecheck/lint gates.
- Chromium playtest at 390×844 and desktop; screenshot the start, claim, board, seat choice, viral fail, and result.
- Manual one-hand test on a real phone; record whether the hold/drag works with a thumb and whether any control is in the top third.
- 5–8 commuter playtests after the greybox: can they explain why they failed, did the hold feel tense rather than tiring, did the door read feel fair, did the viral fail feel serious rather than mocking?

## 6. Risks and stop conditions

- **Tone:** if the viral fail feels like exploiting a vulnerable person for entertainment, remove or rewrite the beat before any public exposure. Native/sensitivity review is required before release.
- **Fun:** if the two-act hold is not readable, simplify to one hold or a clearer claim band; do not add more bars.
- **Fairness:** if the three-zone read feels random, reduce to two zones or make the estimate always correct in Santai mode.
- **Performance:** if the low-end phone misses 30 fps, cut crowd count, shadows, or pixel ratio before adding art.
- **Data:** exact gate, kiosk, and door positions remain unverified. This brief does not lock content; the full Phase 1 gate is still required.
- **Scope:** this prototype is not a Phase 1 build and does not change the v1 specs. It is a mechanic spike with a disposable HUD and placeholder art.

## 7. Approval

The user approved a **standalone Draft 0** prototype and the rules above on 2026-10-20. No production deployment, public launch, or v1 spec change is authorised by this brief.
