# Pejuang Nafkah — local prototypes

**Status:** two playable local prototypes, both **non-canonical**. This package is a mechanic spike, not the
Phase 1 game. It runs entirely in the browser with no server, accounts, payments, live data, analytics, or PII.

| Page | What it is | Research / decision |
| --- | --- | --- |
| `/` | **Arena test** — one player, three passengers, push + charge/release hard push + timed hold + revenge + camera/viral game over + 1.8× inspect zoom + charge wind-up/fall-away animation. The default page. | [arena brief](../../docs/games/pejuang-nafkah/research/2026-10-push-hold-arena.md) · [ADR-0010](../../docs/adr/0010-push-hold-arena.md) |
| `/station.html` | **Station prototype** — Jurangmangu gate → platform → train → board → result. | [Draft 0 brief](../../docs/games/pejuang-nafkah/research/2026-10-push-hold-prototype.md) · [ADR-0009](../../docs/adr/0009-push-hold-prototype.md) |

- Status/evidence: [status.md](../../docs/games/pejuang-nafkah/status.md)
- Arena evidence: [v5 — charge/fall animation](../../artifacts/verification/prototype-0/2026-10-20-arena-v5/report.md) · [v4 — inspect zoom](../../artifacts/verification/prototype-0/2026-10-20-arena-v4/report.md) · [v3 — camera/viral](../../artifacts/verification/prototype-0/2026-10-20-arena-v3/report.md) · [v2 — charge, fall, revenge](../../artifacts/verification/prototype-0/2026-10-20-arena-v2/report.md) · [v1 — push/hold](../../artifacts/verification/prototype-0/2026-10-20-arena/report.md)
- Station report: [2026-10-20 station report](../../artifacts/verification/prototype-0/2026-10-20/report.md)

## Run it

From this directory:

```bash
pnpm dev
```

Then open the printed URL, normally <http://localhost:5173/>. Add `?debug=1` for the debug state API.
The station prototype is at <http://localhost:5173/station.html> (also supports `?debug=1`).
`pnpm dev` binds to `0.0.0.0`, so a phone on the same network can open the LAN URL.

Production check:

```bash
pnpm typecheck
pnpm test
pnpm build
```

The build has two HTML entries (`index.html`, `station.html`) and does not need Docker, the API, or a database.

## Arena test — push, charge, timed hold, camera & inspect zoom (default)

The arena exists to answer one question: **does physically shoving a passenger, charging a heavier shove, timing a hold, reading a bystander's camera, and seeing the body load and fall in the right direction feel good?**
There is no station, timer, energy, gengsi, or score. The only fail state is the camera passenger catching a push on video. Exactly four characters:

- **Player** — teal, starts near the front.
- **Passenger A** — red ring and `!` marker, broad build; **aggressive**. Approaches, telegraphs, shoves; if shoved enough, it can answer with a faster revenge shove.
- **Passenger B** — blue ring, slim build; **passive until pushed**. A hard shove makes B angry; B gets up and counters with a **quick shove** with a shorter timing window.
- **Passenger C** — green shopper at the back, **camera bystander**. C is not a push target. After a successful push C raises a phone (`SIAP`), then records (`MEREKAM`). A push that hits during **MEREKAM** is caught on video and ends the run.

### Controls

| Input | Action |
| --- | --- |
| Joystick (bottom left) / **WASD** / arrow keys | Move in the arena |
| **DORONG** / **J** | **Tap** for a normal shove; **hold ~0.5 s and release** for a hard shove. Short cooldown |
| **TAHAN** / **K** or **Space** | Hold a brace; only counts if pressed in the green window |
| **RESET** / **R** | Put the four characters back |
| **ZOOM − / +** / pinch / wheel / **Z / X** | Inspect the arena at 1.0×–1.8×; render-only, gameplay unchanged |

The bottom 40% is the interaction area. The top bar and counters are read-only apart from the zoom control under RESET.

### Push: tap vs held release

