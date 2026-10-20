# Arena v3 — camera bystander and viral game over — browser evidence

**Current arena:** iteration 5 adds the charge wind-up and push-direction fall poses on top of the v4 inspect zoom; see the [v5 report](../2026-10-20-arena-v5/report.md). This report remains the v3 evidence.

**Date:** 2026-10-20
**Scope:** standalone arena at `/` (one player, three passengers), with the v2 push/charge/hold/revenge loop plus a
third camera bystander C, a visible `SIAP → MEREKAM` cycle, a viral Instagram-style popup, and a game over. Includes
a station-page regression check.
**Decision:** [ADR-0010](../../../../adr/0010-push-hold-arena.md) (amended same day)
**Research:** [push/hold arena brief](../../../../docs/games/pejuang-nafkah/research/2026-10-push-hold-arena.md) §9
**Non-canonical:** local prototype only. No deploy, commit, real-device test, public playtest, real Instagram
integration, upload, or network.

## What was verified

| Check | Command / environment | Result |
| --- | --- | --- |
| TypeScript | `./node_modules/.bin/tsc --noEmit` in `games/pejuang-nafkah` | pass |
| Sim tests | `./node_modules/.bin/vitest run` | **35 pass** (18 arena `AR-SIM-*`, 17 station `PA-SIM-*`) |
| Production build | `./node_modules/.bin/vite build` | pass; `index.html` + `station.html`; arena chunk **42.47 kB** (12.78 gzip), station 74.49 kB, shared Three.js **579.83 kB** (146.54 gzip), CSS **32.62 kB** (7.17 gzip); usual 500 kB warning on the shared chunk |
| Arena page | Chromium `/usr/bin/chromium`, 390×844 and 1280×900 | loads; no console/page errors other than the missing favicon 404 |
| Station page | Chromium `/station.html?debug=1` | loads; `#start-overlay` and the arena link are present; no page errors other than favicon 404 |
| Live camera prep | staged nearby B + real **J** tap | one normal push; `filmerMode='preparing'`; `C · SIAP`; amber strip; meter draining; phone/cone/`SIAP` visible |
| Live camera record | wait for the 0.9 s transition | `filmerMode='recording'`; `C · MEREKAM`; red strip/phone/cone/`REC`; status `C MEREKAM. Jangan dorong.` |
| Live viral catch | real **J** tap during recording | `gameOver='viral'`; target B; overlay visible; captured JPEG image visible; comments + **GAME OVER** + **COBA LAGI** |
| Retry | click **COBA LAGI** | overlay hidden; `gameOver=null`; `filmerMode='idle'`; `C · DIAM`; arena reset |
| Frame capture | WebGL canvas → JPEG data URL | pass; `preserveDrawingBuffer:true`; the image is a still from the arena camera, not encoded video |
| Draw calls | arena desktop viral capture | **44** (25–30 before the camera props) |

The 390×844 and 1280×900 runs used the **real `J` key path**, not only `__ARENA__.step()`. The B position was staged
close to the player with `?debug=1` so the test did not spend seconds walking; the push, camera transition, capture,
and retry were driven by the actual keyboard/render/loop path. The screenshots were taken at the listed states.

## Arena test coverage (`AR-SIM-01`…`AR-SIM-18`)

`AR-SIM-01` movement bounds/body block · `AR-SIM-02` tap push displacement/cooldown, no fall · `AR-SIM-03` second
push ignored · `AR-SIM-04` aggressive telegraph · `AR-SIM-05` perfect brace · `AR-SIM-06` early hold fails, re-press
works · `AR-SIM-07` late/no hold stronger knockback + player fall · `AR-SIM-08` push interrupts the wind-up ·
`AR-SIM-09` out-of-range miss · `AR-SIM-10` reset + deterministic replay (including press/release) · `AR-SIM-11`
charge/release hard push, target fall, farther throw, anger · `AR-SIM-12` fallen player input lock and recovery ·
`AR-SIM-13` hard-pushed B revenge trigger, 0.55 s lead / 0.18 s window · `AR-SIM-14` hold inside the short revenge
window blocks it · **`AR-SIM-15`** first push starts `SIAP`, 0.9 s later `MEREKAM`, and a hit during recording sets
`gameOver='viral'` with the target id · **`AR-SIM-16`** pushing during `SIAP` is not caught; a clean recording
returns to `idle` · **`AR-SIM-17`** viral catch freezes time/pushes/player; reset clears camera/viral state and
restores the three passengers · **`AR-SIM-18`** the camera passenger is not a push target (no push, no camera trigger).

## Captured states

All images are in [`screenshots/`](screenshots/). Dimensions 390×844 unless noted.

