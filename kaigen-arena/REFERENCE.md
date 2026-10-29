# Kaigen Arena — build & regeneration reference

Authoritative **mechanics** source: `games/pejuang-nafkah/src/arena/sim.ts` (the
three.js game — never modify it). This file documents how the **Kaigen/HZ port**
is built and verified so a future session can regenerate or repair it end to end.
Engine-level traps live in `.agents/skills/kaigen-development/SKILL.md` — read that
before diagnosing anything "weird".

## 1. What the game is

Push/hold arena ("ARENA UJI · DORONG & TAHAN"): you are shoved by NPCs and must
DORONG (push) them down while timing TAHAN (brace) against incoming shoves, while a
filmer records — a push that lands during recording ends the round as "viral".

Four characters, spawn table (mirrors `createArenaState()` in sim.ts), one serial
fixed-step sim pass:

| Role | enum | Spawn (x,z) | Mass | Model scale | Behavior |
|---|---|---|---|---|---|
| Player | `ARENA_ROLE_PLAYER` 0 | (0, 3) | 1.05 | 1.00 | WASD input |
| Worker | `ARENA_ROLE_AGGRESSIVE` 1 | (-2.3, -0.7) | 1.32 | 1.10 | chases, shoves |
| Student | `ARENA_ROLE_PASSIVE` 2 | (2.35, 0.35) | 0.88 | 0.92 | retreats home, faces player |
| Shopper | `ARENA_ROLE_FILMER` 3 | (0, -2.85) | 1.00 | 1.00 | films (camera-hold) |

Controls: **WASD** move, **J** push (hold ≥ 72% of charge = hard "keras"),
**K / Space** brace, **L** aim-assist (steers at nearest pushable body),
**R** reset, **Shift** run, **wheel** zoom. All HUD strings are Indonesian.

### Core numbers (must mirror the `ARENA` table in sim.ts)

Arena radius 4.4; body/contact radii 0.34/0.62; move speed 3.1, friction 6.2.
Push: reach 1.5, cooldown 0.45, charge 0.7 s (hard ≥ 0.72), impulse 5.4 / hard 11.5,
stagger 0.42 / 1.0, hard fall 1.05, lunge 0.16 / 0.24.
Anger: +0.35 per push landed on an NPC, +0.9 per charge; revenge delay 0.35.
NPC shove: chase speed 1.45 to range 2.05, windup 0.9 (revenge 0.55), window 0.3
(0.18), impulse 9.5 (8.5), stagger 0.9, fall 0.95 (0.8), attack cooldown 2.2.
Retreat speed 0.35. Reset player = (0, 3), facing = π (toward arena center).
Full table: `starting_template.c` `#define ARENA_*` block (~line 190).

### State machine highlights

- **Brace**: incoming shove sets `has_incoming` + `impact_at`; holding K/Space in
  the window resolves `ARENA_BRACE_PERFECT` ("PAS") → `perfects++`, or early/late/
  miss; pushing during the windup = `BRACE_INTERRUPT`. HUD counters:
  `DORONG` = `g->pushes`, `PAS` = `g->perfects`.
- **Fall / get-up**: `fallen > 0` → FALL clip; when it reaches 0 the avatar system
  one-shots GETUP = **Death01 played backwards** (speed −1 from clip end).
- **Filmer cycle**: `IDLE → (a push lands) → PREPARING 0.9 s → RECORDING 1.8 s`;
  another push landing during RECORDING → `game_over` + `viral_target_role`
  (round over). Cooldown 0.7 s.
- **Anim priority** (arena_anim_system): down > getting-up > staggered > punch >
  brace/charge > filming > windup > moving > idle.

## 2. Code map (`src/starting_template/`)

- `starting_template.c` — everything: spawn, sim, anim, HUD, debug commands.
  - `arena_step_system` (EcsInOut ArenaChar + ArenaGameState + PlayerControls):
    THE sim port — one serial pass, writes `Local/WorldTransform` with
    `quat_rotate_y(facing)` at the end.
  - `arena_anim_system` (ArenaChar + ArenaAvatarRef + EcsAnimationLayer + clip
    resources): priority state machine, crossfades, builds the joint remap.
  - `arena_spawn_char()` — body entity + avatar child (model, layer, blob disc) +
    `ArenaAvatarRef`.
  - HUD (`hud_text`/`str_format`), `app_init`/`app_update_and_render`.
