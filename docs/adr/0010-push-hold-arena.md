# ADR-0010 — Standalone push/hold arena

- **Status:** accepted (prototype only)
- **Date:** 2026-10-20
- **Owners:** WNI Series
- **Research:** [push/hold arena addendum](../games/pejuang-nafkah/research/2026-10-push-hold-arena.md)
- **Evidence:** arena tests + Chromium screenshots under `artifacts/verification/prototype-0/` updated after the build
- **Revalidate:** before any v1 integration; if the one-hand rule is kept; if timing/tone/real-device tests fail

## Context

The user wants to test the physical push/hold mechanic in isolation, not inside the station flow: "just give me empty arena with one player with two passenger." The Draft 0 station is too much context for judging the feel. The reference is Push'em All for the shove and a Clair Obscur-style just-before-impact defensive input for the hold. The gate-scrum plan was too large and was not implemented.

## Decision

Add a **standalone arena** at `/` in the game package, with the existing station prototype preserved at `/station.html`:

- Empty circular arena. Exactly **one player + two passengers**: one passive, one aggressive.
- Virtual joystick / WASD moves the player in x/z; body collision and arena bounds.
- **DORONG / PUSH**: nearest passenger within reach is shoved; impulse scales with mass; stagger; cooldown; the player steps forward. Pushing the aggressive during its wind-up interrupts the shove.
- **TAHAN / HOLD**: the aggressive telegraphs a shove with a 0.9 s lead. The player must press hold inside the final 0.30 s window and keep holding to impact. Perfect = no displacement + attacker stagger; early/late = knocked back. Releasing and re-pressing is allowed. A push interrupt reads as a block.
- The player can move out of range; the shove misses.
- No station, timer, energy/gengsi/rupiah, score, or fail state in the arena. Repeated interaction + reset.
- Deterministic arena sim with its own `AR-SIM-*` tests. The station sim/tests remain unchanged.
- Two-thumb control layout. **It does not satisfy the v1 one-hand MUST** and is not canonical.

## Consequences

- **Positive:** the feel test is small, repeatable, and independent of the station; no new physics engine or network; the station remains available for the broader flow.
- **Negative / accepted:** two-thumb; no game context; no resource stakes; a simplified body collision; the timing window still needs real-device tuning.
- **Tone:** both passengers are adults; no victim framing. The aggressive is a rival, not a caricature.
- **Performance:** three characters, a floor, a few rings; negligible compared with the station scene. Real-device frame time still unproven.
- **Security/privacy/cost:** unchanged. Local static arena, no network, no PII.
- **Reversibility:** remove the arena entry and the `index.html` switch; `station.html` and the station code are untouched.

## Alternatives considered

| Option | Why rejected |
| --- | --- |
| Build the gate-queue scrum | Too much UI/scene work for the requested feel test; the user asked for an empty arena |
| Keep only the station | The station context hides whether push/hold feels good; too long to repeat |
| Full physics/ragdoll | Nondeterministic and hard to tune; the arena needs a readable shove, not simulation fidelity |
| One-hand layout | The requested joystick + push + hold needs two thumbs; flagging this rather than pretending it is one-hand |

## Evidence summary

- Push'em All: move with a stick, push bodies, hold/release force.
- Clair Obscur guide: defensive input just before the hit; successful defense negates the hit.
- User direction: empty arena, one player, two passengers, push and hold.
- Arena sim tests + screenshots added after the build; see the report.

## Revalidation

Before v1 integration: decide whether the one-hand MUST is relaxed; tune lead/window on real phones; run 5–8 short feel tests; confirm the tone; then write the spec change if accepted. Until then this is a local Draft 0 lab.

## Amendment — impact, hard push, and revenge (2026-10-20)

**Status:** accepted for the prototype only; does not change the v1 spec or the two-thumb caveat.

The user asked for a heavier reaction when the player is shoved, a hold-and-release hard push, and angry passengers who take revenge with a faster shove:

> "need more impact if player is being pushed. the player should be thrown more further and fallen. player able to hold and relaese push button for hard push. hard push causing passenger to be thrown further and fallen. some passengers would anger and take revenge after being push, the revenge has quick push which has different timing the current push."

### Decision delta

