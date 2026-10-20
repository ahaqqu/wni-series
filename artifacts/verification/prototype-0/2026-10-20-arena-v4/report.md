# Arena v4 — inspect zoom verification (2026-10-20)

**Current arena:** iteration 5 adds the charge wind-up and push-direction fall poses; see the [v5 report](../2026-10-20-arena-v5/report.md). This report remains the v4 zoom evidence.

**Scope:** local, non-canonical arena at `/` in `games/pejuang-nafkah`. This pass adds a **render/HUD-only**
orthographic camera zoom so the character silhouettes, movement, push/fall, rings, and camera action can be inspected
closer. It makes no sim, timing, content, dependency, network, storage, analytics, or PII change.

**Decision/research:** [arena brief](../../../../docs/games/pejuang-nafkah/research/2026-10-push-hold-arena.md) §10
· [ADR-0010 camera-zoom amendment](../../../../docs/adr/0010-push-hold-arena.md)
· [README](../../../../games/pejuang-nafkah/README.md)
· [v3 camera/viral report](../2026-10-20-arena-v3/report.md)

## What changed

- Added `ARENA_ZOOM_MIN = 1`, `ARENA_ZOOM_MAX = 1.8`, an orthographic projection that divides `VIEW_HEIGHT` by the
  zoom, and `ArenaWorld.setZoom()`.
- Added a compact `− 1.0× +` HUD control under RESET. Minus/plus disable at the limits.
- Added two-finger pinch on the WebGL canvas, mouse-wheel zoom, **Z**/**X**, and `=`/`-`/numpad equivalents.
  Buttons step 0.2; pinch is continuous and clamped.
- Kept the camera centred on the arena: **no pan, no follow, no smooth transition**. The 1.8× cap preserves all four
  default-position characters at 390×844; 2.0× cropped the passive passenger.
- Zoom is a view preference: RESET, `R`, debug reset, and COBA LAGI keep the current value. It is not persisted.
  `window.__ARENA__.setZoom(value)` / `.zoom()` exist only with `?debug=1`.
- Existing camera/viral and station behavior are unchanged.

## Verification

Environment: local Vite dev server, headless Chromium (`/usr/bin/chromium`), 2026-10-20.

| Check | Result |
| --- | --- |
| Typecheck | `./node_modules/.bin/tsc --noEmit` — pass |
| Simulation suite | 18 arena + 17 station = **35 passed**; no new sim tests because the sim is untouched |
| Multi-page build | `vite build` — pass |
| Build sizes | arena **44.78 kB / 13.47 kB gzip**, CSS **33.61 kB / 7.32 kB gzip**, shared Three.js **579.83 kB / 146.54 kB gzip**, station **74.49 kB**, `index.html` 0.84 kB; usual 500 kB chunk warning |
| 390×844 default | `1.0×`; minus disabled; plus enabled |
| 390×844 plus ×5 | clamped to `1.8×`; plus disabled |
| Wheel | up/wheel-down changed `1.8× → 1.6×`; wheel-up returned `1.8×` |
| Keyboard | **Z** `1.0× → 1.2×`; **X** `1.2× → 1.0×`; min disabled again |
| Real headless two-finger pinch | CDP touch start/move on the canvas: `1.0× → 1.8×` (clamped); no page pinch/scroll |
| Reset persistence | RESET at `1.8×` kept `1.8×` and reset pushes to 0 |
| Debug bounds | `setZoom(9) → 1.8×`; `setZoom(-1) → 1.0×` |
| 320×700 layout | title right 202.5 px, zoom control left 222 px, no overlap; 24×24 px zoom buttons; `scrollWidth = 320` |
| Console | only the known favicon 404; no page errors |

## Captures

All captures are real Chromium renders. `02` was staged by placing B next to the player through the debug state,
then using the **real J key path** for a hard shove. The others are the untouched default/recording states.

| File | View | What it shows |
| --- | --- | --- |
| [00-zoom-1.0.png](screenshots/00-zoom-1.0.png) | 390×844 @2× | Default 1.0×; `− 1.0× +` control under RESET; all four characters and the full arena |
| [01-zoom-1.8-idle.png](screenshots/01-zoom-1.8-idle.png) | 390×844 @2× | Max 1.8×; all four characters fully visible; plus disabled; character/ring detail enlarged |
| [02-zoom-1.8-action.png](screenshots/02-zoom-1.8-action.png) | 390×844 @2× | 1.8× recording action: C red `MEREKAM`/`REC`, A threatening, B angry, player and B close; lower HUD covers some feet |
| [03-desktop-zoom-1.8.png](screenshots/03-desktop-zoom-1.8.png) | 1280×900 @1× | 1.8× desktop; C recording; control and arena fit the 540 px shell |

## What was not proven

- **No real-phone pinch/comfort/discoverability test.** The pinch evidence is headless CDP touch, not a physical
  device; headless FPS is SwiftShader-bound and is not a performance result.
- **No pan/follow.** At 1.8× a character can crop at the edge, especially at 320 px or while moving. The cap keeps
  the default tableau fully visible at 390×844 only. This is an inspect aid, not a camera system.
- **HUD layering at close zoom.** At 1.8× the lower bodies can sit under the timing/controls during an action; the
  captures show this. No HUD-aware framing or occlusion logic was added.
- **No easing.** Buttons/wheel/keyboard step immediately; pinch is continuous. No transition test.
- **No a11y audit.** The buttons have labels and 24 px minimum targets; the value has no full screen-reader
  announcement, no focus-trap change, and no axe run.
- **No station change.** The station page still loads and its 17 tests pass; zoom was not added there.
- **No video/Instagram/social change.** This pass does not alter the captured-still viral popup.
- **No draw-call/FPS measurement for zoom.** Zoom creates no Three.js objects, but no new render-profile claim is
  made. The earlier 44-call desktop viral capture is unchanged.

## Reproduction

```bash
cd games/pejuang-nafkah
pnpm dev
# open http://127.0.0.1:5173/?debug=1
```

Use the `− / +` control, pinch on the scene, the mouse wheel, or **Z / X** (plus `=`/`-`). At the default 390×844
viewport, four plus steps reach 1.8×. RESET keeps the view. For a scripted check:

```js
window.__ARENA__.setZoom(1.8);
window.__ARENA__.zoom(); // 1.8
```

## Conclusion

The zoom contract is verified for buttons, wheel, keyboard, real headless-touch pinch, both clamps, reset
persistence, and a 320 px layout. The implementation is deliberately small and render-only; it improves inspection
of the existing arena without changing the mechanic. A deeper zoom or player-follow camera should wait for real-phone
evidence and a pan/framing decision.
