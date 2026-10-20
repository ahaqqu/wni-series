# Push/hold arena — research and test contract

**Status:** current for 2026-10-20. Standalone mechanic test, not a release gate.
**Scope:** an empty arena that started with **one player and two passengers** (one passive, one aggressive) to test movement, physical push, and a timed hold. **Iteration 3 adds a third camera bystander C and a viral game over; §9. Iteration 4 adds a render-only inspect zoom; §10. Iteration 5 fixes the charge wind-up and push-direction fall poses; §11.**
**Related:** [Draft 0 brief](2026-10-push-hold-prototype.md) · [ADR-0009](../../../adr/0009-push-hold-prototype.md) · [ADR-0010](../../../adr/0010-push-hold-arena.md) · [specs.md](../specs.md) §8.4, P6/P16

> This is **non-canonical**. It is a two-thumb control test, not the one-hand v1 game. The station prototype remains available, untouched, at `station.html`.

## 1. User direction (2026-10-20)

> "just give me empty arena with one player with two passenger. i want to test push and hold mechanic. i can push other passenger. and i can hold agains other push passenger"

The point is feel, not progression. The original test had three bodies, no station, no timer, and no fail state; iteration 3 adds a fourth body (the camera bystander) and a run-ending viral catch, while keeping the focus on the physical read (see §9). The player can shove either passenger. The aggressive passenger telegraphs a shove; the player can push them first or hold with the correct timing.

## 2. Evidence and sources