- `starting_template.h` — `ArenaChar {x,z,vx,vz,facing,mass,home…,fallen,stagger,…}`.
  `facing` semantics: **yaw for a +Z-facing model, `atan2(dir.x, dir.z)` — never
  negate** (gameplay_blocks `character.c` convention; the negated `atan2(-x,-z)`
  camera form causes 180° moonwalk/filmer-facing-backwards bugs).
- Resources: `ArenaGameState` (sim + `debug_force`/`debug_cam*`),
  `ArenaClips {ArenaClipSet female, male}` (both = same Quaternius rig today),
  `ArenaAnimRig {alloc}` (persistent remap allocator), `PlayerControls`,
  `CharacterFrame`, `ArenaFocusRef`.
- Debug commands (registered in `app_init`):
  - `arena_force:<idle|walk|jog|push|punch|hit|fall|getup|aim|off>` pins every
    avatar's clip (GETUP = reversed death).
  - `arena_cam:<dist>[:yaw_deg]` — follow cam on the player, re-set every frame in
    `app_update_and_render` (aim 1.05 m chest, 0.35 m for fall/getup); yaw is
    relative to the player's facing; empty arg clears.

## 3. Character rendering

### Models (all CC0 Quaternius "Ultimate Modular" packs, downloaded from quaternius.com)

`assets/arena_commuter/` (4 files, one shared rig: `Root/Body/Hips/Abdomen…`,
62 joints, no scale nodes, flat **named** materials, 24 embedded anims each):

| File | Character | Outfit (material = body region) |
|---|---|---|
| `female_commuter.glb` | Player | `White` tee, `Orange` pants, `Grey` shoes, `Hair_Blond/Brown` hair |
| `male_casual.glb` | Worker | `LightBrown` tee, `LightBlue` trousers, `Red_Dark` shoes |
| `male_hoodie.glb` | Student | `Purple` hoodie (+shoes prim), `LightBlue` shorts |
| `female_hijab.glb` | Shopper | `LimeGreen` blouse+skirt, `Red` hair+shoes, `Brown` bun, `Gold` belt |

Indonesian look = **recolor only** (glTF `baseColorFactor` is LINEAR):
`SKIN=(0.36,0.215,0.115)`, `SKIN_DARKER`, `HAIR_BLACK`, jilbab `HIJAB` teal,
`DENIM` — table in `scripts/import_quaternius_pack.py`. The jilbab is the hair
material recolored (no hijab geometry); `_probe_mats.py <glb>` prints
material → y-range so regions can be re-mapped after a pack change.

### Regenerating models from scratch

1. Pack pages on quaternius.com embed Google Drive folders:
   `python scripts/gdrive_fetch.py list <folderId>` then `… get <fileId> out/qpack/x.gltf`.
   (Never use Poly Pizza re-exports — they add ×100 scale nodes and render as
   garbage in HZ; see skill trap.)
2. `python scripts/import_quaternius_pack.py` → converts `.gltf` (embedded
   buffers) → `.glb`, applies the recolor table, writes `assets/arena_commuter/`.
3. `hz\hzbuild cook` (reseeds `.import.hzt` sidecars + cooked materials).

### Render rules (measured — do not "fix")

- `casts_shadow = false` on avatars + flat blob discs (cylinder scale 1.24):
  4 skinned shadow casters cost ~25 ms CPU/frame; discs cost nothing.
- Models are ~1.85 m; spawn scales in the table above balance the cast.

## 4. Animation pipeline

### State → clip (single clip set: `assets/arena_retarget_male/actions.glb` →
`cooked/arena_retarget_male/actions/<Clip>.hza`)

| State | Clip | Notes |
|---|---|---|
| idle | `Idle_Loop` | spawn `ArenaAvatarRef.idle`, same path |
| walk / jog | `Walk_Loop` / `Jog_Fwd_Loop` | NPC speed² > 0.09 |
| push (charge/windup/hold) | `Push_Loop` | player hold + NPC windup |
| punch (one-shot on landed push) | `Punch_Jab` | |
| hit (stagger) | `Hit_Chest` | |
| fall / get-up | `Death01` | get-up = reversed (speed −1, start = length) |
| aim (filmer recording) | `Pistol_Aim_Neutral` | two-handed camera hold |

Source of these clips: UE-rig `gameplay_blocks/.../default_character.glb`
(43 clips), baked onto the Quaternius rig by `scripts/retarget_clips.py male`.

