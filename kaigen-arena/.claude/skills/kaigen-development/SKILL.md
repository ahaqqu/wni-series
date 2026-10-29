---
name: kaigen-development
description: Hard-won Kaigen/HZ lessons that are NOT in hz-core, hz-build, hz-game or the wiki — ecs_system term limit, skinned shadow-caster cost, slow first run after link, building --commands verification harnesses (force-animation + tracking debug camera), and diagnosing animations that look stiff/not human (joint-name mismatch bind fallback, offline clip retarget). Use for ANY game developed with kaigen/hzbuild when the engine behaves oddly, a compile error mentions _ECS_FOR_EACH_TERM, animations look wrong, or you must visually verify gameplay. Also the living record every agent updates when it learns something new (see Continuous improvement).
---

# Kaigen Development — lessons beyond the shipped skills

Everything here was discovered the hard way in real sessions and is NOT covered
by hz-core / hz-build / hz-game / the engine wiki. Read the Traps section before
diagnosing anything "weird"; read Verification before claiming something works.

## Continuous improvement (MANDATORY — every agent, every session)

This skill is a living ledger. When you work on ANY Kaigen project:

- **You struggled with something** (error, wrong behavior, silent failure) and
  found the cause after real effort → add it here once solved.
- **You found something helpful**: a useful command, hook, pattern, script, or
  API shape the docs don't mention → add it.
- **You found a best practice or an anti-pattern to avoid** → add it as a trap
  with symptom → cause → fix.

How to update:

1. Edit `.agents/skills/kaigen-development/SKILL.md` (this file) directly.
2. Entries are 2–6 lines: **symptom → cause → fix**, with exact commands or
   file paths. No essays, no narration of your session.
3. Generic Kaigen knowledge (any game) goes HERE. Knowledge specific to one
   game's content/doors/scoring goes to `kaigen-development-<gamename>` (create
   that sibling skill in `.agents/skills/` when the first game-specific lesson
   appears) or to the game's own docs.
4. Engine bugs (crash in `src/engine`, build failure in engine sources) are NOT
   entries: offer `hz/hzbuild report` to the user first (never file unprompted).
5. Never delete an entry — compress it. Keep SKILL.md under ~5,000 words; move
   long recipes into `references/` and link them.
6. After editing, re-read your entry once: would the *next* agent have hit the
   same wall without it? If not specific enough, it is not done.

## Traps (symptom → cause → fix)

### `ecs_system` accepts at most 8 terms
Cryptic preprocessing errors — `error C2065: '_ecs_res_in': undeclared`,
`pasting '_ECS_FOR_EACH_TERM_' and '(' does not result in a valid
preprocessing token`, then a cascade of `expected an expression instead of a
type` — when you add a 9th term to an `ecs_system(...)` declaration.
Cause: `_ECS_FOR_EACH_TERM_1..8` in `ecs_internal.h`; there is no 9.
Fix: do not add the term. Fold the new data into an existing resource term
(e.g. add a field to a resource the system already declares) or split the
system. The error points at the term list, not the real problem.

### Skinned shadow casters can cost the whole frame
4 skinned characters with `casts_shadow = true` → ~25 ms CPU/frame (~4 fps);
the same scene with `casts_shadow = false` → ~3 ms, 59 fps. The cost is the
shadow pass re-evaluating skinning, not the characters themselves.
Fix: for many NPCs, disable `casts_shadow` on avatars and use flat blob-shadow
discs (a thin cylinder + dark material under each character). Measure before
and after with the perf overlay; `rperf` / `stats.dump` show shadow triangles.
(Engine wiki documents shadow LOD/triangles, not this CPU cost.)

### First run after a link is slow — re-run before diagnosing
Post-build runs sometimes report 3–5 fps transiently (startup/GPU warmup).
Cause: not your content. Fix: run the UNCHANGED binary a second time; only if
the slowness repeats is it real. Never re-diagnose content from one cold run.

### `CString` is `char*`, not `const char*`
`error C4090: 'function': different 'const' qualifiers` (treated as error) when
passing a `const char *` to `cstr_to_f32` / `cstr_equal`. Fix: keep a plain
`char *` (e.g. walk `ctx->args` with `char *sep`), or cast.

### Screenshots of an animation that never change = frozen, not "subtle"
Two screenshots 1+ second apart during an *active* state showing pixel-similar
poses mean the clip is not advancing or not driving the skeleton at all
(bind-pose fallback), not that the animation is slow. Compare frames before
tuning anything. See "Animations look stiff" below.

### Characters walk backward / face away from their target
Symptom: bodies travel one way but face the opposite (moonwalk look); a follower
aims/shoves away from its subject. Cause: facing yaw computed as
`atan2(-dx, -dz)` — the negated form belongs to the camera convention
(forward = (-sin, -cos)); models face **+Z** and are rotated with
`quat_rotate_y(yaw)`, so yaw must be `atan2(dx, dz)` (gameplay_blocks
`character.c:492`). Fix: drop the negation at EVERY facing site; the tell is a
hand-written reset value (`facing = M_PI`) that disagrees with the spawn helper
for the same spot. Debug-cam `yaw` offsets are relative to facing, so views swap
180° after the fix — re-check capture scripts.

### Clips play but the mesh explodes while BIND pose is perfect
Symptom: model renders a clean bind/T-pose with no animation, but any clip turns it
into noodles/sails — and `animation_build_joint_remap` returns NULL ("1:1").
Cause: a NULL remap index-drives `palette[i]` from `clip_joint[i]`; if the clip
covers only a SUBSET of `skins[0].joints` or a different order, every joint after
the first gap shifts (missing Root/Body at the palette START = total garbage).
Fix: bake channels for EVERY palette joint in `skins[0].joints` order (rest
constants for unmapped ones) — see `retarget_clips.py` (`skin_order` writer).
Verify `clip joint count == palette count` before blaming the engine.