- **PUSH is held, not edge-only.** Tap = normal; hold to full (0.70 s, hard threshold 0.72) and release = hard. Movement slows to ×0.7 while charging. Cooldown 0.45 s from release.
- **Hard shove:** impulse 11.5 / mass vs 5.4, stagger 1.0, and a 1.05 s knockdown. A normal shove still only staggers. A hard push grants more anger.
- **Being shoved:** impulse 9.5 (quick revenge 8.5) vs 5.0; the player is knocked down for 0.95 s (quick 0.80 s) and cannot move, push, or brace until getting up.
- **Anger and revenge:** deterministic `anger += 0.35 + charge × 0.90`; at 1 the passenger plans a revenge after getting up. Revenge uses a **0.55 s lead / 0.18 s window** versus the normal 0.9 / 0.30, and is labelled `BALAS DENDAM · CEPAT` with an orange telegraph. A successful defense calms the attacker.
- Both passengers use the same anger rule: B is passive until pushed, A is already aggressive. No random roll; this is a testable prototype model.
- HUD: charge fill and `ISI`/`LEPAS`; B state `PASIF/MARAH/JATUH`; fallen state dims controls and shows `KAMU JATUH. Bangkit...`.

### Consequences

- **Positive:** the requested impact is now present on both sides; the hard push creates a risk/reward commitment; the quick revenge is a genuinely different timing read. All new state is deterministic and testable.
- **Negative / accepted:** the 0.18 s revenge window is sharp and may be too short on a phone; the 10 Hz HUD may miss part of it (the world ring is the primary cue). The two-thumb layout, simplified collision, and lack of real-device tuning remain. The get-up timers are feel guesses.
- **Tone:** both passengers remain adults; falling is a slapstick-free physical setback, not injury or victim comedy.

### Evidence / revalidation

- 14 `AR-SIM-*` tests cover normal vs hard push, fall/input lock, revenge trigger, quick timing, and the shortened window; 17 station tests remain green (31 total).
- Browser evidence in `artifacts/verification/prototype-0/2026-10-20-arena-v2/`.
- Revalidate on a real phone first: is the charge readable, is the fallen state obviously temporary, and can a player intentionally hit the 0.18 s revenge window? If not, lengthen the quick window or lead before adding effects. Do not treat these numbers as v1 combat design.

## Amendment — camera bystander and viral game over (2026-10-20)

**Status:** accepted for the local prototype only; the canonical v1 spec is unchanged, and the arena remains
two-thumb and non-canonical.

The user asked for a third passenger who visibly prepares and records, giving the player a chance to avoid pushing,
and for a viral Instagram-style result plus game over if the recording catches a push:

> "add third passenger that would take video or picture after there is push actions. preparing and taking video should be visible. so player can avoid to push. if the video successfuly record player push others, then show instagram in popup. instagram page show video of him and a lot of negative comments, then game over"

This amendment supersedes the original ADR's "No fail state" clause **for this local arena prototype only**: the
camera catch ends the run. The canonical game and the station keep their own fail rules.

### Decision delta

- **Third passenger C is a camera bystander**, not an attacker and **not a push target**. C is a shopper body at the
  back that faces the player, blocks movement, and holds a phone.
- **Deterministic camera cycle**, owned by the pure arena sim:
  - `idle` → `preparing` for **0.9 s** after the first successful push that hits A or B;
  - → `recording` for **1.8 s**;
  - → `cooldown` for **0.7 s**;
  - → `idle`.
- **Capture rule:** only a push that hits A or B during `recording` sets `gameOver='viral'`. Pushes during
  `idle`/`preparing`/`cooldown`, whiffs, and pushes on C are ignored by the camera. The first hit starts the camera
  but is not itself recorded; this provides a warning beat.
- **Readable before dangerous:** C has a phone, floor cone, `SIAP`/`REC` sprite, and ring colour change; the HUD has a
  camera strip `C · DIAM / SIAP / MEREKAM / TURUN / KETAHUAN`, a hint, and a draining meter; the status line calls out
  the recording. Cues use text, shape, and motion as well as colour.
