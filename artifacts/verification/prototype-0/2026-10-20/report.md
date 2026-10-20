# Prototype 0 — push-and-hold, 2026-10-20

**Phase:** standalone Draft 0 mechanic spike (non-canonical; not a Phase 1 release gate)
**Base commit:** `e8b7d29d317f4440fd462efff74d56cbf4c88f4a` (the prototype itself is uncommitted in the working tree)
**Environment:** Node 26.7.0, pnpm 12.14.0, Chromium 1248 via Playwright 1.64.1, headless SwiftShader
**Screenshots:** [screenshots](screenshots) (390×844, plus 1280×900 desktop)

## 1. What was built

A playable browser greybox in `games/pejuang-nafkah`:

**South gate → ticket-gate queue → optional coffee → platform (three candidate front-car door zones) → train arrival → alighters → claim/board hold → seat/stand → result.**

The mechanic is a two-act hold:

- **Claim** on the platform: hold to push the claim marker forward, release to stop; crowd pulses push it back; the yellow line is a hard safety edge.
- **Board** after the alighters: hold to fill the boarding meter; release at full charge for **Hentak**; release early to stop.
- A station estimate names the front-car zone (A/B/C); the actual stop is revealed on arrival. Scrambling costs claim.
- Vulnerable passengers are abstract hearts. Holding near one builds a camera warning; releasing in time protects them (+12 gengsi, −24 energy), holding too long triggers the silent viral fail.
- Two waves at 1:30/3:30; 4:00 hard limit; quick retry.

Stack: Vite 8.3.4, Three.js 0.186.1, TypeScript 6.0.3 in the game package, Vitest 5.0.5. Pure `sim/`, Three.js `render/`, disposable DOM HUD at 10 Hz.

## 2. Commands and results

Run in `games/pejuang-nafkah`.

| Command | Result |
| --- | --- |
| `pnpm typecheck` | pass (`tsc --noEmit`, no output) |
| `pnpm test` | **17 passed** / 1 file, 49 ms; `src/sim/simulation.test.ts` |
| `pnpm build` | pass in 380 ms; `dist/assets/index-swsk2Cmp.js` 629.23 kB (gzip 162.47 kB), CSS 17.99 kB (gzip 4.45 kB); normal >500 kB chunk warning from Three.js |
| `pnpm dev` | Vite dev server; page loads; no page errors in the capture runs |
| `pnpm verify:docs` | pass: 66 files linted, 202 links, scaffold OK |
| `pnpm verify` (root) | pass: docs, lint, typecheck, 17 game + 4 API tests, platform/api/game builds |

Test names (requirement IDs are in the test titles):

```text
PA-SIM-01 energy is only spent while holding; gate cutting is a real trade
PA-SIM-02 claim must survive the surge and clear the safe floor at arrival
PA-SIM-03 holding against the surge costs energy and moves the claim forward
PA-SIM-04 intentional yellow-line crossing is a whistle and gengsi loss
PA-SIM-05 a crowd shove over the line is not the player’s fault
PA-SIM-06 alighters go first; pushing the outflow costs gengsi
PA-SIM-07 release at full charge performs a Hentak burst
PA-SIM-08 camera warning reaches viral and zeroes gengsi
PA-SIM-09 gengsi can reach zero from ordinary cuts and ends the run
PA-SIM-10 two waves: first miss becomes a second, denser platform
PA-SIM-11 missing the second train is a hard time fail at 4:00
PA-SIM-12 a wrong door zone can be scrambled at the last second
PA-SIM-13 releasing during the protect window protects instead of filming
PA-SIM-14 coffee is an optional energy/gengsi trade with a time cost
PA-SIM-15 first-in chooses seat or standing; seat pays energy and score
PA-SIM-16 score is position plus remaining gengsi, capped
PA-SIM-17 same seed and same input replay identically
```

## 3. Visual/interaction review

A debug-driven real-time run reached the board with `claim 0.914`, `energy 79.2`, `gengsi 85`, and `canBoard true` after cutting the gate for 2 s, buying coffee, and holding during crowd surges. No page errors were logged.

The final screenshots are captured from the running build with `?debug=1` and `setPaused(true)`; individual states were staged through the debug API so the HUD, camera, train state, and crowd markers are legible. They are **UI/render evidence**, not a claim of an uninterrupted 4-minute playthrough. The simulation behavior is covered by the 17 tests above.

What reads well:

- The 3/4 diorama makes the platform, yellow line, gate queue, concourse, train, and interior readable in portrait.
- The player is visually distinct (teal top/orange bag) and stays in front of the crowd; the vulnerable hearts are visible.
- The claim meter switches from **BELAKANG / GARIS KUNING** to **DORONG / PINTU** at boarding, so the second act is legible.
- The protect window, camera warning (red vignette + `LEPAS` action), and protected state (heart gone, +12 gengsi) are distinct.
- The viral result shows no victim close-up; the phone frame is deliberately empty and the copy is quiet. The success result clearly states the stored position.

Known visual issues:

- The coffee cart screenshot has the player posed beside the cart; in normal walking the cart can occlude the player for a moment.
- The interior seat highlight is subtle at the current camera scale; the bottom sheet carries the choice.
- The HUD is intentionally plain DOM and will be replaced if the mechanic graduates.
- The 3D is greybox; the interior is a plausible sketch, not a measured car.