| Source | Used for | Confidence / limits |
| --- | --- | --- |
| [Push'em all — App Store](https://apps.apple.com/ie/app/pushem-all/id1479551182) (retrieved 2026-10-20) | "Move your character and push the enemies with your stick"; physical shove feel; one-tap controls | Store copy, not a formal spec |
| [iOSGames — Push'em All](https://iosgames.net/Pushem-all/) (retrieved 2026-10-20) | Hold/release force and crowd-clearing reference from the original brief | Third-party review |
| [Game8 — How to Parry and Counter, Clair Obscur: Expedition 33](https://game8.co/games/Clair-Obscur-Expedition-33/archives/515694) (retrieved 2026-10-20) | Defensive input just before the hit; a successful parry negates the hit | Community guide, not frame data; use as a **feel** reference |
| [AUTOMATON WEST — dodges, parries, jumps, Gradient Counters](https://automaton-media.com/en/tips/clair-obscur-expedition-33-how-to-get-the-hang-of-dodges-parries-jumps-and-gradient-counters/) (retrieved 2026-10-20) | Defense is a read of the incoming animation, not a free block | Article; no exact frames |

### Taken

- Movement is part of the verb: a stick repositions the body.
- Push is a physical, weighted shove, not a menu.
- Hold is a **timed press**, not a toggle: read the telegraph, press just before impact, keep holding through it.
- The aggressive passenger can shove back; the passive passenger can be pushed around.

### Not taken

- No ragdoll arena, no copied art/audio/characters.
- No Clair Obscur parry data, UI, or combo system.
- No station, queue, train, score, or fail state in the arena.

## 3. Arena contract

### 3.1 Stage

- Empty circular arena, radius ≈ 4.4 world units; no station geometry.
- Exactly three characters: player, passive passenger, aggressive passenger.
- The player starts near the front; the aggressive opposite; the passive to one side.
- The aggressive passenger approaches, stops at shove range, and telegraphs.

### 3.2 Movement and push

- Analog joystick (or WASD/arrows): move the player in x/z; bodies collide; arena edge clamps.
- **PUSH** is a discrete shove with a short cooldown (~0.45 s).
- It hits the nearest passenger within ≈ 1.5 units and a wide arc. The target slides away with an impulse scaled by mass, staggers, and the player steps forward.
- Pushing the aggressive passenger during a wind-up **interrupts** the shove.
- The passive passenger is a physical body; pushing them moves them and they recover.
- No energy/gengsi cost in the arena. This is a feel test; resource rules stay in the station prototype.

### 3.3 Timed hold

- The aggressive passenger telegraphs a shove: **0.9 s lead**, with a closing red ring and a HUD timing bar.
- The **green window** is the last **0.30 s** before impact.
- The player must **press and hold inside that window** and keep holding through the impact.
- Holding too early and holding through does **not** work; release and re-press inside the window.
- Results:
  - **PAS** — perfect brace: no displacement, the aggressive staggers, a small hit-stop flash.
  - **TERLALU AWAL** — early hold: the shove lands, the player is knocked back.
  - **TELAT** — late/no hold: the shove lands, the player is knocked back.
  - **DIBLOK** — push interrupt: the aggressive staggers, no shove.
  - **MELESET** — the player moved out of range; the aggressive overextends.
- The player can move away; dodging is allowed. The hold is the answer when you cannot step out.

### 3.4 HUD and controls

- Portrait, bottom 40%: joystick left; **DORONG** and **TAHAN** right.
- Timing bar at the top of the control cluster: a marker closes toward a green window; the hold button lights during the window.
- World-space red ring around the player during the telegraph, green during the window; a brace ring when holding; a target ring under the nearest pushable passenger.
- Status: aggressive state (SIAP / MENGANCAM), perfect/push counters, reset.
- Keyboard: WASD/arrows move; **J** push; **K** or **Space** hold; **R** reset.
- This is deliberately **two-thumb**. It does not meet the v1 one-hand MUST.

### 3.5 No fail state (iterations 1–2)

- The arena does not end. The aggressive keeps attacking after a cooldown; the player can reset.
- The point is to repeat push/hold interactions and judge the feel.
- **Superseded for iteration 3:** the camera bystander can end a run when it records a hit; see §9. The
  station/queue/train fail state is still out of scope.

## 4. Out of scope

- Station, queue, train, coffee, energy/gengsi/rupiah, score, seat choice. A station-style viral result stays out;
  the arena's own camera popup is a separate local mock (§9).
- More than two passengers. **Superseded for iteration 3:** the arena now has a third camera bystander C (§9); the
  station prototype and its content are unchanged.
- Physics engine/ragdoll, netcode, accounts, payments, analytics.
- A canonical replacement for the v1 controls.

## 5. Tests and evidence

- Sim tests: movement bounds, body collision, push displacement/cooldown/interrupt, perfect/early/late hold, out-of-range miss, reset, deterministic replay.
- Browser: 390×844 screenshots of idle, telegraph, green window, perfect brace, failed shove, push.
- Desktop keyboard test; real phone two-thumb test; no real-device perf claim.

## 6. Risks and stop conditions

- **Timing:** if 0.30 s is unreadable, increase the lead/window (e.g., 1.0 s lead, 0.35 s window) before adding UI.
- **Push feel:** if the shove is weightless or the passenger snaps back too fast, tune impulse/friction/stagger, not more effects.
- **HUD:** if the bar and world ring disagree, the world ring wins; the sim state is authoritative.
- **Controls:** if the user wants one-hand, stop and redesign before integration.
- **Tone:** A, B, and the iteration-3 camera bystander C are adults with abstract markers; no vulnerable/victim framing in this arena.

## 7. Approval

User requested the arena on 2026-10-20. Local prototype only; no deploy, public playtest, or v1 spec change.

## 8. Iteration 2 — impact, charge/release, revenge (2026-10-20)

**User direction (verbatim):**

> "need more impact if player is being pushed. the player should be thrown more further and fallen. player able to hold and relaese push button for hard push. hard push causing passenger to be thrown further and fallen. some passengers would anger and take revenge after being push, the revenge has quick push which has different timing the current push."

This is an iteration on the same arena and ADR-0010, not a new mode. The sources in §2 still stand; the numbers below are prototype tuning, not copied frame data.

### 8.1 Taken

- Getting shoved must **look and feel heavier**: more travel, a real knockdown, a get-up beat, and no actions while down.
- **PUSH is now press-hold-release**, not only a tap. A short tap remains the normal shove; holding builds a heavier shove; release commits it. This extends the Push'em All hold/release reference to the offensive verb.
- A **hard shove** throws farther and knocks the target down. A normal shove keeps the existing stagger/recover loop.
- Being pushed can make a passenger **angry**; anger produces a **revenge shove** with a deliberately different, faster timing read.
- The fast revenge is marked differently from the normal attack: orange telegraph, `BALAS DENDAM · CEPAT` label, a shorter lead and window, and a faster closing ring. A player who reads every attack as a 0.9 s wind-up should fail.
- Both passengers can become angry. B is passive until pushed; A can also revenge after enough shoves. The anger model is **deterministic** (impact + charge), not random, so the test can be repeated and automated.

### 8.2 Contract delta

| Element | v1 arena | Iteration 2 |
| --- | --- | --- |
| PUSH input | discrete press | held input; **tap = normal**, hold ≥ ~0.5 s to full charge then **release = hard** |
| Charge | none | 0.70 s to full; hard threshold 0.72; movement ×0.7 while charging; cooldown 0.45 s |
| Normal shove | impulse 5.4 / mass; stagger 0.42 | unchanged |
| Hard shove | none | impulse 11.5 / mass; stagger 1.0; causes a **1.05 s knockdown**; longer step-in |
| Getting shoved | impulse 5.0; stagger 0.4 | impulse 9.5 (quick revenge 8.5); **0.95 s player knockdown** (quick 0.80 s); input locked while down; get-up |
| Anger | none | `+0.35 + charge × 0.90` per shove, clamped to 1; a hard shove guarantees it; no RNG |
| Revenge | none | after getting up, angry passenger chases and shoves with **0.55 s lead / 0.18 s window**; normal is 0.9 / 0.30; panel/ring orange; attempt then calms |
| HUD | push button, timing panel | charge fill + `ISI`/`LEPAS`; B state `PASIF/MARAH/JATUH`; `BALAS DENDAM · CEPAT`; fallen controls dim; `KAMU JATUH` |
| Outcome | no fail state | still no fail state; falling is recoverable; reset and repeat |

- The normal attack remains the 0.9 s / 0.30 s read. The revenge is the **short read**; do not reuse the old timing.
- A perfect hold on a revenge shove does not knock the player down; the revenge attacker is staggered and calms.
- A hard shove that lands can interrupt a wind-up; the passenger is knocked down and the incoming is cleared (`DIBLOK`). The anger is added before the interrupt resolution, so the interrupted passenger may still want revenge.
- The HUD is DOM at 10 Hz; the world ring is render-rate. The 0.18 s window is intentionally demanding and is expected to be the first number retuned on a real phone.

### 8.3 Tests

New and updated `AR-SIM-*` tests (14 total):

- `AR-SIM-02` tap push displacement/cooldown; normal push does **not** knock down.
- `AR-SIM-03` cooldown ignores a second release.
- `AR-SIM-07` late/no hold: stronger knockback + player **fallen**.
- `AR-SIM-08` tap push interrupt still works.
- `AR-SIM-10` reset clears charge/fall/revenge; deterministic replay includes press/release frames.
- `AR-SIM-11` charge + release hard push: target falls, is thrown farther, and becomes angry.
- `AR-SIM-12` fallen player cannot move until the get-up timer ends.
- `AR-SIM-13` hard-pushed B becomes angry and opens a **revenge** shove with 0.55 s lead / 0.18 s window.
- `AR-SIM-14` a hold inside the shorter revenge window blocks it and ends the revenge.
- `AR-SIM-01/04/05/06/09` remain.

### 8.4 Evidence

- 14 arena + 17 station tests = **31 pass**; `tsc --noEmit` and `vite build` pass.
- Browser evidence at 390×844 and 1280×900: idle, full charge, hard push with B fallen, player thrown/fallen, revenge telegraph, revenge window, revenge perfect, desktop. See the [v2 report](../../../../artifacts/verification/prototype-0/2026-10-20-arena-v2/report.md).
- Live smoke: pointer hold/release produced a hard shove; J tap produced a normal shove; J hold produced a hard shove; the quick panel and window rendered; headless draw calls 28–30.

### 8.5 Risks / what to tune next

- **Quick window 0.18 s** may be unreadable, especially at 10 Hz HUD. If so, lengthen the lead/window before changing the art; do not add a second cue.
- **Hard-push charge** (~0.5 s) may be too slow while A is attacking; it currently slows movement. If it feels unusable, reduce the threshold or charge time; keep the release commitment.
- **Knockdown timers** (1.05 s target / 0.95 s player) are feel guesses. Watch for stunlock or a passenger getting up into an unavoidable hit.
- **Deterministic anger** means every hard shove of B revenges; that is intentional for testing, not a shipping aggro model.
- Still **two-thumb**, no real-phone test, no a11y/perf claim; the arena remains non-canonical.

### 8.6 Not taken in this iteration

- No ragdoll/physics engine, no random anger roll, no knockdown invulnerability or combo system.
- No new passenger, vulnerable-passenger framing, resource cost, score, or fail state.
- No change to the station prototype or the v1 one-hand MUST.
- **Superseded for iteration 3:** a third camera bystander and a viral game over are now in the arena; see §9. The
  station, resource model, and one-hand MUST are unchanged.

### 8.7 Approval

Continuation of the 2026-10-20 arena prototype request. Local-only iteration; no deploy, public playtest, or v1 spec change.

## 9. Iteration 3 — camera bystander and viral game over (2026-10-20)

**User direction (verbatim):**

> "add third passenger that would take video or picture after there is push actions. preparing and taking video should be visible. so player can avoid to push. if the video successfuly record player push others, then show instagram in popup. instagram page show video of him and a lot of negative comments, then game over"

This is a third iteration on the same arena and ADR-0010, not a new mode or a canonical social feature. The sources
and caveats in §2/§8 still apply; all timings below are prototype tuning.

### 9.1 Taken

- Add a third passenger, **C**, as a **camera bystander** at the back. C is a shopper body with a phone; it faces the
  player, blocks movement, and is **not a push target**. Pushing C directly does nothing.
- The camera is a **deterministic state machine** in the sim, not a random event:
  - `idle` → after a **successful push that hits A or B**, `preparing` for **0.9 s**;
  - `preparing` → `recording` for **1.8 s**;
  - `recording` → `cooldown` for **0.7 s** → `idle`.
- **Only a push that hits A or B while `recording` is caught.** Pushes during `idle`, `preparing`, or `cooldown`,
  whiffs, and pushes on C are not recorded. This gives the player a warning window and a clear safe window.
- Make the cycle **visible before it is dangerous**:
  - world: a phone raised in C's hand, an amber/red floor cone toward the player, a `SIAP`/`REC` sprite above C,
    and a ring colour change (blue → amber → red);
  - HUD: a dedicated camera strip `C · DIAM / SIAP / MEREKAM / TURUN / KETAHUAN` with a hint and a draining meter;
  - status text: `C angkat ponsel. Tunggu turun.` / `C MEREKAM. Jangan dorong.`;
  - the cues use **shape, text, and motion**, not colour alone.
- On capture: set `gameOver='viral'`, freeze the fixed-step sim, capture the current WebGL frame to JPEG
  (`preserveDrawingBuffer`), and open a **fictional Instagram-style popup** with:
  - a plain-text `Instagram` app bar with an original camera mark (no official logo or trade dress);
  - `@jakarta.hening`, a location/time, the captured still with `VIDEO · 0:07` and a play control;
  - eight authored negative comments, a `Lihat semua 1.284 komentar` line, likes/views;
  - a fixed `VIDEO TERSIMPAN · VIRAL` / **GAME OVER** footer and **COBA LAGI** retry.
- The popup is DOM; the sim has no DOM/Three.js/network. All handles, comments, counts, and the Instagram-style
  layout are authored local fiction. There is **no** Instagram API, account, upload, network request, real post, or
  real user data. The frame is a **still**, not encoded video; it is presented as the video's first frame.
- The normal reset, `R`, debug reset, and retry clear camera and viral state.
- Add deterministic tests for the cycle, catch, safe windows, freeze, and reset.

### 9.2 Contract delta

| Element | Iteration 2 | Iteration 3 |
| --- | --- | --- |
| Passengers | 1 player + A aggressive + B passive | + C camera bystander (not pushable) |
| Camera state | none | `idle → preparing 0.9 s → recording 1.8 s → cooldown 0.7 s → idle` |
| Trigger | none | first successful hit on A/B starts `preparing` |
| Capture condition | none | any hit on A/B during `recording` |
| Visible cues | push/hold rings | phone, floor cone, `SIAP`/`REC`, ring colour, HUD camera strip + meter, status line |
| Outcome | recoverable knockdowns only | `gameOver='viral'`; sim freezes; viral popup; retry |
| Result surface | HUD status/counters | original Instagram-style DOM popup with captured still + 8 comments + game over |
| Tests | 14 `AR-SIM-*` | 18 `AR-SIM-*` (adds 15–18); 17 station; **35 total** |

### 9.3 Tests

`AR-SIM-15` first push → `preparing`; transition to `recording`; a hit during recording sets `gameOver='viral'`,
captures the target id, and increments pushes. `AR-SIM-16` pushing during `preparing` is not caught; a clean
recording returns to `idle`. `AR-SIM-17` the viral catch freezes time/pushes/player and reset clears camera/viral
state and restores the three passengers. `AR-SIM-18` puts the player in range of C and confirms the camera passenger
is not a push target (no push, no camera trigger).

### 9.4 Evidence

- `tsc --noEmit` and `vite build` pass; 18 arena + 17 station tests pass (**35**).
- Build: arena chunk 42.47 kB (12.78 kB gzip), shared Three.js 579.83 kB (146.54 kB gzip), station 74.49 kB, CSS
  32.62 kB. The usual 500 kB warning remains.
- Chromium at 390×844 and 1280×900: camera idle, `SIAP` with meter, `MEREKAM`, viral popup with captured frame and
  comments, after retry, desktop camera/viral. The 390 and desktop runs used the real `J` key path. Draw calls 44 in
  the desktop viral capture.
- The station page still loads; its start overlay and arena link are present; its 17 tests remain green.
- See the [v3 report](../../../../artifacts/verification/prototype-0/2026-10-20-arena-v3/report.md).

### 9.5 Risks / what to tune next

- **Readability:** 0.9 s `SIAP` and 1.8 s `MEREKAM` are guesses. On a real phone in motion, the first-push warning
  may be missed, or the safe window may feel like waiting. Test early/avoid rates before adding a second cue.
- **Capture fairness:** C currently records globally while facing the player; there is no line-of-sight or cone-only
  capture test. A player behind C or outside the visible cone can still be caught. The cone is a **cue**, not a
  collision test; if that reads as unfair, add a coverage test before adding more camera art.
- **Tone:** the comments attack the player's behaviour, not a victim; no real handles or PII. The viral-shame beat
  still needs native/sensitivity review and a real-phone read. Do not add threats, slurs, pile-on, or real posts.
- **Brand/legal:** the word `Instagram`, the app-bar layout, and the feed are a local mock, not an official asset.
  The camera mark is original; there is no official logo/trade dress. Review before any public build or capture used
  in marketing.
- **Video gap:** the popup shows a still with play chrome, not an actual video. A future pass could add a short
  captured clip, but that adds encoder/browser support, memory, privacy, and test complexity.
- **10 Hz HUD:** the strip/meter updates at 10 Hz; the world cues run at render rate. The world cue is the primary
  read; do not rely on the meter alone.
- **Collision:** C blocks movement and cannot be pushed; check that it does not create a frustrating corner.
- **Perf/a11y:** draw calls rose to 44 in the desktop capture; no real-device FPS or axe audit. The popup has a
  dialog role and a focusable retry, but no full focus trap/inert background.

### 9.6 Not taken in this iteration

- No actual video encoding/MediaRecorder, no real Instagram embed/API, no upload, no network, no real comments/UGC,
  no likes/views persistence, no account.
- No camera coverage/occlusion/line-of-sight capture; no multiple cameras; no camera-angle simulation.
- No gengsi/energy/score resource; no station change; no canonical social system.
- No one-hand redesign; the arena remains two-thumb and non-canonical.
- No real-phone, a11y, performance, or native/sensitivity evidence.

### 9.7 Approval

Continuation of the 2026-10-20 arena prototype request. Local-only iteration; no deploy, commit, public playtest, or
v1 spec change. The camera/viral popup is an authored local mock and must not be treated as a shipping social
feature or a real Instagram integration.

## 10. Iteration 4 — inspect zoom (2026-10-20)

**Request:** “please add feature to zoom in arena. i want to view in more closer look so i can see clearly the character design, movement, and action.”

This is a render/HUD-only addition to the existing lab. It changes no sim rule, timing, content, dependency, network
call, or data. No new external fact needs verification; the contract is the camera behaviour below and browser
evidence.

### 10.1 Taken

- Add a **render-only orthographic zoom** to the arena. The camera keeps its 3/4 position and target; only the
  orthographic frustum height changes (`VIEW_HEIGHT / zoom`). The sim state is untouched.
- Cap at **1.8×** in **0.2 steps**. The cap is chosen so the four default-position characters remain fully visible at
  390×844; 2.0× cropped B at that viewport. Narrower viewports or characters at the far edge can still crop.
- Add a compact **`− 1.0× +`** control under RESET. Minus is disabled at 1.0× and plus at 1.8×. The value updates for
  every input source.
- Add direct inputs:
  - **two-finger pinch** on the WebGL canvas (pointer events, `touch-action: none`; not on the joystick/action
    buttons);
  - **mouse wheel** over the scene;
  - **Z** zoom in / **X** zoom out; `=`/`-` and numpad equivalents also work.
- Keep the zoom as a **view preference**, not sim state: RESET, `R`, debug reset, and COBA LAGI keep the current zoom.
  The zoom is not saved across reloads.
- Expose `setZoom(value)` and `zoom()` in the debug API for evidence capture.
- Keep the camera **centred on the arena**: no pan, no follow, no smoothing, no auto-framing around the HUD.
- Browser-verify buttons, wheel, keyboard, real headless-touch pinch, both clamps, reset persistence, a 320×700
  layout, and the existing camera/viral flow.

### 10.2 Contract delta

| Element | Iteration 3 | Iteration 4 |
| --- | --- | --- |
| View | fixed orthographic 3/4, view height 19.2 | orthographic 3/4 with zoom 1.0×–1.8× |
| Camera target | arena centre | unchanged, arena centre |
| Controls | joystick, DORONG, TAHAN, RESET | + zoom buttons, canvas pinch, wheel, Z/X |
| Sim state | gameplay truth | **no change**; zoom is render-only |
| Reset | clears gameplay/camera state | clears gameplay/camera state; **keeps zoom** |
| Tests | 18 arena + 17 station = 35 | no new sim tests; browser contract evidence; **35 total** |
| Evidence | v3 camera/viral | v4 zoom report + captures |

### 10.3 Tests and browser checks

No sim tests are added because the simulation is unchanged. Browser evidence covers the render/HUD contract:

- Four plus clicks reach `1.8×`; the plus button reports disabled. Minus at `1.0×` is disabled.
- Wheel up and **Z** increase the label; **X** decreases it. A real CDP two-finger pinch reaches `1.8×`.
- RESET keeps `1.8×` and resets gameplay state.
- 320×700: title and zoom control do not overlap; no horizontal scroll; 24 px zoom buttons remain.
- 390×844 captures: default, 1.8× idle (all four characters fully visible), 1.8× recording action.
- 1280×900 capture: 1.8× desktop. No console errors beyond the known favicon 404.
- Existing 35 tests, typecheck, build, and the station page still pass/load.

### 10.4 Evidence

- `tsc --noEmit` passes; 35 tests pass; `vite build` passes.
- Build: arena 44.78 kB (13.47 kB gzip), shared Three.js 579.83 kB (146.54 kB gzip), station 74.49 kB, CSS
  33.61 kB (7.32 kB gzip). Usual 500 kB warning.
- Captures at 390×844 and 1280×900; see the
  [v4 report](../../../../artifacts/verification/prototype-0/2026-10-20-arena-v4/report.md).
- Zoom adds no Three.js objects or draw calls; the existing 44-call desktop capture is unchanged by this pass.
- Headless Chromium is SwiftShader-bound; no FPS claim.

### 10.5 Risks / what to tune next

- **No pan/follow.** At high zoom, a character who moves to the far edge or a narrower viewport (e.g. 320 px) can
  crop. The current answer is to zoom out; a future pass needs pan or HUD-aware framing.
- **No smoothing.** Each button/wheel/key step is immediate; pinch is continuous. A short eased transition may feel
  better, but it must not introduce nondeterministic gameplay (it is render-only, so safe).
- **Discoverability/a11y.** The control is visible and labelled, but the `1.0×` value alone may read as a zoom
  control only with the ± buttons. Pinch is untested on a real phone. Touch targets are 24 px at 320 px (the WCAG
  2.5.8 minimum), and there is no full screen-reader announcement for every pinch step.
- **World/HUD layering.** At close zoom the world `REC` sprite and target rings can sit near the HUD strips. The
  captures show no blocking overlap at 1.8×, but moving characters/zoom combinations need a real-phone check.
- **Perf.** No new geometry, but larger characters do not change overdraw much; no real-device GPU/battery evidence.
- **Scope.** This remains an inspect aid, not a cinematic camera; do not infer a v1 camera/photo mode.

### 10.6 Not taken in this iteration

- No pan, drag-to-look, player-follow, action-follow, HUD-aware auto-framing, collision-aware camera, or reset-to-1×
  gesture.
- No deeper zoom (>1.8×), perspective/FOV change, camera orbit, tilt, or cinematic mode.
- No smooth/eased zoom, saved zoom preference, or per-device default.
- No zoom in the station prototype; no station/HUD change.
- No actual video, Instagram integration, or social feature change.
- No one-hand redesign; the arena remains two-thumb and non-canonical.
- No new dependency, analytics, network request, or PII.

### 10.7 Approval

Continuation of the 2026-10-20 arena prototype request. Local-only iteration; no deploy, commit, public playtest, or
v1 spec change. The zoom is an inspect aid for the lab, not a shipping camera system.

## 11. Iteration 5 — charge wind-up and fall-away poses (2026-10-20)

**Request:** “hold dorong button should has animation the player held back to charge push similar like big passenger when trying to push / the animation when player or passenger pushed is wrong. it should fallen opposite. example player and enemy face to face. when enemy push player currently the player fall with face in bottom. it should be opposite, the player should fallen with back in bottom. similar like you being pushed in real life”

This is a render-only animation correction. No sim rule, timing, state, content, dependency, network, or data change.
The sim still owns `fallen`, velocity, facing, and timers.

### 11.1 Taken

- **Player charge wind-up.** While `pushHeld` is true, use the existing normalized `pushCharge` to load the whole body:
  - lean backward by up to **0.26 rad**;
  - shift the body **0.07 local units** behind the feet;
  - lower the player root by **0.015 units**.
  The pose scales continuously with charge, so the hold is readable before the HUD reaches `LEPAS`. On release the
  existing `pushFlash` forward lean/lunge takes over. This deliberately echoes A's `windupLean` (0.22 rad) without
  adding a rig.
- **Fall away from the pusher.** Remove the fixed face-first X rotations. On the first `fallen` frame, latch a
  fall direction from the character's knockback velocity; if velocity is too small, fall back to local backward. Tilt
  the body around a horizontal axis perpendicular to that direction with a quaternion, so:
  - a face-to-face shove lands on the **back**;
  - a side hit falls sideways;
  - a hit from behind falls forward.
- Apply the same path to the player, A, and B. C is not pushable and keeps its idle pose. A short render-only blend
  (about 0.1 s to fall, 0.1 s to recover) avoids the instant snap; the fall-direction latch clears after get-up.
- No new meshes, textures, assets, dependencies, sim fields, or tests. The whole character is still one merged
  low-poly body; feet remain the fall pivot.

### 11.2 Contract delta

| Element | Iteration 4 | Iteration 5 |
| --- | --- | --- |
| Player charge pose | HUD charge only | body leans/shifts/crouches, scaled by `pushCharge`; HUD unchanged |
| Fall rotation | fixed face-first X rotation | direction-based quaternion, back away from pusher |
| Fall source | render constant | latched `vx`/`vz`, falling back to local backward |
| Animation timing | instant pose | ~0.1 s fall blend, ~0.1 s recover, render-only |
| Scope | render/HUD | render only; sim untouched |
| Tests | 35 | **35**; no sim tests added |

### 11.3 Tests and browser checks

No sim tests are added because `sim.ts` is unchanged. Browser checks at 390×844, 1.8× inspect zoom:

- Real **J** hold 850 ms: `pushHeld=true`, `pushCharge=1`, no push yet; screenshot shows the loaded player and `LEPAS`.
- Real A shove with the player facing A: brace result `late`, player `fallen=0.58`, `facing=0`, velocity mostly +Z;
  screenshot shows a back-first fall. After the fall ends, `fallen=0` and the body is upright again.
- B hard shove via deterministic debug steps (`push:true` 0.8 s, then release): `lastPushHard=true`, hit B,
  `fallen≈1.03`, strong +X velocity; screenshot shows B falling away from the player. The real-J hard-shove path was
  separately smoke-checked; the capture uses debug stepping to hold the fall frame.
- Temporary geometric instrumentation (removed) measured player torso back point **y=0.09** vs front **y=0.54**, and
  B back **y=0.019** vs front **y=0.468** at full fall: back down, front up.
- Only the known favicon 404; no page errors.
- No new draw calls from the animation (poses only; same meshes), though no new render profile was taken.

### 11.4 Evidence

- `tsc --noEmit` passes; 35 tests pass; `vite build` passes.
- Build: arena **46.32 kB (13.99 kB gzip)**, CSS **33.61 kB (7.32 kB gzip)**, shared Three.js
  **579.84 kB (146.54 kB gzip)**, station 74.49 kB; usual 500 kB warning.
- Captures: [v5 report](../../../../artifacts/verification/prototype-0/2026-10-20-arena-v5/report.md) —
  full-charge side pose, actual player back-first fall, player recovery, and deterministic B back-first fall.
- No real-device FPS, a11y, or animation test claim.

### 11.5 Risks / what to tune next

- **Whole-body approximation.** There is no rig, limb animation, or ragdoll. The charge is a lean, not a wind-up with
  arms; it is subtle when the player faces the camera head-on. The fall pivots at the feet, so low-poly body/backpack
  parts can intersect or read oddly at some angles.
- **Fall direction.** Latching velocity is right for a shove but can carry a little pre-hit movement. A hit while
  already moving or a multi-hit pile-up may need a dedicated `fallDir` in the sim if it ever affects fairness; it
  currently does not affect gameplay.
- **Blend timing.** 0.1 s fall/recover is a feel guess. It may read too quick/slow on a phone, and get-up starts as
  the sim's timer expires rather than on an animation event.
- **Reduced motion.** `prefers-reduced-motion` makes the blend instant rather than removing the pose change; check
  comfort/preference.
- **HUD/world layering.** The charge lean and fall can put the body under the timing/controls UI at 1.8×; this is
  purely visual.
- **No automated render/animation test.** Screenshots and a temporary geometric probe are the evidence.

### 11.6 Not taken in this iteration

- No rig, skeleton, limb IK, ragdoll, physics, hit reactions on individual body parts, facial animation, or sound.
- No change to push force, charge threshold/time, stun/fall timers, sim fall direction, or collision.
- No fall-direction field in the sim; no fairness/occlusion change.
- No animation in the station; no station/HUD/camera/viral change.
- No saved/animation settings; no real-phone, a11y, or performance gate.

### 11.7 Approval

Continuation of the 2026-10-20 arena prototype request. Local-only iteration; no deploy, commit, public playtest, or
v1 spec change. The poses are presentation aids for the lab, not a shipping animation system.