- The shove hits the nearest passenger within ~1.5 world units; the target is pushed away with mass-scaled force,
  staggers, and the player steps into the space. The target ring turns amber when someone is in reach.
- **Tap DORONG** for a normal shove. **Hold DORONG** to fill the button (about 0.5 s to the hard threshold) and
  **release** for a hard shove. The button reads `ISI` while charging and `LEPAS` when full; movement slows while
  charging. A release with no passenger in reach still spends the cooldown.
- **The player's body charges visibly.** While held, the player leans back, shifts weight behind the ring, and
  lowers slightly, scaled by `pushCharge`; at full charge the pose is loaded like A's shove wind-up, then the release
  flashes forward into the push. This is render-only.
- A **hard shove** carries more impulse, throws the passenger farther, and knocks them down. A normal shove only
  staggers them.
- Pushed passengers gain **anger**. Enough force (especially a hard shove) makes B — and A — plan a revenge. B shows
  `MARAH` and an orange ring before it comes back; the alert is the read.
- Pushing **A** during its wind-up **interrupts** the shove (`DIBLOK`).
- Pushing **B** moves a real body; they slide, recover, and walk back toward their starting spot unless angry.
- There is no resource cost in the arena. This is a feel test; energy/gengsi/rupiah live in the station prototype.
- **C is not selectable as a push target.** Pushing C directly does nothing; the camera risk is about hitting A or B while C is recording. C still has a body and blocks movement.

### Hold timing: normal vs revenge

- A's normal shove has a **0.9 s telegraph**; the timing panel appears and the ring around the player closes.
- The **green window is the last 0.30 s** before impact. Press **inside** that window and keep holding.
- Holding too early and holding through does **not** work; release and re-press inside the window.
- A **revenge shove** is deliberately different: **0.55 s lead / 0.18 s window**. The panel labels it
  `BALAS DENDAM · CEPAT` in orange, the world ring is orange instead of red, and the marker moves faster. Read it as a
  flinch, not a full wind-up.
- **PAS** — perfect brace: no knockback, A/B staggers. **TERLALU AWAL** / **TELAT** — the shove lands, throws the
  player farther, and knocks them down (`KAMU JATUH. Bangkit...`). **MELESET** — the player stepped out of range;
  the attacker overextends.
- While **fallen** the player cannot move, push, or brace; the controls dim until the get-up timer ends. B can also be
  knocked down by a hard shove; it gets up before taking revenge.
- **Falls go away from the pusher.** The first fallen frame latches the knockback direction, then tilts the body
  around a horizontal axis: a face-to-face shove lands on the **back**, a side hit falls sideways, and a hit from
  behind falls forward. Player, A, and B use the same render path; the sim only owns `fallen`/velocity.
- The aggressive keeps attacking after a cooldown. There is no death; the camera's viral fail is the only run-ending state; reset and repeat.

### Camera passenger: SIAP → MEREKAM → viral

- **C is a bystander, not an attacker.** C stands at the back, faces the player, and cannot be shoved. C's world cue is a phone, a floor cone, a `SIAP`/`REC` label, and a ring colour change; the HUD adds a camera strip and a countdown meter. The state is readable by shape + text, not colour alone.
- **Any successful push wakes the camera.** Immediately after a push that hits A or B, C goes **`SIAP`** for 0.9 s: phone up, amber cone/label, HUD strip `C · SIAP`, meter draining. That just-pushed hit is **not** recorded. A whiff or a push on C does not start the camera.
- **Then C records for 1.8 s.** Phone screen red, red cone, `REC` label, ring red, HUD strip `C · MEREKAM` with a pulsing red border. **Any push that hits A or B during this window is caught**; the state freezes and the viral feed opens. A push during `SIAP` is not caught; it only means the recording is about to start.
- **Then C cools down for 0.7 s** (`C · TURUN`) and returns to `C · DIAM`. Pushing during cooldown is not caught; the next successful push starts a new `SIAP` cycle.
- **The video is a readable threat, not a hidden dice roll.** The first push always gives the player a 0.9 s warning before recording. Once the strip is red, the safe play is to move, brace, or wait up to 1.8 s. The camera is deterministic: same inputs, same cycle.
- **The viral result** is a fictional Instagram-style popup: a captured still from the arena camera styled as the record's video, `@jakarta.hening`, a caption, eight authored negative comments and a `Lihat semua 1.284 komentar` line, then a `GAME OVER` footer with **COBA LAGI**. The frame is captured with `preserveDrawingBuffer` immediately after the catch; there is no video encoder, no Instagram API, no upload, no network, and no real account. All handles/comments are authored fiction.
- **The game over is terminal for that run.** The sim stops stepping, the overlay takes focus, and `COBA LAGI` resets the arena. The normal RESET, `R`, and the debug reset also clear the camera state.

