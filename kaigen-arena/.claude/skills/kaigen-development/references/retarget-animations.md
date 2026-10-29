# Retargeting animation clips onto a different skeleton

When a clip pack's rig shares no joint names with your model, bake the clips
onto the model's skeleton offline and cook the result. Runtime remapping cannot
save you: `animation_build_joint_remap` matches by name (wiki animation.md) and
falls back to bind silently.

Working example in this project: `scripts/retarget_clips.py`
(source: `gameplay_blocks/character/default_character.glb` →
target: `assets/starting_template/characters/kaigen_bot.glb` →
output: `assets/arena_retarget/actions.glb`, 43 clips).

## Method: pure world-frame copy

For each animation, each frame:

1. Sample the source clip's local rotations/translations at the target time
   grid (glTF LINEAR rotation = slerp with hemisphere continuity: flip `q1`
   when `dot(q0,q1) < 0`; enforce sign continuity across output frames too).
2. Compose **source world transforms** down the source hierarchy (parents
   first). Source-only nodes (root/Armature/mannequin wrappers) contribute
   through composition — no explicit handling needed.
3. Assign each mapped target joint **the source joint's world rotation**:
   `Wd(t) = Ws(t)`. This works when both rigs are upright humans facing the
   same direction with similar proportions: skinning re-frames each mesh's own
   bind geometry onto the copied frames. Do NOT try rest-pose delta
   conjugation when the two rests are different *poses* (T-pose vs A-pose) —
   it double-counts the pose difference; absolute copy avoids the whole class
   of twist errors for humanoid→humanoid.
4. Hips/pelvis translation: `Td(t) = hips_rest_dst + (pelvis_world_src(t) -
   pelvis_world_src_rest) * scale`, with `scale = hips_height_dst /
   hips_height_src` (~1.08 in the worked example). Only the hips needs a
   translation channel; all other joints keep their target rest translations
   (bone lengths stay the target rig's — do not copy source bone lengths).
5. Convert world → local top-down over the TARGET hierarchy:
   `local = inv(parent_world) @ world`. Unmapped target joints keep their rest
   local transforms (no channels → engine uses bind rest).
6. Write rotation channels for every mapped joint + one translation channel
   for hips. Do not write scale (target rest scale is fine).

## Explicit name map

Hand-write the UE-style → Mixamo table (or whichever pair you have); nothing
is automatable when names share no prefix. Fingers map
`index_01_l → LeftHandIndex1 … index_04_leaf_l → LeftHandIndex4`, ball/leaf
toe bones → `ToeBase`/`Toe_End`, `pelvis → Hips`, `spine_01/02/03 →
Spine/Spine1/Spine2`, `neck_01 → Neck`, `clavicle → Shoulder`,
`upperarm/lowerarm/hand → Arm/ForeArm/Hand`, `thigh/calf/foot →
UpLeg/Leg/Foot`. Verify every target exists (namespace-stripped lookup: bot
nodes are `mixamorig:Hips`; index with both raw and stripped names).

## glTF writer gotchas (each one cost a broken cook)

- **`channel.sampler` must index the animation's OWN `samplers` slice**, not a
  global list. Record `len(sams) - 1 - s0` (offset by the animation's start),
  not `len(sams) - 1`. Symptom of getting this wrong: only the FIRST animation
  in the file works, the rest cook empty/standing. Validate after writing:
  for every channel, `channel.sampler < len(animation.samplers)` and
  `sampler.input/input output < len(accessors)` — expect 0 out-of-range.
- **No root-level `"samplers"` key** — samplers live inside each animation
  object only. An extra root key is invalid glTF (may be ignored silently).
- Time accessors: `"type": "SCALAR"`, `componentType: 5126`, include
  `"min"`/`"max"`.
- Pad the BIN chunk and the JSON chunk to 4 bytes; rebuild the header lengths.
- Keep the target file's mesh/skin/materials untouched — only replace
  `animations` and append buffer data; copy `bufferViews`/`accessors` then
  extend.
- Hemisphere continuity for quaternions within AND across frames (see above);
  otherwise slerp takes the long arc and the pose spins mid-clip.

## Cook and wire

- Drop the glb under an asset root (`assets/<dir>/<name>.glb`), run
  `hz/hzbuild cook` (or a normal build) → clips land at
  `cooked/<dir>/<name>/<AnimName>.hza`.
- Reference in code WITHOUT the `cooked/` prefix and WITHOUT the extension:
  `"arena_retarget/actions/Push_Loop.hza"`.
- One `.hza` per animation, named after the animation; the model blob is the
  glb stem itself.

## Verify before you trust the engine

1. **FK the baked file in Python first**: sample a mid frame of each key clip,
   compose the hierarchy, print world positions:
   - Death/fall: head y ≈ 0–0.2 (on the floor), hips y ≈ 0.05–0.1.
   - Punch: hand z advances well in front of the body; feet planted.
   - Push: hands forward of the head, body low/crouched.
   - Walk: foot z range ≈ ±0.3 m, hand swing opposite the near foot.
   - Hips XZ net drift ≈ 0 for in-place loops (root motion would double-move).
2. **Correlate source vs baked trajectories** (hand, hips): per-axis Pearson
   correlation ≈ 1.0, ranges match within a few percent. If not, the retarget
   math is wrong — do not cook yet.
3. Cook, build, then force each state with the verification harness
   (see SKILL.md § Visual verification harness), capture close-ups (≤3 m),
   Read every PNG, and describe pose vs intent.
4. Breadcrumb once per state change (`asset_is_ready` failure is a silent
   `continue`) until paths are proven.

## Common failures

| Symptom | Cause |
|---|---|
| All clips identical standing pose | channel.sampler out of range (writer bug) or joint-name mismatch (never retargeted) |
| Only first animation works | global instead of per-animation sampler indices |
| Pose spins wildly mid-clip | quaternion sign discontinuity (long-arc slerp) |
| Character too short/tall vs source | hips translation not scaled by height ratio |
| Feet slide while walking in place | source clip has root motion + sim also moves the entity |
| Cook finds no clips | glb not under an asset root, or referenced path includes `cooked/` or `.hza` extension incorrectly |
| Bind pose perfect, any clip turns the mesh into noodles | clip does not cover the model palette 1:1 — see below |

## The clip must cover the FULL model palette, in palette order

`AnimationState.remap == NULL` means "clip joint i drives `skins[0].joints[i]`" —
the engine only builds a name remap when the lists visibly differ, and a clip that
omits joints at the palette **start** (Quaternius rigs put `Root`, `Body` first)
shifts every subsequent joint. The writer must therefore emit a channel for **every**
index of `djs["skins"][0]["joints"]`, iterating that array for order (rest-pose
constants for joints the retarget didn't map). Check after writing:
`len(clip joints) == len(model palette)` — `retarget_clips.py` prints
`N palette joints (M animated)` per clip.