- **Viral result:** freeze the fixed-step sim, capture the current WebGL frame to JPEG (`preserveDrawingBuffer`), and
  show a DOM popup styled as a fictional Instagram post with the still, a handle, caption, eight authored negative
  comments, a `Lihat semua 1.284 komentar` line, and a fixed **VIDEO TERSIMPAN · VIRAL / GAME OVER** footer with
  **COBA LAGI**. The normal reset, `R`, and the retry clear the camera/viral state.
- **No resource/score change.** The run ends on the camera catch; there is no gengsi/energy spend and the station
  rules are untouched. The popup is a social-failure presentation, not a reward economy.
- **No real social integration.** No Instagram API, account, embed, upload, network request, real post, UGC, or PII.
  All handles, comments, counts, and layout are authored local fiction. The camera mark is original, and no official
  Instagram logo/trade dress is used. The popup's "video" is a captured **still** with video chrome, not encoded
  video.
- New deterministic tests `AR-SIM-15`–`AR-SIM-17` cover the cycle, a catch, safe prep pushes + clean return to
  idle, and freeze/reset. The existing 14 tests remain.

### Consequences

- **Positive:** the camera turns the push into a timed risk with a visible tell and a clear safe window; no new
  dependency or network; the sim remains deterministic and testable; the result is a strong, legible consequence
  for the "gengsi/viral" theme.
- **Negative / accepted:** the 0.9 s/1.8 s read is an unvalidated tuning guess; the 10 Hz HUD may lag; the popup
  uses a still rather than actual video; the comments are authored and static; the capture is global rather than
  line-of-sight; the viral-shame tone needs native/sensitivity review; an Instagram-style mock raises brand/legal
  review needs; C's body can block movement; the arena remains two-thumb.
- **Tone:** the comments criticise the player's shove, not a victim; there are no real handles, threats, slurs, PII,
  or recent tragedy. The game-over copy is dry, not celebratory.
- **Security/privacy/cost:** unchanged. No network, storage, upload, analytics, account, or external asset. The
  popup data is hard-coded; the captured frame stays in memory as a data URL and is cleared on reset.
- **Performance:** the camera props and popup add draw calls (44 in the desktop viral capture) and DOM; no
  real-device result. `preserveDrawingBuffer:true` is enabled for the capture and should be re-checked on a phone.
- **Reversibility:** remove the filmer state/tests, the phone/cone/labels, the HUD strip/overlay, and the capture
  call; the v2 push/hold arena and station are unaffected.

### Revalidation

Before calling this a shipping mechanic: test the 0.9 s `SIAP` / 1.8 s `MEREKAM` read on a real phone in motion;
decide whether a still is sufficient or a short clip is required; check whether global capture needs a cone/occlusion
test; run native/sensitivity review on the comments and game-over framing; review the Instagram name/UI usage; keep
the arena's two-thumb caveat and do not infer a canonical gengsi or social system. Do not add a network, real
Instagram embed, UGC, or public sharing without a separate research/ADR gate.

## Amendment — inspect zoom (2026-10-20)

**Status:** accepted for the local prototype only; the canonical v1 spec, the sim, and the station are unchanged.
The arena remains two-thumb and non-canonical.

The user asked to inspect the arena closer:

> "please add feature to zoom in arena. i want to view in more closer look so i can see clearly the character design, movement, and action."

### Decision delta

- Add a **render-only orthographic zoom** to the arena camera. The 3/4 camera position and arena-centred target stay
  fixed; only the orthographic frustum height changes (`VIEW_HEIGHT / zoom`). The pure sim is not touched.
- Range **1.0×–1.8×**, in 0.2 steps. The 1.8× cap keeps the four default-position characters fully visible at
  390×844; 2.0× cropped the passive passenger at that viewport. The camera does **not** pan or follow.
- Add a compact **`− 1.0× +`** control under RESET, with the minus/plus disabled at the limits. Also support
  **two-finger pinch** on the WebGL canvas, **mouse wheel**, and **Z / X** (plus `=`/`-` and numpad). Pinch is bound
  only to the canvas, not the joystick or action buttons; the canvas sets `touch-action: none`.
- Treat zoom as a **view preference**, not gameplay state. RESET, `R`, debug reset, and COBA LAGI keep the current
  zoom; the preference is not saved across reloads. Expose `setZoom`/`zoom` through the debug API for evidence.