### Zoom: inspect the arena

A compact `− 1.0× +` control sits under **RESET**. It changes only the orthographic camera's view height, so the
characters become larger without moving the arena, changing gameplay, or touching the sim.

- **Range 1.0×–1.8×**, in 0.2 steps. The minus/plus buttons disable at their limits. Pinch on the scene, use the
  mouse wheel, or press **Z** (in) / **X** (out). The `1.8×` cap was chosen so all four default-position characters
  stay fully visible at 390×844; at narrower widths, or when characters move to the far edge, the close view can crop.
- The camera stays centred on the arena — there is **no pan or follow**, so this is an inspect view, not a cinematic
  camera. A deeper zoom would need pan/follow and its own evidence.
- The zoom is a **view preference**: RESET, `R`, and COBA LAGI keep the current zoom. It is not saved and has no sim
  state.
- Pinch is handled on the WebGL canvas only, so it does not steal the joystick or action buttons. The canvas uses
  `touch-action: none`.

This is a **two-thumb layout**. It deliberately does **not** meet the v1 one-hand MUST. The one-hand question is a
product decision, not something this test answers.

## Station prototype (`/station.html`)

The earlier Draft 0 prototype is preserved at `/station.html`. It is the denser context: south gate →
ticket-gate queue → optional coffee → platform → three candidate door zones → train arrival → alighters → board →
seat/stand → result. Two waves at 1:30/3:30, 4:00 limit, hard fail, quick retry.

It uses a **two-act hold** (claim behind the yellow line, then board); sustained lean plus full-charge **Hentak**
release; crowd pulses; a station estimate vs the revealed door zone; alighters-first; vulnerable-passenger protect;
camera warning → silent viral fail. Energy/gengsi/rupiah are run-only; fare Rp 3.000 and coffee Rp 10.000 are
visibly labelled placeholder values. The detailed station controls and rules are in the
[Draft 0 brief](../../docs/games/pejuang-nafkah/research/2026-10-push-hold-prototype.md) and
[station report](../../artifacts/verification/prototype-0/2026-10-20/report.md).

## Architecture

```text
src/
  arena/             standalone push/hold arena (default entry)
    sim.ts           pure deterministic arena sim; no DOM/Three.js/wall clock
    world.ts         Three.js arena, characters, timing rings, camera
    hud.ts           DOM joystick, chargeable DORONG/TAHAN, timing bar, fallen/angry states
    main.ts          arena boot, fixed-step loop, input, resize, debug API
  sim/               station Draft 0 deterministic simulation + tests
  render/            station/train/interior/people Three.js views
  ui/                station DOM HUD at 10 Hz
  main.ts            station entry (`station.html`)
```

- Fixed **60 Hz** simulation. The arena has no wall clock, no `Math.random`, and no network; the same input
  sequence produces the same state (`AR-SIM-10`). The station has its seeded 60 Hz sim (`PA-SIM-17`).
