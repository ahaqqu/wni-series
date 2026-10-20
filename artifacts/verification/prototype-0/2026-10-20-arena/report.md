# Arena push/hold — browser evidence

> **Iteration 1.** This report covers the original tap push + hold arena.
> For the current arena with charge/release hard push, knockdowns, and the revenge quick shove, see the
> [v2 report](../2026-10-20-arena-v2/report.md). The v1 screenshots and results below remain historical evidence.

**Date:** 2026-10-20
**Scope:** the standalone arena at `/` (one player, two passengers), plus a regression check of `/station.html`.
**Decision:** [ADR-0010](../../../../adr/0010-push-hold-arena.md)
**Research:** [push/hold arena brief](../../../../docs/games/pejuang-nafkah/research/2026-10-push-hold-arena.md)
**Non-canonical:** local prototype only. No deploy, commit, real-device test, or playtest.

## What was verified

| Check | Command / environment | Result |
| --- | --- | --- |
| TypeScript | `./node_modules/.bin/tsc --noEmit` in `games/pejuang-nafkah` | pass |
| Sim tests | `./node_modules/.bin/vitest run` | **27 pass** (10 arena `AR-SIM-*`, 17 station `PA-SIM-*`) |
| Production build | `./node_modules/.bin/vite build` | pass; `index.html` + `station.html`; Three.js chunk warning (~556 kB) |
| Arena page | Chromium `/usr/bin/chromium`, 390×844 and 1280×900 | loads; no page errors |
| Station page | Chromium 390×844 `/station.html` | loads; start overlay present; no page errors |
| Live movement | mouse drag on the joystick | player x 0 → 1.20 |
| Live push | mouse click **DORONG** and keyboard **J** | one hit each; status `DORONG. Ruang terbuka.` |
| Live timed hold | mouse **TAHAN** and keyboard **K** in the green window | `perfect`; shoves 0 |
| Draw calls | arena idle / active | 25 / 29 |

The arena screenshots were staged with `?debug=1`, `setPaused(true)`, direct state positioning, and fixed
`__ARENA__.step()` calls. They are **not** a recording of hand-played runs. The live smoke above exercised the
actual pointer and keyboard controls.

## Arena test coverage

`AR-SIM-01` movement bounds/body block · `AR-SIM-02` push displacement/cooldown · `AR-SIM-03` second push ignored ·
`AR-SIM-04` aggressive telegraph · `AR-SIM-05` perfect brace · `AR-SIM-06` early hold fails, re-press works ·
`AR-SIM-07` late/no hold knockback · `AR-SIM-08` push interrupts the wind-up · `AR-SIM-09` out-of-range miss ·
`AR-SIM-10` reset + deterministic replay.

## Captured states

All images are in [`screenshots/`](screenshots/). Dimensions 390×844 unless noted.

| File | State | Observed |
| --- | --- | --- |
| [00-arena-idle](screenshots/00-arena-idle.png) | idle after reset | three characters; A red/aggressive, B blue/passive; timing panel hidden |
| [01-arena-telegraph](screenshots/01-arena-telegraph.png) | 0.45 s into a 0.9 s wind-up | red ring, `MENGANCAM`, "Tunggu ring hijau" |
| [02-arena-window](screenshots/02-arena-window.png) | t = 0.75 s, green window | ring/panel green, **TAHAN SEKARANG**, hold button lit |
| [03-arena-perfect](screenshots/03-arena-perfect.png) | hold pressed in window | `PAS`, perfects 1, shoves 0, A staggered |
| [04-arena-failed](screenshots/04-arena-failed.png) | no hold through impact | `TELAT`, shoves 1, player knocked to x ≈ −0.76 |
| [05-arena-push](screenshots/05-arena-push.png) | push after target ring | B pushed from x 1.0 → 1.28; `DORONG`; counter 1 |
| [06-arena-interrupt](screenshots/06-arena-interrupt.png) | push during wind-up | `DIBLOK`; incoming cleared; A staggered |
| [07-arena-desktop](screenshots/07-arena-desktop.png) | 1280×900 idle | portrait shell centred; controls reachable |

## What this does not prove

- **No real-phone test.** The two-thumb layout and the 0.9 s lead / 0.30 s window are unvalidated on a real
  commuter phone. Timing may need to be lengthened.
- **No one-hand evidence.** The arena deliberately does not meet the v1 one-hand MUST.
- **No performance result.** Headless Chromium uses SwiftShader here; the single-digit fps is not representative.
  Only draw calls (25–29) are recorded.
- **No a11y audit, video, E2E trace, network/offline check, or native review.**
- **No frame-data claim.** Push'em All and Clair Obscur are feel references; the numbers are tuned to the prototype.
- **No station regression beyond page load.** The station's own 17 tests and [2026-10-20 report](../2026-10-20/report.md)
  cover its mechanics; this pass only checks the new multi-page build and HUD.

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
and `drawCalls()`. The state is mutable for staging; it is not a save API.

## Conclusion

The arena does what the user asked for at the mechanic level: one player, exactly two passengers, movement, a
physical shove on either passenger, an aggressive passenger that shoves back, and a hold that only works with
timing. It is a local feel test, not a game, and it still needs a real-phone two-thumb test and a timing/tone pass
before it can inform v1.
