# Arena v5 — charge wind-up and fall-away animation — browser evidence

**Current arena:** this report is the current animation evidence. The earlier camera/zoom reports remain historical.

**Date:** 2026-10-20
**Scope:** local, non-canonical arena at `/`. This pass fixes two **render-only** character poses:

1. Holding **DORONG** visibly loads the player backward while `pushCharge` fills, similar to passenger A's shove
   wind-up.
2. A shoved character now falls **away from the pusher**, with the back side on the floor, instead of pitching
   face-first.

**Decision/research:** [ADR-0010 animation amendment](../../../../docs/adr/0010-push-hold-arena.md) ·
[arena brief §11](../../../../docs/games/pejuang-nafkah/research/2026-10-push-hold-arena.md) ·
[v4 zoom report](../2026-10-20-arena-v4/report.md)

## What changed

### Charge wind-up

- `ArenaWorld.update()` reads the existing sim fields `player.pushHeld` and `player.pushCharge`.
- While charging, the player body rotates backward by up to **0.26 rad**, shifts **0.07 local units** back, and
  lowers the root by **0.015 units**. The pose scales continuously with charge; full charge is visible while the HUD
  shows `LEPAS`.
- On release the old `pushFlash` forward lean and lunge take over, so the sequence reads **load → release → push**.
- This uses the same whole-body lean language as A's `windupLean` (0.22 rad). No new meshes, textures, assets,
  dependencies, or sim fields were added.

### Fall away from the pusher

- The old hard-coded `-1.35` / `-1.3` body X rotation (face-first) is removed.
- On the first frame of `fallen`, the world latches a fall direction from the character's knockback velocity
  (`vx`, `vz`). If velocity is too small, it falls back to local backward (`facing`).
- The body is tilted around a horizontal axis perpendicular to that direction using a quaternion. This means:
  - a face-to-face shove puts the **back on the floor**;
  - a side hit falls sideways;
  - a hit from behind falls forward (physically correct for that case).
- A short render-only blend (about 0.1 s to fall, 0.1 s to recover) avoids the instant snap. The latch is cleared
  after get-up. Player, A, and B use the same path; C is not pushable.
- The sim still owns `fallen`, velocity, facing, and timers. The change is presentation only.

## Verification

Environment: local Vite dev server, headless Chromium (`/usr/bin/chromium`), 390×844 at 2×, 1.8× inspect zoom,
2026-10-20.

| Check | Result |
| --- | --- |
| TypeScript | `./node_modules/.bin/tsc --noEmit` — pass |
| Sim suite | 18 arena + 17 station = **35 passed**; no sim tests added because the sim is untouched |
| Production build | `vite build` — pass |
| Build sizes | arena **46.32 kB / 13.99 kB gzip**, CSS **33.61 kB / 7.32 kB gzip**, shared Three.js **579.84 kB / 146.54 kB gzip**, station **74.49 kB**; usual 500 kB warning |
| Charge input | Real **J** hold 850 ms: `pushHeld=true`, `pushCharge=1`, `pushes=0`; screenshot `00` shows the loaded lean and full HUD |
| Player fall input | Real A shove (player facing A): `brace.result='late'`, player `fallen=0.58`, `facing=0`, `vz=0.98`; screenshot `01` |
| Player get-up | After the fall ended: `fallen=0`; screenshot `02` shows the upright restored pose |
| Passenger fall | Deterministic hard shove via debug `step(0.8,{push:true})` then `step(0.02,{push:false})`: `lastPushHard=true`, `hit=2`, B `fallen=1.03`, `vx=10.63`; screenshot `03` (sim paused to hold the frame) |
| Fall direction probe | Temporary instrumentation measured player back point **y=0.09** vs front **y=0.54**, and B back **y=0.019** vs front **y=0.468** at full fall. Back is on the floor. Instrumentation was removed. |
| Console | Only the known favicon 404; no page errors |

The real-J hard-shove path itself was separately smoke-checked (`hard=true`, B `fallen=1.03`). Screenshot `03` uses
the deterministic step so the fall frame is reproducible; it is not a claim that the screenshot was taken from a
real key press.

## Captures

| File | State | What it shows |
| --- | --- | --- |
| [00-charge-full.png](screenshots/00-charge-full.png) | 390×844 @2×, 1.8× | Real J held to full charge, player side-on to camera, body loaded backward, HUD `LEPAS` |
| [01-player-fall-back.png](screenshots/01-player-fall-back.png) | 390×844 @2×, 1.8× | Player falls away from A, back down; HUD `KAMU JATUH` |
| [02-player-recovered.png](screenshots/02-player-recovered.png) | 390×844 @2×, 1.8× | Player upright again after get-up; body pose restored |
| [03-passenger-fall-back.png](screenshots/03-passenger-fall-back.png) | 390×844 @2×, 1.8× | B falls away from the player after a hard shove; C goes `SIAP`; B back down |

## What was not proven

- No real-phone visual/comfort test; no performance or a11y audit. Headless Chromium is SwiftShader-bound, so no FPS
  claim.
- No screenshot of A falling, though it uses the same `updatePassengerFall` path as B.
- No automated render/animation tests. The evidence is screenshot + state inspection.
- No physical ragdoll: feet remain the pivot, the body is a single merged mesh, and the backpack/bag can read oddly
  at some angles. The fall angle and 0.1 s blend are feel guesses.
- The charge lean is depth-dependent: it is most readable when the player is side-on to the camera; a head-on charge
  is subtler.
- No reduced-motion check for the fall blend; `prefers-reduced-motion` currently makes the blend instant rather than
  removing the pose change.
- The fall direction is latched from knockback velocity at the first fallen frame. A hit received while already
  moving may carry a little of that movement into the fall vector.
- No station change; the station page and its 17 tests remain green.

## Reproduction

```bash
cd games/pejuang-nafkah
pnpm dev
# http://127.0.0.1:5173/?debug=1
```

- Hold **DORONG / J** while standing side-on; the player loads back until `LEPAS`, then lunges on release.
- Let A shove you face-to-face without bracing: you should fall backward, not face-first.
- Hard-shove B while facing it: it should fall away from you.

## Conclusion

Both requested corrections are implemented in the render layer: holding push now has a visible wind-up, and push
falls are oriented by knockback rather than a fixed face-down rotation. The simulation is unchanged, all 35 tests
pass, and the fall direction is verified by both state and a temporary geometric probe.