## 4. Performance

- Renderer: one scene, merged low-poly station/train/crowd geometry. The debug API reports 8 draw calls at the ready screen and 44 at the board pose; the peak varies with the visible crowd/train/interior.
- Bundle: 629.23 kB JS / 162.47 kB gzip; CSS 17.99 kB / 4.45 kB gzip. Static local page; no network calls at runtime.
- **No real-device FPS evidence.** Headless Chromium here uses SwiftShader and reports single-digit FPS, which is not representative and is not used as a budget result. The 60 fps target / 30 fps floor remains unproven; the low-end Android and iPhone tests are still pending.

## 5. Accessibility and input

- One-hand layout: the action pad, zone switch, coffee, and seat/stand controls are in the bottom portion; the top bar is read-only.
- Keyboard: Space (hold), A/D or arrows (zone), C (coffee), 1/2 (seat/stand), R (retry).
- `prefers-reduced-motion` disables camera shake and shortens camera moves; the capture used the default motion setting.
- No axe run, no screen-reader pass, no touch-target measurement on a real device. `user-scalable=no` in the viewport should be revisited before any public build.
- Pointer cancel and hidden-tab pause are handled; WebGL context loss shows a fatal card rather than a blank page.

## 6. Privacy, security, content

- Local static page only: no auth, accounts, payments, analytics, cookies, network calls, PII, or secrets. No third-party scripts, fonts, or trackers.
- Real place names (Jurangmangu, Rangkasbitung) are descriptive; no official KAI/Commuter logo, trade dress, announcement, or copied asset.
- OSM data: © OpenStreetMap contributors, ODbL 1.0. Station geometry is an authored approximation from OSM and reference photos, not a survey.
- Wikimedia Commons reference photos are CC BY-SA 4.0 / CC BY 4.0, reference only, not textures; the local copies in `artifacts/research/jurangmangu-2026-10/` are not shipped.
- Placeholder values: fare Rp 3.000, coffee Rp 10.000, headway and crowding are authored, visibly labelled in the UI. The specific platform/track, front-car stop, door markers, and formation are unconfirmed.
- Tone: vulnerable passengers are hearts, not faces; no victim close-up, no comic sound, no reward for harm. The viral beat still needs native/sensitivity review before any public playtest.

## 7. Evidence inventory

| File | State |
| --- | --- |
| `screenshots/00-start.png` | start overlay, rules, prototype labels |
| `screenshots/01-gate.png` | gate queue, fare, cut prompt |
| `screenshots/02-concourse-coffee.png` | coffee cart and one-tap coffee |
| `screenshots/03-platform.png` | platform crowd, estimate, claim meter, hearts |
| `screenshots/04-arrival.png` | train arriving, doors closed, actual zone revealed |
| `screenshots/05-board-protect.png` | open doors, protect window, LINDUNGI |
| `screenshots/06-camera-warning.png` | camera warning, red vignette, LEPAS |
| `screenshots/07-protected.png` | protected result, heart removed, gengsi +12 |
| `screenshots/08-interior-seat.png` | interior, one-tap seat/stand sheet |
| `screenshots/09-result-success.png` | success result and stored position |
| `screenshots/10-viral-toast.png` | silent viral toast |
| `screenshots/11-viral-result.png` | viral result with empty phone frame |
| `screenshots/12-desktop-start.png` | 1280×900 desktop start |
| `screenshots/13-desktop-platform.png` | desktop platform/HUD |
| `screenshots/14-desktop-board.png` | desktop board/protect window |

## 8. Gate assessment

| Gate | Result |
| --- | --- |
| Research brief + ADR for the prototype | green (2026-10-20) |
| Deterministic sim tests | green (17/17) |
| Game typecheck/build | green |
| Docs/link/scaffold | green (`pnpm verify:docs`: 66 files, 202 links, scaffold) |
| Root pipeline | green (`pnpm verify`: docs/lint/typecheck/tests/build) |
| No console errors in capture | green |
| Visual mobile + desktop review | green for the staged states |
| Real-device 60/30 fps | **not run** |
| One-hand commuter test | **not run** |
| Accessibility/axe/screen reader | **not run** |
| E2E trace/video | **not run** |
| Offline/service-worker | **not run** (no SW; local page) |
| Native/sensitivity review | **not run** |
| Production deploy/security review | **out of scope**; local only |

## 9. Known issues / next steps

1. Open the build on a real phone and play one-handed; record the hold/drag, gate cut, coffee window, protect release, and board window.
2. Run 5–8 commuter playtests; capture whether players can explain a failure, whether the hold is tiring, and whether the door read feels fair.
3. If the mechanic graduates, write the spec/ADR change, then re-run the full Phase 1 research gate; the hard fail, energy, and viral rules are non-canonical.
4. Native/sensitivity review of the viral beat before any public exposure.
5. Add a real-device FPS trace, axe pass, offline check, and a short video after the first two steps.
6. The screenshots in this report are staged UI states; keep the 17 sim tests as the behavior contract until an E2E harness exists.

This is a **local Draft 0**. It is not a release, not a canonical game, and not a Phase 0/1 gate closure.