### Retarget rules (the hard-won part — details in
`.agents/skills/kaigen-development/references/retarget-animations.md`)

- Method: **pure world-frame copy** `Wd_j(t) = Ws_j(t)`; hips translation =
  dst rest + scaled src delta; explicit UE→target name map (`MAP_MALE`).
- **The clip MUST cover the whole model palette in `skins[0].joints` order**
  (rest constants for unmapped `Root`/`Body`) or the engine's NULL "1:1" remap
  index-drives the palette into noodles. The writer prints
  `N palette joints (M animated)` per clip — N must equal the palette size.
- glTF writer traps: per-**animation** `channel.sampler` indices, quaternion sign
  continuity, min/max on time accessors, 4-byte chunk padding.
- Verify with FK in Python (head y≈0 at 55% of Death, hands forward in Punch)
  BEFORE cooking; then force-state + close-up screenshot.

### Layer ownership (do not regress)

- Never set `EcsAnimationRef` on avatars — its engine-side play is remap-less.
  `arena_spawn_char` creates `EcsAnimationLayer` directly via
  `animation_layer_create(rig->alloc)`; `arena_anim_system` is the only driver and
  calls `animation_build_joint_remap` on **every** play (returns NULL only on a
  true 1:1 match).
- Clip references in code omit `cooked/` and live under `.path =
  "arena_retarget_male/actions/<Clip>.hza"`.

## 5. Build & verify loop

```powershell
Set-Location <repo>/kaigen-arena
.\hz\hzbuild --release                     # compile + incremental cook
.\hz\hzbuild cook                          # full asset cook (after script output)
.\hz\hzbuild --release --commands "1.4:arena_cam:3.2:0;2.3:screenshot:out/x.png;2.7:quit" -- --headless
```

Every script ends with `quit`; screenshots ≥ 0.3 s apart; first run after link is
slow (re-run before diagnosing fps). Kill a stuck exe first
(`Stop-Process -Name kaigen-arena`) or link fails LNK1168.

**Evidence discipline**: nothing is done until the build is clean, the screenshots
are Read, and each pose is described in words (facing, limbs, contact). Use
`arena_force` + `arena_cam` close-ups (≤ 3.5 m); distant shots prove nothing.
Verification baseline that must pass after any change: idle, walk, aim (all four
face the player), push lunge, fall flat, get-up, and one live (no-force) capture.

## 6. Regeneration checklist (fresh clone)

1. Engine link + license present (`hz` junction, `hz\hzbuild` works).
2. `hz\hzbuild cook` — cooks committed assets (commuter models, retarget sets,
   gameplay_blocks source).
3. `hz\hzbuild --release` — builds; if models/clips changed, re-run the Python
   scripts first (`import_quaternius_pack.py`, `retarget_clips.py male`).
4. Run the verification baseline (§5).
5. If adding a state/clip: extend `ArenaClipSet`, bake into
   `arena_retarget_male` (full palette!), map it in the anim priority block.

## 7. Repair quick index

| Symptom | First look |
|---|---|
| Characters face wrong way / moonwalk | §1 facing formula; skill "facing" trap |
| Mesh noodles/sails, bind pose fine | skill "clip covers palette" trap + retarget reference §palette |
| Bind pose itself corrupted | Poly Pizza re-export trap; test with `EcsAnimationRef`/layer off |
| Clip never plays / frozen | `anim skip` breadcrumb logs in arena_anim_system; `asset_is_ready` paths |
| Skinned characters tank fps | skill: shadows off + blob discs |
| Clip names changed after cook | list `cooked/<dir>/<model>/`, cook sanitizes `A|B` → `A_B` |
| 8-term `ecs_system` error | skill: fold new data into an existing resource |

After fixing anything non-obvious, append a 2–6 line symptom→cause→fix entry to
`.agents/skills/kaigen-development/SKILL.md` (mandatory per AGENTS.md).

## 8. Repo rules

- `games/pejuang-nafkah/` (three.js) is **reference-only — never edit**.
- Work lands on branch `feat/kaigen-arena` → PR #16 in `ahaqqu/wni-series`.
- Off-line tooling is Python by design (`scripts/*.py`: bake/recolor/convert
  helpers run once per asset change; the shipped game is pure C).
- Key scripts: `retarget_clips.py [bot|male]`, `import_quaternius_pack.py`,
  `gdrive_fetch.py list|get`, `_probe_mats.py <glb>`.