- The sim owns gameplay truth; `render/` reads it only; `ui/` never computes outcomes.
- The arena is a fixed orthographic 3/4 diorama of a circular floor; its **1.0×–1.8× inspect zoom** is render-only. The station is a cutaway station diorama.
- The DOM HUDs update at 10 Hz, not every frame; the world-space rings run at render rate.
- `window.__ARENA__` / `window.__PEJUANG__` (only with `?debug=1`) expose state plus step/advance, reset, pause,
  HUD update, draw calls, and arena zoom controls for evidence capture. They are not save APIs.

## Tests and evidence

- **18 arena sim tests** (`AR-SIM-01`…`AR-SIM-18`): the original 14 plus camera prep/record/catch, safe prep push +
  clean recording return to idle, viral freeze/reset, and the camera passenger not being a push target. `AR-SIM-15` asserts the first push starts `SIAP`, the
  0.9 s transition to `MEREKAM`, and a hit during recording sets `gameOver='viral'` with the target id. `AR-SIM-16`
  pushes during prep without a catch and returns to idle after the clean recording. `AR-SIM-17` freezes time/pushes
  and clears all camera/viral state on reset.
- **17 station tests** (`PA-SIM-01`…`PA-SIM-17`) remain green; **35 tests total**. Zoom and the charge/fall poses are
  render/HUD-only, so they add no sim tests; their contracts are verified in the browser.
- `pnpm typecheck`, `pnpm test`, and `pnpm build` pass on the current tree. The build emits `index.html`,
  `station.html`, a shared Three.js chunk (579.84 kB / 146.54 kB gzip), the station chunk (74.49 kB), the arena chunk
  (46.32 kB / 13.99 kB gzip), and 33.61 kB CSS; the Three.js chunk triggers the usual 500 kB warning.
- Chromium evidence at **390×844** and **1280×900**: camera idle, camera `SIAP`/preparing with the meter, camera
  `MEREKAM`/recording, the viral Instagram-style popup with captured frame/comments/GAME OVER, after retry, and
  desktop preparing/recording/viral. The 390 and desktop runs used the real `J` key path, not only debug steps.
- Browser smoke in this pass: a staged nearby B + **J** tap started `SIAP`; the HUD meter drained; the next **J** tap
  during `MEREKAM` produced `gameOver='viral'`, the captured frame, the overlay, and **COBA LAGI** reset to idle. The
  earlier v2 pass already verified pointer hold/release, J hold, and TAHAN/K perfect brace; those handlers are
  unchanged.
- **Animation evidence (v5):** a real J hold reached full charge with the player visibly loaded; a real A shove
  produced a late brace and a back-first fall; the player recovered upright; B's hard shove fell away from the player.
  Temporary geometric probes put the player's back point at y=0.09 vs front y=0.54, and B's back at y=0.019 vs front
  y=0.468. The B capture uses deterministic debug stepping to hold the fall frame; the real-J hard-shove path was
  separately smoke-checked. See the [v5 report](../../artifacts/verification/prototype-0/2026-10-20-arena-v5/report.md).
- **Zoom evidence (v4):** buttons reached `1.8×` with plus disabled; minus disabled at `1.0×`; wheel and **Z/X**
  changed the label; a real CDP two-finger pinch (headless touch) reached the `1.8×` cap; RESET preserved `1.8×`;
  a 320×700 layout pass found no title/control overlap or horizontal scroll. Captures at 390×844 and 1280×900 show
  the default control, full 1.8× idle arena, and 1.8× recording action. No console errors beyond the known favicon
  404.
- **Not done:** real-phone two-thumb playtest, real-device performance, a11y/axe audit, real video recording/E2E
  trace, native/sensitivity review, offline/service-worker check, real-device pinch comfort, pan/follow camera,
  a deeper zoom, and a real-phone read of the new charge/fall poses. No automated animation tests: the character is one
  merged mesh, not a rigged body, and there is no ragdoll/physics. The headless Chromium here is SwiftShader-bound (single-digit fps); its FPS is **not** a performance
  result. Draw calls measured **44** in the desktop viral capture (25–30 before the camera props); zoom adds no draw
  calls.

