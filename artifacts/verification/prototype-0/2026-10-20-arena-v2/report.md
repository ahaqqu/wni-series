# Arena v2 — charge, knockdown, revenge — browser evidence

**Current arena:** iteration 5 adds the charge wind-up and push-direction fall poses on top of the camera/viral result and v4 inspect zoom; see the [v5 report](../2026-10-20-arena-v5/report.md). This report remains the v2 evidence.

**Date:** 2026-10-20
**Scope:** standalone arena at `/` (one player, two passengers), with hold/release hard push, player/passenger
knockdowns, deterministic anger, and a faster revenge shove. Includes a regression check of `/station.html`.
**Decision:** [ADR-0010](../../../../adr/0010-push-hold-arena.md) (amended same day)
**Research:** [push/hold arena brief](../../../../docs/games/pejuang-nafkah/research/2026-10-push-hold-arena.md) §8
**Non-canonical:** local prototype only. No deploy, commit, real-device test, or playtest.

## What was verified

| Check | Command / environment | Result |
| --- | --- | --- |
| TypeScript | `./node_modules/.bin/tsc --noEmit` in `games/pejuang-nafkah` | pass |
| Sim tests | `./node_modules/.bin/vitest run` | **31 pass** (14 arena `AR-SIM-*`, 17 station `PA-SIM-*`) |
| Production build | `./node_modules/.bin/vite build` | pass; `index.html` + `station.html`; arena chunk 31.08 kB (9.79 gzip), station 74.49 kB, shared Three.js 555.94 kB (139.43 gzip); 500 kB warning on the shared chunk |
| Arena page | Chromium `/usr/bin/chromium`, 390×844 and 1280×900 | loads; no console/page errors other than a missing favicon 404 |
| Station page | Chromium `/station.html` | loads; start overlay present; arena link present; no page errors |
| Live tap push | mouse **DORONG** quick click | `pushCooldown > 0`, normal push, B slides but does not fall |
| Live charged push | mouse **DORONG** hold 0.95 s, release | charge 1, `LEPAS`, hard push, B thrown x 2.25 → 3.28 and `fallen` 1.05 → 0.72 after the capture; B angry |
| Live keyboard tap | `J` tap | one normal push (`lastPushHard false`) |
| Live keyboard hold | `J` hold 0.9 s, release | charge 1, hard push, B `fallen` 0.82, B angry |
| Live brace | mouse **TAHAN** / keyboard **K** in the green window | `perfect`; shoves 0 |
| Revenge timing | staged hard push of B | incoming kind `revenge`; lead 0.55 s; window 0.18 s; orange panel; B `MENGANCAM` |
| Revenge window | hold at the quick window | panel `is-quick is-window`; world rings teal; **TAHAN CEPAT** |
| Revenge block | hold through impact | `perfect`, perfects 1, shoves 0, B staggered, B revenge cleared |
| Player fall | staged normal shove with no hold | result `late`, shoves 1, player `fallen` 0.88; x −0.55 after capture; `KAMU JATUH. Bangkit...`; controls dim |
| Draw calls | arena idle / active | 25–30 (28 in the live keyboard capture, 30 in the desktop revenge capture) |

The screenshots are **staged** with `?debug=1`, `setPaused(true)`, direct state positioning, and fixed
`__ARENA__.step()` calls unless noted. The live smoke above used the actual pointer and keyboard handlers, not the
debug step API.

## Arena test coverage

`AR-SIM-01` movement bounds/body block · `AR-SIM-02` tap push displacement/cooldown, no fall · `AR-SIM-03` second
push ignored · `AR-SIM-04` aggressive telegraph · `AR-SIM-05` perfect brace · `AR-SIM-06` early hold fails,
re-press works · `AR-SIM-07` late/no hold stronger knockback + player fall · `AR-SIM-08` push interrupts the
wind-up · `AR-SIM-09` out-of-range miss · `AR-SIM-10` reset + deterministic replay (including press/release) ·
`AR-SIM-11` charge/release hard push, target fall, farther throw, anger · `AR-SIM-12` fallen player input lock and
recovery · `AR-SIM-13` hard-pushed B revenge trigger, 0.55 s lead / 0.18 s window · `AR-SIM-14` hold inside the
short revenge window blocks it.