- No sim rule, timing, content, dependency, network, storage, analytics, or data changes. No new tests are added;
  the browser verifies the render/HUD contract and the existing 35 tests remain green.

### Consequences

- **Positive:** the character silhouettes, clothing colours, push/fall motion, world rings, camera phone/cone, and
  recording action can be inspected without changing the mechanic. The control is visible and has three input
  paths; zoom is deterministic and cheap (no new draw calls).
- **Negative / accepted:** no pan/follow means a character can crop at the edge, especially on narrower viewports or
  while moving; the zoom is immediate rather than eased; the value control is small; no real-phone pinch or a11y
  evidence; the world `REC` sprite/rings can sit near the HUD at close zoom. A deeper zoom would need pan and its own
  evidence.
- **Security/privacy/cost:** unchanged. Local UI only; no network, persistence, PII, or external asset.
- **Reversibility:** remove the zoom projection/constants, HUD control and CSS, main input handlers, and debug
  additions. Gameplay and all `AR-SIM-*` tests are unaffected.

### Revalidation

Test pinch comfort and control discoverability on a real phone in motion; check 320/390/430-wide framing and moving
characters at 1.8×; decide whether eased zoom, pan/follow, or a deeper cap is needed. Run an a11y pass on the control
and value announcement. Do not infer a v1 photo/cinematic mode or add camera features to the station without a new
research/ADR gate.

## Amendment — charge and fall poses (2026-10-20)

**Status:** accepted for the local prototype only; the canonical v1 spec, the pure sim, and the station are
unchanged. The arena remains two-thumb and non-canonical.

The user asked for a visible player charge wind-up and for pushed characters to fall backward, away from the pusher:

> "hold dorong button should has animation the player held back to charge push similar like big passenger when trying to push / the animation when player or passenger pushed is wrong. it should fallen opposite. example player and enemy face to face. when enemy push player currently the player fall with face in bottom. it should be opposite, the player should fallen with back in bottom. similar like you being pushed in real life"

### Decision delta

- **Player charge pose.** While `pushHeld` is true, the render layer scales a whole-body backward lean (up to 0.26 rad),
  a 0.07-unit weight shift behind the feet, and a 0.015-unit root lowering by the existing normalized `pushCharge`.
  On release the existing `pushFlash` forward lunge takes over. This mirrors A's 0.22 rad wind-up without adding a
  skeleton, limbs, assets, or sim state.
- **Direction-based fall.** Remove the fixed face-first X rotation. On the first `fallen` frame, latch the fall
  direction from the knockback velocity (`vx`, `vz`), falling back to local backward if it is too small. Tilt the body
  around a horizontal axis perpendicular to that direction with a quaternion. A face-to-face shove therefore lands on
  the back; a side hit falls sideways; a hit from behind falls forward. The player, A, and B use the same path; C is
  not pushable.
- **Render-only blend.** A roughly 0.1 s fall and 0.1 s recover blend avoids the instant pose snap. The sim still owns
  `fallen`, velocity, facing, and timers; the latch clears after get-up. No sim rules, timings, fields, or tests are
  changed.
- No new dependency, network, storage, PII, or external asset. No new draw calls are expected (pose transforms only).

### Consequences

- **Positive:** the hold now reads as loading a shove on the character as well as the HUD; falls read as being pushed
  rather than diving forward; direction works for front/side/back hits and for both player and passengers.
- **Negative / accepted:** the character is still one merged low-poly mesh with feet as the fall pivot. There is no
  rig, limb animation, ragdoll, or physics; bodies/backpacks can intersect or read oddly. The charge is a whole-body
  lean and is subtler head-on. The 0.1 s blend and direction-from-velocity are feel choices. There is no automated animation
  test, real-phone read, a11y check, or reduced-motion verification.
- **Reversibility:** remove the charge terms, fall maps/blend/quaternion helpers, and restore the previous fixed rotations. The
  sim tests and station are unaffected.

### Revalidation

Check the charge read and release timing on a real phone, side-on and head-on; check the back-first fall for A, B, and
the player; inspect foot/backpack clipping; decide whether an explicit render fall direction or a small skeleton is
needed. If fall direction ever affects gameplay/collision, move it into the sim behind a new research/ADR gate. Do not
treat this as a v1 animation or ragdoll system.