| File | State | Observed |
| --- | --- | --- |
| [00-arena-camera-idle](screenshots/00-arena-camera-idle.png) | idle after reset | title **TIGA PENUMPANG. SATU RUANG.**; C at the back with no phone raised; `C · DIAM` / `Ponsel di saku. Belum merekam.` |
| [01-camera-preparing](screenshots/01-camera-preparing.png) | 0.2–0.3 s after the first push | C raises the phone; amber `SIAP` label, ring, and floor cone; HUD `C · SIAP` / `Dia angkat ponsel. Jangan dorong.`; amber meter; status `C angkat ponsel. Tunggu turun.` |
| [02-camera-recording](screenshots/02-camera-recording.png) | just after the 0.9 s transition | red phone/cone/ring, `REC` label; HUD `C · MEREKAM` / `JANGAN DORONG. Kamera hidup.`; red meter; status `C MEREKAM. Jangan dorong.` |
| [03-viral-instagram](screenshots/03-viral-instagram.png) | hit during `MEREKAM` | fictional Instagram-style popup; captured arena still marked `VIDEO · 0:07`; `@jakarta.hening`; caption; eight negative comments; `GAME OVER` footer; **COBA LAGI**; the still shows C's red `REC` cone and the pushed target |
| [04-after-retry](screenshots/04-after-retry.png) | after **COBA LAGI** | overlay gone; arena back to idle; `C · DIAM` |
| [05-desktop-camera-preparing](screenshots/05-desktop-camera-preparing.png) | 1280×900, `SIAP` | portrait shell centred; camera strip and meter legible; C's phone/cone/label visible |
| [06-desktop-camera-recording](screenshots/06-desktop-camera-recording.png) | 1280×900, `MEREKAM` | red strip and `REC` cue; no horizontal overflow |
| [07-desktop-viral-instagram](screenshots/07-desktop-viral-instagram.png) | 1280×900, viral | popup centred; all eight comments and the `Lihat semua 1.284 komentar` line visible; fixed game-over footer/retry |

The popup is **authored fiction**: original camera mark, no official Instagram logo/trade dress, no real account,
no network, no UGC. The comments are static strings in the HUD template. The popup's "video" is a captured JPEG
still with play chrome; there is no video encoder.

## What this does not prove

- **No real-phone test.** The 0.9 s `SIAP` / 1.8 s `MEREKAM` / 0.7 s cooldown read, the 10 Hz strip/meter, the
  0.18 s revenge window, and the two-thumb layout are unvalidated on a real commuter phone. The first-push warning
  and the 1.8 s avoid window are the most important next measurements.
- **No real video.** The result shows a still, not encoded video. The request allowed "video or picture"; the popup
  presents the capture as the record's video frame, but it is not a moving clip. No MediaRecorder/encoder was used.
- **No real Instagram integration.** No API, account, upload, embed, network request, real post, real handle, real
  comment, likes/views persistence, or PII. The word/layout are a local mock; review before any public use.
- **No coverage test.** C records globally while facing the player; the floor cone is a cue, not a line-of-sight or
  occlusion test. A push behind C can still be caught. Decide whether that is fair before adding more camera art.
- **No performance result.** Headless Chromium here is SwiftShader-bound; the fps is not representative. Only draw
  calls (44 in the desktop viral capture) are recorded. `preserveDrawingBuffer:true` and the extra DOM/overlay cost
  need a real-device check.
- **No a11y audit, focus trap, or inert background.** The popup has a dialog role and a focusable retry; that is not
  a complete modal audit. The camera cues use text/shape as well as colour, but contrast and screen-reader behaviour
  of the rapid strip/meter updates are unverified.
- **No native/sensitivity review.** The comments criticise the shove, not a victim; there are no real handles,
  threats, slurs, PII, or recent tragedy. The viral-shame framing still needs a native review and a real-player read.
- **No station regression beyond page load and its tests.** The shared CSS changed; `/station.html` loads, its start
  overlay and arena link are intact, and the 17 station tests pass. This does not re-verify the station's full flow.
- **No shipping AI/social model.** The camera is deterministic and the comments are static; this is a testable
  prototype, not a final camera director or moderation system.

## Reproduction

```bash
cd games/pejuang-nafkah
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vitest run
./node_modules/.bin/vite build

# dev server used for the captures
./node_modules/.bin/vite --host 127.0.0.1 --port 5173 --strictPort
# open http://127.0.0.1:5173/?debug=1
#   stage B near the player, press J, wait for SIAP → MEREKAM, press J again
#   the viral popup appears; COBA LAGI resets
```

The debug API `window.__ARENA__` exposes `state()`, `reset()`, `step(seconds, overrides)`, `setPaused(value)`, and
`drawCalls()`. The camera timing constants are `ARENA.filmerPrepare = 0.9`, `filmerRecord = 1.8`,
`filmerCooldown = 0.7`. A debug push is press/hold/release: `step(..., {push:true})` then
`step(..., {push:false})`; leaving `push:true` only charges. The state is mutable for staging; it is not a save API.

## Conclusion

The arena now shows the requested chain in a readable loop: C is a third passenger with a phone; a successful push
makes C visibly prepare; C then records for 1.8 s with red phone/cone/`REC`/HUD cues; a hit during that window is
caught; the arena freezes and shows a fictional Instagram-style post with the captured moment, eight negative
comments, and **GAME OVER**; retry resets everything. It is a local feel test, the result is a still rather than
video, and the camera's readability and fairness still need real-phone evidence.