### Poly Pizza re-exports corrupt Quaternius models in HZ
Symptom: pristine download renders bind garbage (collapsed or inverted) even with
no clip playing. Cause: Poly Pizza re-exports add ×100 scale nodes on mesh/armature
and rewrite skin data; HZ's `gltf_unify_skins`/bind-shape pass chokes on it.
Fix: download from quaternius.com directly (pack pages embed Google Drive folders;
`scripts/gdrive_fetch.py list|get <folder>` scrapes them) — Quaternius's own `.gltf`
files (embedded buffers, no scale nodes) render perfectly; convert with
`scripts/import_quaternius_pack.py`.

### EcsAnimationRef auto-plays WITHOUT a remap
Symptom: your state machine sets `AnimationState.remap` on every play, yet the mesh
still shows a garbage index-driven pose. Cause: `EcsAnimationRef` creates the
`EcsAnimationLayer` and plays the clip WITHOUT a remap (asset-cook.md) — engine and
game fight over the layer. Fix: never set `EcsAnimationRef` for custom-driven
avatars; create the layer yourself at spawn:
`ecs_component_set(..., EcsAnimationLayer, {.layer = animation_layer_create(rig->alloc)})`
so your system is the only driver.

### Fixed-step edge detectors fire on time rewinds
Teleport / R-reset / scene reload rewinds sim time; `t > last` edge detectors
then fire phantom one-shots (a punch or get-up triggers on reset).
Fix: store the previous timestamp per entity/resource and skip edges when
`now < prev` (time went backwards), then update `prev`.

## Visual verification harness (build one early)

Do not verify gameplay by reading code or logs alone. The engine's `--commands`
scripted runs (hz-build) are the agent-facing mechanism; extend them with your
own verbs so states you cannot reach by timing become deterministic:

- Register commands in `app_init` (main lane) with
  `hz_command_register(name, fn, user)` from `hz_command_registry.h`; pass a
  pointer to your app state as `user`. Handlers resolve by name at execute
  time, so register before any script can fire. API: wiki
  `engine/hz-command-registry.md`; pattern: engine module `art_styles`
  (`style_dump`).
- Worked example in this project (`src/starting_template/starting_template.c`):
  - `arena_force:<idle|walk|push|punch|hit|fall|getup|aim|off>` — pins every
    character's animation state (a `debug_force` field on a resource the anim
    system checks first), so scripted screenshots capture exact poses.
  - `arena_cam:<dist>[:yaw_deg]` — stores follow-camera settings in a resource;
    the app re-sets `renderer_debug_camera_set` every frame in
    `app_update_and_render` (main lane, before `renderer_update`). Empty arg
    clears with `renderer_debug_camera_clear`.
- `frame_entity:<name>` (built-in) only aims once — it does NOT track. A moving
  subject (shoved by the sim) leaves the frame between command and screenshot.
  For anything that moves, re-set the debug camera every frame from the
  subject's current `WorldTransform`.
- Adapt aim height to the pose: lying/get-up poses live near the floor — aim at
  ~0.35 m instead of chest height (~1.05 m), or the body sits at the frame edge.
- Capture each forced state to a DISTINCT path, ≥0.3 s apart, `quit` ≥0.2 s
  after the last screenshot (hz-build), then **Read every PNG and describe the
  pose vs intent in words**. Distant shots prove nothing about limb angles —
  get the camera within ~3 m.

## Animations look stiff / "not human"

First suspect: **clip-to-skeleton joint-name mismatch → silent bind-pose
fallback**. The wiki states the mechanism (animation.md Gotchas) but not the
diagnosis or fix for rigs that share *no* names.

- Diagnosis (2 min, Python + numpy): parse both `.glb`s (JSON chunk), collect
  node names, strip exporter namespaces (`mixamorig:Hips` → `Hips`,
  `Armature|Hips` → `Hips`), count the intersection. Real case from this
  project: **1 of 67 matched** (UE-style `thigh_l`/`lowerarm_l`/`neck_01` clip
  rig vs Mixamo `LeftLeg`/`LeftForeArm`/`Neck` bot) → every action clip froze
  in a standing pose while the model's OWN idle clip looked fine (1:1 rig).
  Tell-tale: idle/moves authored for the exact model play correctly; borrowed
  packs do not.
- Fix: offline retarget — bake the clips onto the target skeleton and cook the
  result; never try to patch names at runtime. Full recipe, glTF writer
  gotchas and the verify-before-engine checklist:
  **`references/retarget-animations.md`** (worked example: the project-root
  `retarget_clips.py` under the repo's `scripts` dir).
- Verify the baked data with forward kinematics in Python BEFORE blaming the
  engine: sample key frames, compose the hierarchy, print world positions of
  hips/head/hands/feet (death → head y ≈ 0 on the floor; punch → hand z well
  in front). Correlate source vs baked hand trajectories per axis (expect
  ≈1.0). Only then cook and screenshot.
- After wiring new clip paths, confirm the engine loads them: force the state,
  screenshot, Read the pose. `asset_is_ready` failures are silent `continue`s
  in the anim system — a breadcrumb `log_info` once per state change is enough
  to tell "not loaded" from "loaded but wrong".

## Scene / spawn conventions that bite

- Respawn/reset logic must run BEFORE any early-return (e.g. game-over freeze),
  or R-reset stops working while dead — a common ordering bug.
- A clip loop plays in place; if the sim also moves the entity, root motion
  inside the clip doubles the movement. Check hips XZ range of baked clips:
  in-place loops should have ≈0 net drift.