## Known approximations

- **Arena timing is tuned to feel, not copied data.** The 0.9 s lead / 0.30 s window and the revenge
  0.55 s / 0.18 s quick window are prototype choices; the Push'em All and Clair Obscur sources are references, not
  frame data. The 0.18 s window is intentionally sharp and may be too short on a real phone. Expect to tune.
- **Charge/fall/revenge approximations.** The ~0.5 s hard threshold, ~1.05 s passenger fall, ~0.95 s player fall,
  and the deterministic anger-from-impact model are feel choices, not a physics or animation reference. There is
  no knockdown invulnerability, and B's revenge is deterministic once angry.
- **Camera/viral approximations.** 0.9 s `SIAP` / 1.8 s `MEREKAM` / 0.7 s cooldown are tuning guesses, and the
  popup's "video" is a captured still (JPEG) with play chrome, not encoded video. The comments, handle, likes and
  views are authored fiction; the popup is an original Instagram-style mock, not an embedded Instagram post. No
  real Instagram logo, account, API, upload, or network is used.
- **Charge/fall animation is a pose approximation.** The player wind-up is a whole-body lean, not an arm/leg rig;
  it is subtler when charging head-on to the camera. Falls use the knockback direction and a foot pivot, not ragdoll
  physics; limbs/backpacks can intersect or read oddly at some angles, and the 0.1 s fall/recover blend is an
  untested feel value. A and the passenger backpacks are low-poly greybox.
- **Zoom is an inspect aid, not a camera system.** It is capped at 1.8× and centred on the arena; no pan, no
  follow, no collision-aware framing, no smoothing, no saved preference. At 320 px the close view can crop a
  character at the edge; at 390 px the default four-character tableau fits. Real-phone pinch comfort and
  discoverability are untested.
- **The arena is two-thumb.** It is not one-hand and not the v1 control scheme.
- The station's **south entrance**, ticket-gate count, queue rails, coffee kiosk, specific platform/track, front-car
  stopping point, door markers, and car formation are approximations, not operator data.
- **Fare Rp 3.000, coffee Rp 10.000, headway, and crowding** are placeholder station values, not a tariff or
  schedule. The interior is plausible, not measured.
- Art is greybox/low-poly with original branding. No official KAI/Commuter/Instagram logo, trade dress,
  announcement, copied asset, or real social post is used. The arena has no vulnerable-passenger framing.

## Sources and credit

- Research sources: Push'em All App Store/iOSGames; Clair Obscur Expedition 33 parry/dodge guides (Game8,
  AUTOMATON); Wikipedia ID (Stasiun Jurangmangu); OpenStreetMap node `318720710`; Wikimedia Commons Jurangmangu.
  Retrieved 2026-10-20. Exact limits are in the briefs.
- OSM data: © OpenStreetMap contributors, ODbL 1.0. The station layout is an authored approximation from OSM and
  reference photos, not a survey.
- Wikimedia Commons reference photos: CC BY-SA 4.0 / CC BY 4.0; reference only, **not** used as textures. Local
  copies in `artifacts/research/jurangmangu-2026-10/` are not shipped. Reuse requires individual attribution.
- Real place names are descriptive facts; this is not an official operator product.

## Scope guard

Neither page changes the canonical v1 KRL rules. The station hard fail, energy stat, and viral game over are
non-canonical (ADR-0009). The arena is a two-thumb feel test with no resource scoring (ADR-0010); its camera/viral
game over is a social-failure presentation, not a resource system. The charge, fall, revenge quick-shove, camera
bystander, 1.8× inspect zoom, and the charge/fall pose are amendments to that lab decision, not a v1 combat, social,
camera, or ragdoll system. Integration with
Phase 1 requires a separate spec/ADR decision, the Phase 1 research gate, current station/fare data, a one-hand
control decision, and native/sensitivity review. Do not deploy either prototype as the game.