## Captured states

All images are in [`screenshots/`](screenshots/). Dimensions 390×844 unless noted.

| File | State | Observed |
| --- | --- | --- |
| [00-arena-idle](screenshots/00-arena-idle.png) | idle after reset | three characters; A red/aggressive, B blue/passive; the new hint explains hold → release |
| [01-arena-charged](screenshots/01-arena-charged.png) | DORONG held 0.95 s | button **LEPAS** / `lepas: KERAS`; full charge; target ring on B; player slowed |
| [02-arena-hard-push-fallen](screenshots/02-arena-hard-push-fallen.png) | 0.32 s after release | B lying, B state **JATUH**, B alert/orange ring, `B marah. Dia akan balas.`, counter 1 |
| [03-player-fallen](screenshots/03-player-fallen.png) | no hold through a normal shove | player lying; `KAMU JATUH. Bangkit...`; joystick/DORONG/TAHAN dim |
| [04-revenge-telegraph](screenshots/04-revenge-telegraph.png) | B revenge incoming | orange timing panel **BALAS DENDAM · CEPAT**, `CEPAT. RING HIJAU.`, B `MENGANCAM`; orange timing rings; 0.55 s lead |
| [05-revenge-window](screenshots/05-revenge-window.png) | inside the 0.18 s window | panel/world rings teal; **TAHAN CEPAT**; hold button **SEKARANG!**; B `MENDORONG` |
| [06-revenge-perfect](screenshots/06-revenge-perfect.png) | hold through impact | `PAS`, perfects 1, shoves 0, B staggered, B revenge cleared |
| [07-desktop](screenshots/07-desktop.png) | 1280×900 quick-revenge read | portrait shell centred; charge/hold controls reachable; quick panel legible |

## What this does not prove

- **No real-phone test.** The two-thumb layout, ~0.5 s charge threshold, 0.30 s normal window, and especially the
  **0.18 s revenge window** are unvalidated on a real commuter phone. The 0.18 s window is the first thing to tune.
- **No one-hand evidence.** The arena deliberately does not meet the v1 one-hand MUST.
- **No performance result.** Headless Chromium uses SwiftShader here; the single-digit fps is not representative.
  Only draw calls (25–30) are recorded.
- **No a11y audit, video, E2E trace, network/offline check, or native review.**
- **No frame-data claim.** Push'em All and Clair Obscur are feel references; all new numbers are prototype tuning.
- **No station regression beyond page load.** The station's own 17 tests and [2026-10-20 report](../2026-10-20/report.md)
  cover its mechanics; this pass only checks the new multi-page build and HUD.
- **No shipping aggro model.** Anger is deterministic from impact + charge; every hard shove of B revenges. That is
  for repeatable testing, not a final AI.

## Reproduction

```bash
cd games/pejuang-nafkah
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vitest run
./node_modules/.bin/vite build

# dev server used for the captures
./node_modules/.bin/vite --host 127.0.0.1 --port 5173 --strictPort
# open http://127.0.0.1:5173/?debug=1
```

The debug API `window.__ARENA__` exposes `state()`, `reset()`, `step(seconds, overrides)`, `setPaused(value)`,
and `drawCalls()`. A push is now press/hold/release: `step(..., {push:true})` then `step(..., {push:false})`; a
debug call that leaves `push:true` only charges. The state is mutable for staging; it is not a save API.

## Conclusion

The arena now shows the requested chain: a shoved player is thrown farther and knocked down; DORONG can be held and
released for a heavier shove that throws a passenger farther and knocks them down; the hit passenger can get angry
and come back with a visibly faster revenge shove whose 0.55 s lead / 0.18 s window is a different read from the
normal 0.9 s / 0.30 s attack. It is still a local feel test with no real-phone evidence, and the quick timing is the
most likely thing to need retuning.
