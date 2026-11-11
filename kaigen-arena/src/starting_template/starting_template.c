// STARTING TEMPLATE: grid floor, day/night sky, character, follow camera, HUD; search wiki/index.md before writing a helper.
#include "app/app.h"
#include "assets/assets.h"
#include "ecs/ecs.h"
#include "ecs/ecs.gen.h"
#include "ecs/camera/ecs_camera.h"
#include "ecs/ecs_assets/ecs_assets.h"
#include "ecs/ecs_editor/ecs_editor.h"
#include "ecs/ecs_ik/ecs_ik.h"
#include "ecs/ecs_physics/ecs_physics.h"
#include "ecs/ecs_rigidbody/ecs_rigidbody.h"
#include "ecs/input/ecs_input.h"
#include "ecs/renderer/ecs_renderer.h"
#include "ecs/transform/ecs_transform.h"
#include "gameplay/camera_rig/camera_rig.h"
#include "gameplay/character/character.h"
#include "gameplay/day_night/day_night.h"
#include "gameplay/touch_controls/touch_controls.h"
#include "input.h"
#include "lib/hzmath.h"
#include "lib/thread_context.h"
#include "lib/typedefs.h"
#include "os/os.h"
#include "perf_stats.h"
#include "physics/physics.h"
#include "rendering/gizmos.h"
#include "rendering/gizmos_utils/gizmos_utils.h"
#include "rendering/renderer.h"
#include "scene/scene.h"
#include "ui/ui.h"
#include "generated/types_app.gen.h"
#include "starting_template.h"
#include "game_sim.h"
#include "hz_command_registry.h"
#include "starting_template/starting_template.gen.h"

// editor, picking and gizmos cost GPU memory a shipped build does not need
#ifdef DEBUG
#define GAME_DEV_TOOLS 1
#else
#define GAME_DEV_TOOLS 0
#endif

// the level is scene data: edit it with F1, save with F5, then `hz/hzbuild cook`
#define GAME_SCENE_PATH "starting_template/main.hzt"
#define GAME_GRAVITY 9.81f
#define GAME_FIXED_HZ 60.0f
#define GAME_MAX_SUBSTEPS 4
// wall-clock dt is not clamped by the engine: a hitch must not become one giant simulation step
#define GAME_MAX_DT (1.0f / 20.0f)
#define GAME_LOOK_SENSITIVITY 0.003f // radians per mouse pixel
#define GAME_TOUCH_LOOK 0.005f       // radians per dragged point
#define GAME_ZOOM_RATE 0.1f
#define GAME_PINCH_ZOOM 0.02f // zoom per point of pinch spread
#define GAME_SPAWN ((v3){0.0f, 0.1f, 0.0f})
#define GAME_FALL_Y -20.0f // below this the player respawns
// the player's avatar: the Kaigen bot, female (0, default) or male (1); same clips on both
#ifndef GAME_AVATAR_MALE
#define GAME_AVATAR_MALE 0
#endif
#if GAME_AVATAR_MALE
#define GAME_AVATAR "starting_template/characters/kaigen_bot"
#else
#define GAME_AVATAR "starting_template/characters/kaigen_bot_female"
#endif

// the arena's four characters: Kaigen bot avatars, idle clips per model (push/fall/filming clips land with the sim)
#define ARENA_AVATAR_FEMALE "starting_template/characters/kaigen_bot_female"
#define ARENA_AVATAR_MALE "starting_template/characters/kaigen_bot"

ECS_COMPONENT_TYPEDEF(AppMemory);

// reflected components (editor, scene, set:) live in starting_template.h; a plain pointer write is invisible to change detection

// resource: the entity the camera's follow rig orbits â€” the arena center, so the whole ring stays framed
typedef struct ArenaFocusRef {
  EcsEntity focus;
} ArenaFocusRef;
ECS_COMPONENT_TYPEDEF(ArenaFocusRef);

// runtime link from an arena character entity to its skinned avatar child + its ready-to-play idle clip
typedef struct ArenaAvatarRef {
  EcsEntity avatar;
  HzHandleT(AnimationBlobAsset) idle; // the model's own clip (1:1 rig, no remap)
  HzHandleT(ModelBlobAsset) model;
  i32 playing_id; // ArenaAnimId crossfaded in; -1 before the first play
  i32 one_shot;   // ArenaAnimId forced for one_shot_t seconds (punch, get-up), -1 none
  f32 one_shot_t;
  f32 prev_fallen;
  i32 prev_pushes;
  f32 prev_time; // detect an R reset (the sim clock rewound) and skip edge triggers
  b32 ik_tuned;  // foot_height measured from the bind pose once the model is ready
} ArenaAvatarRef;
ECS_COMPONENT_TYPEDEF(ArenaAvatarRef);

// one clip set per rig family: females = Mixamo-style names (baked arena_retarget),
// male commuters = Quaternius L-suffixed rig (baked arena_retarget_male)
typedef struct ArenaClipSet {
  HzHandleT(AnimationBlobAsset) walk, jog, push, punch, hit, death, aim;
} ArenaClipSet;
typedef struct ArenaClips {
  ArenaClipSet female;
  ArenaClipSet male;
} ArenaClips;
ECS_COMPONENT_TYPEDEF(ArenaClips);

// persistent allocator for clip->skeleton remaps
typedef struct ArenaAnimRig {
  Allocator *alloc;
} ArenaAnimRig;
ECS_COMPONENT_TYPEDEF(ArenaAnimRig);

enum {
  AANIM_IDLE = 0,
  AANIM_WALK,
  AANIM_JOG,
  AANIM_PUSH,  // DORONG charge / TAHAN brace / NPC shove windup: both arms drive forward
  AANIM_PUNCH, // DORONG release strike
  AANIM_HIT,   // staggered by a shove
  AANIM_FALL,  // knocked down: full-body fall (held at the ground)
  AANIM_GETUP, // Death01 played backwards â€” stands back up
  AANIM_AIM,   // filmer holds the camera up with both hands
};

// yaw facing +Z-forward toward a point, same convention as the three.js sim
hz_internal f32 arena_len(f32 x, f32 z); // arena_sim below; used by the anim system's speed sync

hz_internal f32 arena_face_toward(f32 from_x, f32 from_z, f32 to_x, f32 to_z) {
  f32 dx = to_x - from_x;
  f32 dz = to_z - from_z;
  if (dx * dx + dz * dz < 1e-6f)
    return 0.0f;
  return m_atan2f(dx, dz); // models face +Z: yaw = atan2(dir.x, dir.z) (character.h / character.c convention)
}

// main lane: an ArenaChar body with a Kaigen bot avatar hanging under it
hz_internal EcsEntity arena_spawn_char(EcsWorld *w, AssetSystem *assets, CString name, i32 role, v3 feet, f32 mass,
                                       f32 scale, f32 facing, CString model, CString idle_clip) {
  EcsEntity e = ecs_entity_create(w);
  ecs_component_set(w, e, EntityName, {.name = fixedstr64_from_cstr((char *)name)});
  ecs_component_set(w, e, LocalTransform, {.position = feet, .rotation = quat_identity(), .scale = V3_ONE});
  ecs_component_set(w, e, WorldTransform, {.position = feet, .rotation = quat_identity(), .scale = V3_ONE});
  ecs_component_set(w, e, ArenaChar,
                    {.role = role,
                     .mass = mass,
                     .x = feet.x,
                     .z = feet.z,
                     .home_x = feet.x,
                     .home_z = feet.z,
                     .facing = facing,
                     .facing_target = facing});

  EcsEntity av = ecs_entity_create(w);
  ecs_component_set(w, av, EcsParent, {.parent = e});
  ecs_component_set(w, av, LocalTransform, {.position = V3_ZERO, .rotation = quat_identity(), .scale = (v3){scale, scale, scale}});
  HzHandleT(ModelBlobAsset) model_h = asset_load(ModelBlobAsset, assets, .path = model);
  HzHandleT(AnimationBlobAsset) idle_h = asset_load(AnimationBlobAsset, assets, .path = idle_clip);
  ecs_component_set(w, av, EcsModelRef, {.model = blob_asset_ref_from_handle(ModelBlobAsset, model_h)});
  // own the animation layer directly: EcsAnimationRef would auto-play WITHOUT a joint remap,
  // which misaligns clip joints against the model palette; arena_anim_system is the only driver
  const ArenaAnimRig *rig = ecs_resource_get(w, ArenaAnimRig);
  ecs_component_set(w, av, EcsAnimationLayer, {.layer = animation_layer_create(rig->alloc)});
  // no real shadow casting: four skinned casters cost ~25 ms CPU/frame in the shadow pass (measured); a flat disc matches the three.js reference
  ecs_component_set(w, av, EcsVisibility, {.visible = true, .casts_shadow = false});

  // feet plant on the arena pad (flat plane, no raycasts) and the head tracks the action; joints are the Quaternius modular rig
  EcsIkFootPlant fp = {0};
  fp.legs.len = 2;
  fp.legs.items[0].hip_joint = fixedstr64_from_cstr("UpperLeg.L");
  fp.legs.items[0].ankle_joint = fixedstr64_from_cstr("Foot.L");
  fp.legs.items[1].hip_joint = fixedstr64_from_cstr("UpperLeg.R");
  fp.legs.items[1].ankle_joint = fixedstr64_from_cstr("Foot.R");
  fp.root_joint = fixedstr64_from_cstr("Hips");
  fp.plant = ik_foot_plant_defaults();
  fp.plant.foot_height = 0.0f; // filled from the bind pose once the model is ready
  fp.plant.heel_lift_ratio = 0.6f;      // lift the heel rather than drop the pelvis
  fp.plant.max_pelvis_drop = 0.05f;     // a standing character must not sink into a crouch
  fp.plant.pelvis_rebalance_weight = 0.0f;
  fp.soften = 0.35f; // blend toward the animated pose; plants still lock, small mismatches don't
  fp.pole_kind = (u32)IK_POLE_DIRECTION;
  fp.pole = (v3){0.0f, 0.0f, 1.0f}; // knees forward in the hip's frame
  ecs_ik_foot_plant_add_plane(w, av, &fp, 0.0f);

  EcsIkGaze gz = {0};
  gz.joint = fixedstr64_from_cstr("Head");
  gz.forward_axis = (v3){0.0f, 0.0f, 1.0f}; // models face +Z
  gz.up_axis = (v3){0.0f, 1.0f, 0.0f};
  gz.limit.kind = IK_LIMIT_CONE;
  gz.limit.swing_max = 0.85f;
  gz.limit.softness = 0.35f;
  gz.weight = 1.0f;
  gz.max_angle = 0.55f;
  gz.interpolation_time = 0.30f;
  gz.move_threshold = 0.08f;
  gz.primary_axis = (v3){0.0f, 1.0f, 0.0f};
  ecs_component_set(w, av, EcsIkGaze, gz);

  EcsEntity disc = ecs_entity_create(w);
  ecs_component_set(w, disc, EcsParent, {.parent = e});
  // soft radial-gradient contact shadow (flat cylinder read as a sticker at close range)
  ecs_component_set(w, disc, LocalTransform,
                    {.position = {0.0f, 0.03f, 0.0f},
                     .rotation = quat_axis_angle((v3){1.0f, 0.0f, 0.0f}, -(f32)M_PI * 0.5f),
                     .scale = (v3){1.24f, 1.24f, 1.0f}});
  ecs_component_set(w, disc, EcsModelRef, {.model = blob_asset_ref_from_handle(ModelBlobAsset, asset_load(ModelBlobAsset, assets, .path = "engine/primitives/plane/plane.hza"))});
  ecs_component_set(w, disc, EcsMaterial, {.material = blob_asset_ref_from_handle(MaterialBlobAsset, asset_load(MaterialBlobAsset, assets, .path = "arena/blob_soft_mat.hzt"))});
  ecs_component_set(w, disc, EcsVisibility, {.visible = true, .casts_shadow = false});

  ecs_component_set(w, e, ArenaAvatarRef, {.avatar = av, .idle = idle_h, .model = model_h, .playing_id = -1, .one_shot = -1});
  return e;
}

// resource: the entity the camera rig follows (the arena center)
typedef struct PlayerRef {
  EcsEntity player;
} PlayerRef;
ECS_COMPONENT_TYPEDEF(PlayerRef);

// the scene authors the camera rig without a target: it orbits the arena focus once it exists
ecs_system(camera_target_system, EcsInOut(CameraFollow), EcsResIn(ArenaFocusRef)) {
  const ArenaFocusRef *ref = ecs_sys_get_resource(ArenaFocusRef);
  for (i32 i = 0; i < it->count; i++) {
    if (ecs_sys_get_component(CameraFollow, i)->target != ref->focus)
      ecs_sys_get_component_mut(CameraFollow, i)->target = ref->focus;
  }
}

// ---- ARENA SIM: serial port of games/pejuang-nafkah/src/arena/sim.ts (three.js) ----
// constants mirror the ARENA table in sim.ts; the step is one entity-set-wide serial pass

#define ARENA_RADIUS 4.4f
#define ARENA_PLAYER_MASS 1.05f
#define ARENA_BODY_RADIUS 0.34f
#define ARENA_CONTACT_RADIUS 0.62f // playerRadius 0.28 + bodyRadius 0.34
#define ARENA_MOVE_SPEED 3.1f
#define ARENA_WALK_CLIP_SPEED 1.35f // m/s Walk_Loop was authored at; playback rate = speed / this
#define ARENA_JOG_CLIP_SPEED 3.1f   // m/s Jog_Fwd_Loop was authored at
#define ARENA_TURN_RATE 7.0f        // rad/s the body turns toward facing_target
#define ARENA_FRICTION 6.2f
#define ARENA_PUSH_REACH 1.5f
#define ARENA_PUSH_COOLDOWN 0.45f
#define ARENA_PUSH_CHARGE_TIME 0.7f
#define ARENA_HARD_PUSH_THRESHOLD 0.72f
#define ARENA_PUSH_IMPULSE 5.4f
#define ARENA_HARD_PUSH_IMPULSE 11.5f
#define ARENA_PUSH_STAGGER 0.42f
#define ARENA_HARD_PUSH_STAGGER 1.0f
#define ARENA_PUSH_FALL 1.05f
#define ARENA_PUSH_LUNGE 0.16f
#define ARENA_HARD_PUSH_LUNGE 0.24f
#define ARENA_ANGER_PER_PUSH 0.35f
#define ARENA_ANGER_PER_CHARGE 0.9f
#define ARENA_REVENGE_DELAY 0.35f
#define ARENA_FILMER_PREPARE 0.9f
#define ARENA_FILMER_RECORD 1.8f
#define ARENA_FILMER_COOLDOWN 0.7f
#define ARENA_AGGRESSIVE_SPEED 1.45f
#define ARENA_AGGRESSIVE_RANGE 2.05f
#define ARENA_WINDUP 0.9f
#define ARENA_WINDOW 0.3f
#define ARENA_QUICK_WINDUP 0.55f
#define ARENA_QUICK_WINDOW 0.18f
#define ARENA_ATTACK_COOLDOWN 2.2f
#define ARENA_SHOVE_IMPULSE 9.5f
#define ARENA_QUICK_SHOVE_IMPULSE 8.5f
#define ARENA_SHOVE_STAGGER 0.9f
#define ARENA_SHOVE_FALL 0.95f
#define ARENA_QUICK_SHOVE_FALL 0.8f
#define ARENA_RETREAT_SPEED 0.35f
#define ARENA_RESET_PLAYER_X 0.0f
#define ARENA_RESET_PLAYER_Z 3.0f

enum {
  ARENA_ROLE_PLAYER = 0,
  ARENA_ROLE_AGGRESSIVE = 1,
  ARENA_ROLE_PASSIVE = 2,
  ARENA_ROLE_FILMER = 3,
};
enum { ARENA_BRACE_NONE = 0, ARENA_BRACE_PERFECT, ARENA_BRACE_EARLY, ARENA_BRACE_LATE, ARENA_BRACE_INTERRUPT, ARENA_BRACE_MISS };
enum { ARENA_INCOMING_NONE = 0, ARENA_INCOMING_SHOVE, ARENA_INCOMING_REVENGE };
enum { ARENA_FILMER_IDLE = 0, ARENA_FILMER_PREPARING, ARENA_FILMER_RECORDING, ARENA_FILMER_COOLING };

// shared step state, written only by arena_step_system (single lane)
typedef struct ArenaGameState {
  f32 time;
  b32 has_incoming;
  i32 attacker_role;
  i32 incoming_kind;
  f32 started_at, impact_at, window_start;
  b32 held;
  b32 has_pressed_at;
  f32 pressed_at;
  i32 brace_result;
  f32 result_at;
  i32 perfects;
  b32 prev_push, prev_hold;
  i32 push_target_role;
  i32 last_push_hit_role;
  b32 last_push_hard;
  i32 filmer_mode;
  f32 filmer_timer;
  b32 game_over;
  i32 viral_target_role;
  f32 viral_at;
  b32 viral_hard;
  i32 pushes, shoves;
  i32 debug_force;   // verification: --commands arena_force pins every clip to this AANIM_*, -1 = follow sim
  b32 debug_cam;     // verification: follow-cam on the player for close-up captures (dist/yaw below)
  f32 debug_cam_dist;
  f32 debug_cam_yaw;
} ArenaGameState;
ECS_COMPONENT_TYPEDEF(ArenaGameState);

// picks each avatar's clip from the sim state and crossfades it in (one lane: writes other entities' layers)
ecs_system(arena_anim_system, EcsIn(ArenaChar), EcsInOut(ArenaAvatarRef), EcsExternInOut(EcsAnimationLayer),
           EcsResIn(AssetSystem), EcsResIn(ArenaClips), EcsResIn(ArenaAnimRig), EcsResIn(ArenaGameState),
           EcsResIn(PlayerControls)) {
  const AssetSystem *assets = ecs_sys_get_resource(AssetSystem);
  const ArenaClips *clips = ecs_sys_get_resource(ArenaClips);
  const ArenaAnimRig *rig = ecs_sys_get_resource(ArenaAnimRig);
  const ArenaGameState *g = ecs_sys_get_resource(ArenaGameState);
  const PlayerControls *ctl = ecs_sys_get_resource(PlayerControls);
  f32 step = it->delta_time;

  // gaze anchors: NPCs watch the player, the player watches the aggressor when standing
  f32 px = 0.0f, pz = 0.0f, fx = 0.0f, fz = 0.0f;
  b32 have_p = false, have_f = false;
  for (i32 i = 0; i < it->count; i++) {
    const ArenaChar *cc = ecs_sys_get_component(ArenaChar, i);
    if (cc->role == ARENA_ROLE_PLAYER) {
      px = cc->x;
      pz = cc->z;
      have_p = true;
    } else if (cc->role == ARENA_ROLE_AGGRESSIVE) {
      fx = cc->x;
      fz = cc->z;
      have_f = true;
    }
  }

  for (i32 i = 0; i < it->count; i++) {
    const ArenaChar *c = ecs_sys_get_component(ArenaChar, i);
    ArenaAvatarRef *ref = ecs_sys_get_component_mut(ArenaAvatarRef, i);
    EcsAnimationLayer *al = ecs_component_get_mut(it->world, ref->avatar, EcsAnimationLayer);
    if (!al)
      continue;

    // edges: knocked down, the moment it ends, a landed push (an R reset rewinds time — no edges that frame)
    b32 force = false;
    b32 reset = g->time < ref->prev_time;
    ref->prev_time = g->time;
    if (reset)
      ecs_ik_reset(it->world, ref->avatar); // a rewind teleports: stale foot speed breaks every plant
    if (!reset && ref->prev_fallen > 0.0f && c->fallen <= 0.0f) {
      ref->one_shot = AANIM_GETUP;
      ref->one_shot_t = 0.9f;
    }
    ref->prev_fallen = c->fallen;
    if (!reset && c->role == 0 && g->pushes > ref->prev_pushes) {
      ref->one_shot = AANIM_PUNCH;
      ref->one_shot_t = 0.45f;
      force = true;
    }
    ref->prev_pushes = g->pushes;
    if (ref->one_shot_t > 0.0f)
      ref->one_shot_t -= step;
    else
      ref->one_shot = -1;

    // priority: down > getting up > staggered > punch > brace/charge > filming > windup > moving
    i32 want = AANIM_IDLE;
    b32 want_loop = true;
    f32 want_speed = 1.0f;
    f32 want_start = 0.0f;
    if (c->fallen > 0.0f) {
      want = AANIM_FALL;
      want_loop = false;
    } else if (ref->one_shot == AANIM_GETUP) {
      want = AANIM_GETUP;
      want_loop = false;
      want_speed = -1.0f;
      want_start = 999.0f; // replaced with the clip's length below
    } else if (c->stagger > 0.0f) {
      want = AANIM_HIT;
      want_loop = false;
    } else if (ref->one_shot == AANIM_PUNCH) {
      want = AANIM_PUNCH;
      want_loop = false;
    } else if (c->role == 0 && (g->held || c->push_held)) {
      want = AANIM_PUSH;
    } else if (c->role == 3 && (g->filmer_mode == ARENA_FILMER_PREPARING || g->filmer_mode == ARENA_FILMER_RECORDING)) {
      want = AANIM_AIM;
    } else if (c->windup > 0.0f) {
      want = AANIM_PUSH;
    } else {
      f32 sp = arena_len(c->vx, c->vz);
      if (c->role == 0)
        sp = arena_len(ctl->move.x, ctl->move.y) * ARENA_MOVE_SPEED;
      if (sp > 0.3f) {
        // two-speed locomotion, rate-synced to the real speed so stride matches travel
        if (sp > 2.0f) {
          want = AANIM_JOG;
          want_speed = m_minf(1.8f, m_maxf(0.55f, sp / ARENA_JOG_CLIP_SPEED));
        } else {
          want = AANIM_WALK;
          want_speed = m_minf(1.8f, m_maxf(0.55f, sp / ARENA_WALK_CLIP_SPEED));
        }
      }
    }

    if (g->game_over)
      want = AANIM_IDLE; // the sim froze; nobody jogs behind the game-over panel

    if (g->debug_force >= 0) { // verification: a scripted arena_force pins the pose over everything
      want = g->debug_force;
      want_loop = !(want == AANIM_FALL || want == AANIM_GETUP || want == AANIM_PUNCH || want == AANIM_HIT);
      want_speed = 1.0f;
      want_start = 0.0f;
      if (want == AANIM_GETUP) {
        want_speed = -1.0f;
        want_start = 999.0f;
      }
      force = ref->playing_id != want;
    }

    // male rig vs female rig clip sets (player + filmer are female, worker + student male)
    const ArenaClipSet *set = (c->role == ARENA_ROLE_PLAYER || c->role == ARENA_ROLE_FILMER) ? &clips->female
                                                                                              : &clips->male;
    HzHandleT(AnimationBlobAsset) want_h = ref->idle;
    switch (want) {
    case AANIM_WALK: want_h = set->walk; break;
    case AANIM_JOG: want_h = set->jog; break;
    case AANIM_PUSH: want_h = set->push; break;
    case AANIM_PUNCH: want_h = set->punch; break;
    case AANIM_HIT: want_h = set->hit; break;
    case AANIM_FALL:
    case AANIM_GETUP: want_h = set->death; break;
    case AANIM_AIM: want_h = set->aim; break;
    default: break;
    }
    if (!asset_is_ready(assets, want_h) || !asset_is_ready(assets, ref->model)) {
      log_info("anim skip: role=% want=% clip_ready=% model_ready=%", fmt_i32(c->role), fmt_i32(want),
               fmt_i32(asset_is_ready(assets, want_h)), fmt_i32(asset_is_ready(assets, ref->model)));
      continue;
    }
    AnimationBlobAsset *want_blob = asset_get(assets, want_h, AnimationBlobAsset);
    ModelBlobAsset *model_blob = asset_get(assets, ref->model, ModelBlobAsset);
    if (!want_blob || !model_blob)
      continue;
    if (want == AANIM_GETUP)
      want_start = want_blob->length; // count down from the clip's end

    if (!ref->ik_tuned) {
      // foot_height comes from the rig's bind pose so planted feet sit ON the pad, not above it
      u32 jc = blob_array_len(&model_blob->joints);
      TempAllocator temp = tctx_temp_allocator_begin(NULL);
      JointPose *bind = ALLOC_ARRAY(&temp.allocator, JointPose, jc);
      animation_fill_bind_local_pose(model_blob, bind, jc);
      i32 ankle = ik_joint_find(model_blob, "Foot.L");
      if (ankle >= 0) {
        EcsIkFootPlant *fpc = ecs_component_get_mut(it->world, ref->avatar, EcsIkFootPlant);
        if (fpc) {
          fpc->plant.foot_height = ik_joint_global_pose(bind, model_blob, (u32)ankle).translation.y;
          ref->ik_tuned = true;
        }
      }
      animation_layer_ensure_buffers(&al->layer, jc); // inertialize history
      tctx_temp_allocator_end(temp);
    }

    // gaze + breathing: the cheap aliveness layer on top of the clips
    EcsIkGazeTarget *gaze = ecs_component_get_mut(it->world, ref->avatar, EcsIkGazeTarget);
    if (gaze) {
      b32 moving = want == AANIM_WALK || want == AANIM_JOG;
      if (c->fallen > 0.0f || (c->role == 0 && moving)) {
        gaze->active = false;
      } else if (c->role == 0 && have_f) {
        gaze->target = (v3){fx, 1.5f, fz};
        gaze->active = true;
      } else if (c->role != 0 && have_p) {
        gaze->target = (v3){px, 1.5f, pz};
        gaze->active = true;
      } else {
        gaze->active = false;
      }
    }
    LocalTransform *av_lt = ecs_component_get_mut(it->world, ref->avatar, LocalTransform);
    if (av_lt && want == AANIM_IDLE && c->fallen <= 0.0f)
      av_lt->position.y = 0.006f * m_sinf(g->time * 1.9f + c->role * 1.7f);

    if (ref->playing_id == want && !force) {
      // still moving: keep the settled clip's rate locked to the live speed
      if (want == AANIM_WALK || want == AANIM_JOG) {
        u32 cur = al->layer.current_index;
        if (cur < animation_layer_state_count(&al->layer)) {
          AnimationState *st = animation_layer_state(&al->layer, cur);
          if (st && st->animation == want_blob)
            st->speed = want_speed;
        }
      }
      continue;
    }

    b32 one_shot_clip = (want == AANIM_FALL || want == AANIM_GETUP || want == AANIM_PUNCH || want == AANIM_HIT);
    AnimTransitionMode tmode = one_shot_clip ? ANIM_TRANSITION_CROSSFADE : ANIM_TRANSITION_INERTIALIZE;
    f32 fade = (want == AANIM_FALL) ? 0.10f : (want == AANIM_GETUP ? 0.30f : (one_shot_clip ? 0.18f : 0.22f));
    animation_layer_play_ex(&al->layer, want_blob, tmode, fade, want_speed, want_loop, want_start);
    AnimationState *st = animation_layer_state(&al->layer, animation_layer_state_count(&al->layer) - 1);
    // ALWAYS build: NULL remap = clip drives model joints 1:1 by INDEX, which only holds for
    // clips cooked in model joint order — Quaternius embedded clips key channels in animator
    // order and skin the mesh garbage without the name remap (build returns NULL when truly 1:1)
    if (st)
      st->remap = animation_build_joint_remap(rig->alloc, want_blob, model_blob);
    ref->playing_id = want;
  }
}


hz_internal f32 arena_len(f32 x, f32 z) { return m_sqrtf(x * x + z * z); }

hz_internal void arena_state_fresh(ArenaGameState *g) {
  *g = (ArenaGameState){.result_at = -10.0f, .push_target_role = -1, .last_push_hit_role = -1, .viral_target_role = -1, .debug_force = -1};
}

// mass-weighted circle push-out; mirrors separation() in sim.ts
hz_internal b32 arena_separation(f32 *ax, f32 *az, f32 a_mass, f32 *bx, f32 *bz, f32 b_mass, f32 radius) {
  f32 dx = *ax - *bx;
  f32 dz = *az - *bz;
  f32 distance = arena_len(dx, dz);
  if (distance >= radius)
    return false;
  f32 nx = distance > 0.0001f ? dx / distance : 1.0f;
  f32 nz = distance > 0.0001f ? dz / distance : 0.0f;
  f32 overlap = radius - distance;
  f32 total = a_mass + b_mass;
  *ax += nx * overlap * (b_mass / total);
  *az += nz * overlap * (b_mass / total);
  *bx -= nx * overlap * (a_mass / total);
  *bz -= nz * overlap * (a_mass / total);
  return true;
}

hz_internal void arena_clamp_one(f32 *x, f32 *z) {
  f32 d = arena_len(*x, *z);
  f32 max = ARENA_RADIUS - ARENA_BODY_RADIUS;
  if (d > max && d > 0.0001f) {
    *x = (*x / d) * max;
    *z = (*z / d) * max;
  }
}

hz_internal void arena_calm(ArenaChar *q) {
  q->revenge = false;
  q->anger = 0.0f;
  q->revenge_delay = 0.0f;
}

hz_internal i32 arena_find_push_target(ArenaChar *player, ArenaChar **by_role) {
  f32 best = 1e30f;
  i32 found = -1;
  for (i32 role = ARENA_ROLE_AGGRESSIVE; role <= ARENA_ROLE_PASSIVE; role++) {
    ArenaChar *q = by_role[role];
    f32 d = arena_len(q->x - player->x, q->z - player->z);
    if (d > ARENA_PUSH_REACH)
      continue;
    if (d < best) {
      best = d;
      found = role;
    }
  }
  return found;
}

// DORONG resolved: impulse on the nearest non-filmer in reach, anger/revenge, the filmer's viral check
hz_internal void arena_perform_push(ArenaGameState *g, ArenaChar *player, ArenaChar **by_role, f32 charge) {
  b32 hard = charge >= ARENA_HARD_PUSH_THRESHOLD;
  player->push_cooldown = ARENA_PUSH_COOLDOWN;
  player->push_flash = hard ? 0.3f : 0.2f;
  g->last_push_hard = false;
  i32 target_role = arena_find_push_target(player, by_role);
  g->last_push_hit_role = target_role;
  if (target_role < 0)
    return;
  ArenaChar *target = by_role[target_role];

  f32 dx = target->x - player->x;
  f32 dz = target->z - player->z;
  f32 distance = arena_len(dx, dz);
  f32 nx = distance > 0.0001f ? dx / distance : 0.0f;
  f32 nz = distance > 0.0001f ? dz / distance : 1.0f;
  f32 impulse = (hard ? ARENA_HARD_PUSH_IMPULSE : ARENA_PUSH_IMPULSE) / target->mass;
  target->vx += nx * impulse;
  target->vz += nz * impulse;
  target->stagger = hard ? ARENA_HARD_PUSH_STAGGER : ARENA_PUSH_STAGGER;
  target->hit_flash = hard ? 0.4f : 0.22f;
  target->windup = 0.0f;
  target->attack_cooldown = m_maxf(target->attack_cooldown, 0.45f);
  if (hard)
    target->fallen = m_maxf(target->fallen, ARENA_PUSH_FALL);

  target->anger = m_minf(1.0f, target->anger + ARENA_ANGER_PER_PUSH + charge * ARENA_ANGER_PER_CHARGE);
  if (target->anger >= 1.0f && !target->revenge) {
    target->revenge = true;
    target->revenge_delay = ARENA_REVENGE_DELAY;
    target->attack_cooldown = m_minf(target->attack_cooldown, 0.25f);
  }

  if (g->filmer_mode == ARENA_FILMER_RECORDING) {
    g->game_over = true;
    g->viral_target_role = target_role;
    g->viral_at = g->time;
    g->viral_hard = hard;
  } else if (g->filmer_mode == ARENA_FILMER_IDLE) {
    g->filmer_mode = ARENA_FILMER_PREPARING;
    g->filmer_timer = ARENA_FILMER_PREPARE;
  }

  f32 lunge = hard ? ARENA_HARD_PUSH_LUNGE : ARENA_PUSH_LUNGE;
  player->x += nx * lunge;
  player->z += nz * lunge;
  player->facing = player->facing_target = m_atan2f(nx, nz); // impact snaps the facing
  g->pushes += 1;
  g->last_push_hard = hard;

  if (g->has_incoming && g->attacker_role == target_role) {
    g->has_incoming = false;
    g->brace_result = ARENA_BRACE_INTERRUPT;
    g->result_at = g->time;
    target->stagger = m_maxf(target->stagger, hard ? 1.0f : 0.72f);
    target->vx -= nx * (hard ? 0.8f : 0.4f);
    target->vz -= nz * (hard ? 0.8f : 0.4f);
    if (hard)
      target->fallen = m_maxf(target->fallen, ARENA_PUSH_FALL);
  }
}

hz_internal void arena_start_incoming(ArenaGameState *g, i32 attacker_role, ArenaChar *attacker, i32 kind) {
  f32 lead = kind == ARENA_INCOMING_REVENGE ? ARENA_QUICK_WINDUP : ARENA_WINDUP;
  f32 window = kind == ARENA_INCOMING_REVENGE ? ARENA_QUICK_WINDOW : ARENA_WINDOW;
  g->has_incoming = true;
  g->attacker_role = attacker_role;
  g->incoming_kind = kind;
  g->started_at = g->time;
  g->impact_at = g->time + lead;
  g->window_start = g->time + lead - window;
  attacker->windup = lead;
  if (g->brace_result != ARENA_BRACE_NONE && g->time - g->result_at > 0.9f)
    g->brace_result = ARENA_BRACE_NONE;
}

// TAHAN resolved at impact time: perfect parry inside the window, else the player eats the shove
hz_internal void arena_resolve_incoming(ArenaGameState *g, ArenaChar *player, ArenaChar **by_role, b32 holding) {
  if (!g->has_incoming)
    return;
  ArenaChar *attacker = by_role[g->attacker_role];

  f32 dx = player->x - attacker->x;
  f32 dz = player->z - attacker->z;
  f32 distance = arena_len(dx, dz);
  f32 nx = distance > 0.0001f ? dx / distance : 0.0f;
  f32 nz = distance > 0.0001f ? dz / distance : 1.0f;
  b32 has_press = g->has_pressed_at;
  f32 pressed_at = g->pressed_at;
  b32 is_revenge = g->incoming_kind == ARENA_INCOMING_REVENGE;

  if (distance > 2.45f) {
    g->brace_result = ARENA_BRACE_MISS;
    g->result_at = g->time;
    g->has_pressed_at = false;
    attacker->stagger = m_maxf(attacker->stagger, 0.5f);
    attacker->attack_cooldown = ARENA_ATTACK_COOLDOWN;
    attacker->windup = 0.0f;
    if (is_revenge)
      arena_calm(attacker);
    g->has_incoming = false;
    return;
  }

  b32 in_window = has_press && pressed_at >= g->window_start && pressed_at <= g->impact_at;
  b32 perfect = in_window && holding;

  if (perfect) {
    g->brace_result = ARENA_BRACE_PERFECT;
    g->perfects += 1;
    player->brace_flash = 0.35f;
    player->vx -= nx * 0.4f;
    player->vz -= nz * 0.4f;
    attacker->vx += nx * (is_revenge ? 2.8f : 2.2f);
    attacker->vz += nz * (is_revenge ? 2.8f : 2.2f);
    attacker->stagger = is_revenge ? 0.9f : 0.8f;
    attacker->attack_cooldown = ARENA_ATTACK_COOLDOWN;
    if (is_revenge)
      arena_calm(attacker);
  } else {
    g->brace_result = (holding && has_press && pressed_at < g->window_start) ? ARENA_BRACE_EARLY : ARENA_BRACE_LATE;
    g->shoves += 1;
    player->vx += nx * (is_revenge ? ARENA_QUICK_SHOVE_IMPULSE : ARENA_SHOVE_IMPULSE);
    player->vz += nz * (is_revenge ? ARENA_QUICK_SHOVE_IMPULSE : ARENA_SHOVE_IMPULSE);
    player->stagger = ARENA_SHOVE_STAGGER;
    player->fallen = m_maxf(player->fallen, is_revenge ? ARENA_QUICK_SHOVE_FALL : ARENA_SHOVE_FALL);
    player->push_held = false;
    player->push_charge = 0.0f;
    player->hit_flash = 0.42f;
    attacker->attack_cooldown = ARENA_ATTACK_COOLDOWN;
    if (is_revenge)
      arena_calm(attacker);
  }

  g->result_at = g->time;
  g->has_pressed_at = false;
  attacker->windup = 0.0f;
  g->has_incoming = false;
}

hz_internal void arena_step_filmer(ArenaGameState *g, f32 step) {
  if (g->filmer_mode == ARENA_FILMER_PREPARING) {
    g->filmer_timer -= step;
    if (g->filmer_timer <= 0.0f) {
      g->filmer_mode = ARENA_FILMER_RECORDING;
      g->filmer_timer = ARENA_FILMER_RECORD;
    }
  } else if (g->filmer_mode == ARENA_FILMER_RECORDING) {
    g->filmer_timer -= step;
    if (g->filmer_timer <= 0.0f) {
      g->filmer_mode = ARENA_FILMER_COOLING;
      g->filmer_timer = ARENA_FILMER_COOLDOWN;
    }
  } else if (g->filmer_mode == ARENA_FILMER_COOLING) {
    g->filmer_timer = m_maxf(0.0f, g->filmer_timer - step);
    if (g->filmer_timer <= 0.0f)
      g->filmer_mode = ARENA_FILMER_IDLE;
  }
}

hz_internal void arena_reset_bodies(ArenaChar **by_role) {
  ArenaChar *p = by_role[ARENA_ROLE_PLAYER];
  p->x = ARENA_RESET_PLAYER_X;
  p->z = ARENA_RESET_PLAYER_Z;
  p->vx = p->vz = 0.0f;
  p->facing = p->facing_target = M_PI;
  p->stagger = p->fallen = p->hit_flash = p->brace_flash = 0.0f;
  p->push_cooldown = p->push_flash = p->push_charge = 0.0f;
  p->push_held = false;
  for (i32 role = ARENA_ROLE_AGGRESSIVE; role <= ARENA_ROLE_FILMER; role++) {
    ArenaChar *q = by_role[role];
    q->x = q->home_x;
    q->z = q->home_z;
    q->vx = q->vz = 0.0f;
    q->stagger = q->fallen = q->hit_flash = q->windup = 0.0f;
    q->anger = 0.0f;
    q->revenge = false;
    q->revenge_delay = 0.0f;
    q->attack_cooldown = role == ARENA_ROLE_AGGRESSIVE ? 1.5f : 0.0f;
    q->facing = q->facing_target = arena_face_toward(q->x, q->z, p->x, p->z);
  }
}

// the whole stepArena(): one serial pass over all four bodies (cross-entity reads make it single-lane by nature)
ecs_system(arena_step_system, EcsInOut(ArenaChar), EcsResInOut(ArenaGameState), EcsResIn(PlayerControls)) {
  ArenaGameState *g = ecs_sys_get_resource(ArenaGameState);
  const PlayerControls *ctl = ecs_sys_get_resource(PlayerControls);
  f32 step = it->delta_time;

  ArenaChar *by_role[4] = {0};
  for (i32 i = 0; i < it->count; i++) {
    ArenaChar *c = ecs_sys_get_component_mut(ArenaChar, i);
    if (c->role >= 0 && c->role < 4)
      by_role[c->role] = c;
  }
  ArenaChar *p = by_role[ARENA_ROLE_PLAYER];
  if (!p)
    return;

  // R resets even from game over (the viral COBA LAGI), checked before the freeze
  if (ctl->respawn) {
    arena_reset_bodies(by_role);
    arena_state_fresh(g);
    return;
  }
  if (g->game_over)
    return;

  g->time += step;

  p->push_cooldown = m_maxf(0.0f, p->push_cooldown - step);
  p->push_flash = m_maxf(0.0f, p->push_flash - step);
  p->hit_flash = m_maxf(0.0f, p->hit_flash - step);
  p->brace_flash = m_maxf(0.0f, p->brace_flash - step);
  p->stagger = m_maxf(0.0f, p->stagger - step);
  p->fallen = m_maxf(0.0f, p->fallen - step);
  for (i32 role = ARENA_ROLE_AGGRESSIVE; role <= ARENA_ROLE_FILMER; role++) {
    ArenaChar *q = by_role[role];
    q->stagger = m_maxf(0.0f, q->stagger - step);
    q->fallen = m_maxf(0.0f, q->fallen - step);
    q->hit_flash = m_maxf(0.0f, q->hit_flash - step);
    q->attack_cooldown = m_maxf(0.0f, q->attack_cooldown - step);
    q->revenge_delay = m_maxf(0.0f, q->revenge_delay - step);
    q->windup = m_maxf(0.0f, q->windup - step);
  }

  arena_step_filmer(g, step);

  // brace / push edge detection (edge flags live in the shared state, like prevPush/prevHold)
  b32 push_pressed = ctl->push && !g->prev_push;
  b32 hold_pressed = ctl->hold && !g->prev_hold;
  if (hold_pressed && p->fallen <= 0.0f) {
    g->held = true;
    g->has_pressed_at = true;
    g->pressed_at = g->time;
  }
  if (!ctl->hold || p->fallen > 0.0f)
    g->held = false;

  f32 release_charge = -1.0f;
  if (p->fallen > 0.0f) {
    p->push_held = false;
    p->push_charge = 0.0f;
  } else {
    if (push_pressed) {
      p->push_held = true;
      p->push_charge = 0.0f;
    }
    if (p->push_held) {
      if (ctl->push) {
        p->push_charge = m_minf(1.0f, p->push_charge + step / ARENA_PUSH_CHARGE_TIME);
      } else {
        release_charge = p->push_charge;
        p->push_held = false;
        p->push_charge = 0.0f;
      }
    }
  }
  g->prev_push = ctl->push;
  g->prev_hold = ctl->hold;

  // player movement: camera-relative input becomes world axes, impulse velocity rides along
  f32 h = ctl->heading;
  f32 ch = m_cosf(h);
  f32 sh = m_sinf(h);
  f32 mx = p->fallen > 0.0f ? 0.0f : m_clampf(ctl->move.x, -1.0f, 1.0f);
  f32 mz = p->fallen > 0.0f ? 0.0f : m_clampf(ctl->move.y, -1.0f, 1.0f);
  f32 in_len = arena_len(mx, mz);
  if (in_len > 1.0f) {
    mx /= in_len;
    mz /= in_len;
  }
  f32 wx = mx * ch + mz * -sh;
  f32 wz = mx * -sh + mz * -ch;
  f32 speed = ARENA_MOVE_SPEED * (p->fallen > 0.0f ? 0.0f : (p->stagger > 0.0f ? 0.35f : 1.0f)) * (p->push_held ? 0.7f : 1.0f);
  if (p->fallen <= 0.0f && in_len > 0.05f)
    p->facing_target = m_atan2f(wx, wz);
  p->x += (wx * speed + p->vx) * step;
  p->z += (wz * speed + p->vz) * step;
  p->vx *= m_expf(-ARENA_FRICTION * step);
  p->vz *= m_expf(-ARENA_FRICTION * step);

  // passengers: filmer records, aggressive chases into windups, passive retreats home
  for (i32 role = ARENA_ROLE_AGGRESSIVE; role <= ARENA_ROLE_FILMER; role++) {
    ArenaChar *q = by_role[role];
    if (role == ARENA_ROLE_FILMER) {
      q->vx = 0.0f;
      q->vz = 0.0f;
      q->facing_target = m_atan2f(p->x - q->x, p->z - q->z);
      continue;
    }
    b32 hostile = role == ARENA_ROLE_AGGRESSIVE || q->revenge;
    b32 can_act = q->fallen <= 0.0f && q->stagger <= 0.0f && q->revenge_delay <= 0.0f;
    if (!can_act) {
      q->vx *= m_expf(-ARENA_FRICTION * step);
      q->vz *= m_expf(-ARENA_FRICTION * step);
      if (q->revenge) {
        f32 fdx = p->x - q->x;
        f32 fdz = p->z - q->z;
        if (arena_len(fdx, fdz) > 0.001f)
          q->facing_target = m_atan2f(fdx, fdz);
      }
    } else if (hostile) {
      if (g->has_incoming && g->attacker_role == role) {
        q->vx *= m_expf(-ARENA_FRICTION * step);
        q->vz *= m_expf(-ARENA_FRICTION * step);
      } else {
        f32 dx = p->x - q->x;
        f32 dz = p->z - q->z;
        f32 distance = arena_len(dx, dz);
        f32 nx = distance > 0.0001f ? dx / distance : 0.0f;
        f32 nz = distance > 0.0001f ? dz / distance : 1.0f;
        q->facing_target = m_atan2f(nx, nz);
        if (distance > ARENA_AGGRESSIVE_RANGE) {
          f32 k = m_minf(1.0f, step * 8.0f);
          q->vx += (nx * ARENA_AGGRESSIVE_SPEED - q->vx) * k;
          q->vz += (nz * ARENA_AGGRESSIVE_SPEED - q->vz) * k;
        } else {
          q->vx *= m_expf(-ARENA_FRICTION * step);
          q->vz *= m_expf(-ARENA_FRICTION * step);
          if (!g->has_incoming && q->attack_cooldown <= 0.0f && p->fallen <= 0.0f)
            arena_start_incoming(g, role, q, q->revenge ? ARENA_INCOMING_REVENGE : ARENA_INCOMING_SHOVE);
        }
      }
    } else {
      if (q->stagger > 0.0f) {
        q->vx *= m_expf(-ARENA_FRICTION * step);
        q->vz *= m_expf(-ARENA_FRICTION * step);
      } else {
        f32 dx = q->home_x - q->x;
        f32 dz = q->home_z - q->z;
        f32 distance = arena_len(dx, dz);
        if (distance > 0.25f) {
          q->vx += (dx / distance) * ARENA_RETREAT_SPEED * step * 3.0f;
          q->vz += (dz / distance) * ARENA_RETREAT_SPEED * step * 3.0f;
        } else {
          q->vx *= m_expf(-ARENA_FRICTION * step);
          q->vz *= m_expf(-ARENA_FRICTION * step);
        }
      }
      f32 fdx = p->x - q->x;
      f32 fdz = p->z - q->z;
      if (arena_len(fdx, fdz) > 0.001f)
        q->facing_target = m_atan2f(fdx, fdz);
    }

    q->x += q->vx * step;
    q->z += q->vz * step;
    q->vx *= m_expf(-ARENA_FRICTION * step);
    q->vz *= m_expf(-ARENA_FRICTION * step);
  }

  if (release_charge >= 0.0f && p->push_cooldown <= 0.0f && p->fallen <= 0.0f)
    arena_perform_push(g, p, by_role, release_charge);

  if (g->has_incoming && g->time >= g->impact_at)
    arena_resolve_incoming(g, p, by_role, ctl->hold);

  for (i32 role = ARENA_ROLE_AGGRESSIVE; role <= ARENA_ROLE_FILMER; role++)
    arena_separation(&p->x, &p->z, ARENA_PLAYER_MASS, &by_role[role]->x, &by_role[role]->z, by_role[role]->mass,
                     ARENA_CONTACT_RADIUS);
  arena_separation(&by_role[ARENA_ROLE_AGGRESSIVE]->x, &by_role[ARENA_ROLE_AGGRESSIVE]->z,
                   by_role[ARENA_ROLE_AGGRESSIVE]->mass, &by_role[ARENA_ROLE_PASSIVE]->x,
                   &by_role[ARENA_ROLE_PASSIVE]->z, by_role[ARENA_ROLE_PASSIVE]->mass, ARENA_BODY_RADIUS * 2.0f);

  for (i32 i = 0; i < it->count; i++) {
    ArenaChar *c = ecs_sys_get_component_mut(ArenaChar, i);
    arena_clamp_one(&c->x, &c->z);
    // turn toward the steering yaw at a human rate instead of snapping
    f32 turn = c->facing_target - c->facing;
    while (turn > M_PI)
      turn -= 2.0f * (f32)M_PI;
    while (turn < -(f32)M_PI)
      turn += 2.0f * (f32)M_PI;
    f32 max_turn = ARENA_TURN_RATE * step;
    c->facing += m_minf(max_turn, m_maxf(-max_turn, turn));
    ecs_component_set(it->world, it->entities[i], LocalTransform,
                      {.position = {c->x, 0.0f, c->z},
                       .rotation = quat_rotate_y(c->facing),
                       .scale = V3_ONE});
    ecs_component_set(it->world, it->entities[i], WorldTransform,
                      {.position = {c->x, 0.0f, c->z},
                       .rotation = quat_rotate_y(c->facing),
                       .scale = V3_ONE});
  }
  g->push_target_role = arena_find_push_target(p, by_role);
}


// colliders are code-built: every scene entity tagged SolidBox gets a static box the size of its scale
ecs_system(solid_box_system, EcsIn(SolidBox), EcsIn(WorldTransform), EcsNot(ColliderBody)) {
  for (i32 i = 0; i < it->count; i++) {
    const WorldTransform *wt = ecs_sys_get_component(WorldTransform, i);
    ecs_component_set(it->world, it->entities[i], ColliderBody,
                      {.collider = collider_box(V3_ZERO, v3_scale(wt->scale, 0.5f)),
                       .pos = wt->position,
                       .rot = wt->rotation,
                       .scale = 1.0f});
    ecs_component_add(it->world, it->entities[i], StaticBody);
  }
}

// ---- YOUR COMPONENTS AND SYSTEMS HERE: split into files when this gets long (#include "st_enemies.c" above app_init) ----

// ---- THE SIMULATION: all game state, shared by the app and headless runs (game_sim.h); no renderer, UI, audio or avatar ----

struct GameSim {
  EcsWorld *world;
  SceneSystem scene_sys;
  SceneHandle scene;
  EcsQuery *camera_query;
  EcsQuery *solid_query;
  FixedTimestep sim_clock;
  i32 steps; // this frame's fixed steps, written by the main lane before the sync
  EcsEntity player;
  ArenaAllocator *arena; // headless only: the simulation owns its world
  Allocator alloc;
};

// main lane, once: the simulation's engine modules, the level scene and the player
hz_internal void game_sim_init(GameSim *sim, EcsWorld *w, AssetSystem *assets, Allocator *alloc) {
  sim->world = w;
  // ---- engine modules: delete the ones your game does not use ----
  ecs_transform_init(w, NULL);
  PhysicsSettings physics = physics_settings_default(aabb_make((v3){-256, -64, -256}, (v3){512, 256, 512}), (iv3){4, 4, 4});
  physics.gravity = (v3){0, -GAME_GRAVITY, 0};
  ecs_rigidbody_init(w, &(EcsRigidBodyInitDesc){.settings = physics});
  ecs_physics_init(w, physics.collision_layer_settings);
  ecs_ik_init(w); // foot plant + gaze on the avatars; must precede the frame's ik schedules
  character_controller_init(w);
  camera_rig_init(w);
  sim->sim_clock = fixed_timestep_make(GAME_FIXED_HZ, GAME_MAX_SUBSTEPS);

  // ---- the level: the sun, the floor and the camera come from the scene file ----
  scene_system_create(&sim->scene_sys, w, assets, alloc);
  sim->scene = scene_load_file(&sim->scene_sys, GAME_SCENE_PATH);
  sim->camera_query = ecs_query_cached(w, EcsIn(Camera));
  sim->solid_query = ecs_query_cached(w, EcsIn(SolidBox), EcsIn(ColliderBody));

  // ---- the arena: camera focus at the ring's center, then the four characters ----
  EcsEntity focus = ecs_entity_create(w);
  ecs_component_set(w, focus, EntityName, {.name = fixedstr64_from_cstr("Focus")});
  ecs_component_set(w, focus, LocalTransform, {.position = V3_ZERO, .rotation = quat_identity(), .scale = V3_ONE});
  ecs_component_set(w, focus, WorldTransform, {.position = V3_ZERO, .rotation = quat_identity(), .scale = V3_ONE});
  ecs_resource_set(w, ArenaFocusRef, {.focus = focus});
  ecs_resource_set(w, PlayerControls, {0});
  ArenaGameState arena_gs;
  arena_state_fresh(&arena_gs);
  ecs_resource_set(w, ArenaGameState, arena_gs);
  ecs_resource_set(w, ArenaAnimRig, {.alloc = alloc});
  // retargeted action clips (scripts/retarget_clips.py male): UE-rig source baked onto the
  // Quaternius modular rig — all four commuter characters share that rig, so ONE clip set
  ecs_resource_set(w, ArenaClips,
                   {.female = {
                        .walk = asset_load(AnimationBlobAsset, assets, .path = "arena_retarget_male/actions/Walk_Loop.hza"),
                        .jog = asset_load(AnimationBlobAsset, assets, .path = "arena_retarget_male/actions/Jog_Fwd_Loop.hza"),
                        .push = asset_load(AnimationBlobAsset, assets, .path = "arena_retarget_male/actions/Push_Loop.hza"),
                        .punch = asset_load(AnimationBlobAsset, assets, .path = "arena_retarget_male/actions/Punch_Jab.hza"),
                        .hit = asset_load(AnimationBlobAsset, assets, .path = "arena_retarget_male/actions/Hit_Chest.hza"),
                        .death = asset_load(AnimationBlobAsset, assets, .path = "arena_retarget_male/actions/Death01.hza"),
                        .aim = asset_load(AnimationBlobAsset, assets, .path = "arena_retarget_male/actions/Pistol_Aim_Neutral.hza"),
                    },
                    .male = {
                        .walk = asset_load(AnimationBlobAsset, assets, .path = "arena_retarget_male/actions/Walk_Loop.hza"),
                        .jog = asset_load(AnimationBlobAsset, assets, .path = "arena_retarget_male/actions/Jog_Fwd_Loop.hza"),
                        .push = asset_load(AnimationBlobAsset, assets, .path = "arena_retarget_male/actions/Push_Loop.hza"),
                        .punch = asset_load(AnimationBlobAsset, assets, .path = "arena_retarget_male/actions/Punch_Jab.hza"),
                        .hit = asset_load(AnimationBlobAsset, assets, .path = "arena_retarget_male/actions/Hit_Chest.hza"),
                        .death = asset_load(AnimationBlobAsset, assets, .path = "arena_retarget_male/actions/Death01.hza"),
                        .aim = asset_load(AnimationBlobAsset, assets, .path = "arena_retarget_male/actions/Pistol_Aim_Neutral.hza"),
                    }});

  // spawns mirror createArenaState() in the three.js sim: player (0,3), worker (-2.3,-0.7), student (2.35,0.35), shopper (0,-2.85)
  // Quaternius Ultimate Modular packs (CC0, quaternius.com) imported + recolored to Indonesian
  // commuter skins by scripts/import_quaternius_pack.py; idle = retargeted clip (same rig)
  CString pack_idle = "arena_retarget_male/actions/Idle_Loop.hza";
  v3 player_at = {0.0f, 0.0f, 3.0f};
  sim->player = arena_spawn_char(w, assets, "Player", 0, player_at, 1.05f, 1.0f,
                                 arena_face_toward(player_at.x, player_at.z, 0.0f, 0.0f),
                                 "arena_commuter/female_commuter.glb", pack_idle);
  v3 worker_at = {-2.3f, 0.0f, -0.7f};
  arena_spawn_char(w, assets, "Worker", 1, worker_at, 1.32f, 1.10f,
                   arena_face_toward(worker_at.x, worker_at.z, player_at.x, player_at.z),
                   "arena_commuter/male_casual.glb", pack_idle);
  v3 student_at = {2.35f, 0.0f, 0.35f};
  arena_spawn_char(w, assets, "Student", 2, student_at, 0.88f, 0.92f,
                   arena_face_toward(student_at.x, student_at.z, player_at.x, player_at.z),
                   "arena_commuter/male_hoodie.glb", pack_idle);
  v3 shopper_at = {0.0f, 0.0f, -2.85f};
  arena_spawn_char(w, assets, "Shopper", 3, shopper_at, 1.0f, 1.0f,
                   arena_face_toward(shopper_at.x, shopper_at.z, player_at.x, player_at.z),
                   "arena_commuter/female_hijab.glb", pack_idle);
  (void)assets;
}

// main lane, before the scope: this frame's controls and fixed steps; a paused frame (the editor) runs none
hz_internal void game_sim_begin_frame(GameSim *sim, const PlayerControls *controls, f32 dt, b32 paused) {
  EcsWorld *w = sim->world;
  *ecs_resource_get_mut(w, PlayerControls) = *controls;
  sim->steps = paused ? 0 : fixed_timestep_begin(&sim->sim_clock, dt);
  ecs_resource_get_mut(w, CharacterFrame)->alpha = fixed_timestep_alpha(&sim->sim_clock);
}

// all lanes, inside the frame's scope: the caller adds its presentation schedules, then flushes
hz_internal void game_sim_schedule(GameSim *sim, f32 dt) {
  EcsWorld *w = sim->world;
  i32 steps = sim->steps; // every lane runs the same number of fixed steps, or the scope's syncs diverge
  ecs_assets_schedule(w);

  // ---- per-frame input: the controls resource is consumed inside the arena sim ----
  ecs_schedule(w, solid_box_system);
  ecs_schedule(w, camera_target_system);
  ecs_physics_schedule(w); // the static layer the character walks on and the camera boom queries
  ecs_flush(w, dt);

  // ---- FIXED STEP: physics-driven gameplay runs here, N times per frame at fixed_dt ----
  for (i32 k = 0; k < steps; k++) {
    ecs_schedule_single(w, arena_step_system); // serial three.js sim port: cross-entity reads, one lane
    character_schedule_fixed(w); // no Character entities remain; kept as the block's fixed-step contract
    // YOUR FIXED-STEP SYSTEMS HERE: anything that moves bodies or must be frame-rate independent
    ecs_flush_ex(w, &(EcsFlushDesc){.delta_time = sim->sim_clock.fixed_dt, .steps = 1});
    ecs_rigidbody_step(w, sim->sim_clock.fixed_dt); // all lanes, between flushes
  }

  // ---- PER FRAME, YOUR GAME GOES HERE: ecs_schedule(w, per_entity_system) / ecs_schedule_single(w, resource_writer) ----
  character_schedule_frame(w); // no Character entities remain; kept as the block's frame contract
  ecs_schedule_single(w, arena_anim_system); // clip machine: writes other entities' animation layers
  camera_rig_schedule(w);      // writes Camera from the followed entity
  ecs_transform_schedule(w);
  ecs_camera_schedule(w, &(EcsCameraScheduleDesc){.transform_sync_off = true}); // the rig writes Camera
}

// ---- headless API (game_sim.h) ----

GameSim *game_sim_create(void) {
  // the ECS world outside a scope is main-lane state
  assert(is_main_thread());
  ArenaAllocator *arena = arena_create(MB(64), MB(1));
  Allocator alloc = make_arena_allocator(arena);
  GameSim *sim = ALLOC(&alloc, GameSim);
  sim->arena = arena;
  sim->alloc = alloc;
  EcsWorld *w = ecs_world_create();
  // the camera reads the canvas for its aspect
  AppMemory *memory = ALLOC(&sim->alloc, AppMemory);
  *memory = (AppMemory){.canvas_width = 1280, .canvas_height = 720, .dpr = 1.0f};
  ecs_resource_set_ref(w, AppMemory, memory);
  ecs_assets_init(w, NULL); // the scene loads through it
  game_sim_init(sim, w, ecs_resource_get_mut(w, AssetSystem), &sim->alloc);
  return sim;
}

void game_sim_destroy(GameSim *sim) {
  // the ECS world outside a scope is main-lane state
  assert(is_main_thread());
  scene_system_destroy(&sim->scene_sys);
  AssetSystem *assets = ecs_resource_get_mut(sim->world, AssetSystem);
  ecs_world_destroy(sim->world);
  asset_system_destroy(assets);
  arena_destroy(sim->arena);
}

b32 game_sim_ready(GameSim *sim) {
  return ecs_query_entity_count(sim->solid_query) > 0 && ecs_query_get_singleton_entity(sim->camera_query) != ECS_ENTITY_INVALID;
}

void game_sim_frame(GameSim *sim, const PlayerControls *controls, f32 dt) {
  if (is_main_thread())
    game_sim_begin_frame(sim, controls, dt, false);
  lane_sync(); // publishes the main-lane writes above to every lane
  ecs_scope(sim->world) {
    game_sim_schedule(sim, dt);
    ecs_flush(sim->world, dt);
  }
}

v3 game_sim_player_position(GameSim *sim) {
  const WorldTransform *wt = ecs_component_get(sim->world, sim->player, WorldTransform);
  return wt ? wt->position : V3_ZERO;
}

// ---- THE APP: input, presentation (sky, avatar, HUD, editor) and the frame order around the simulation ----

typedef struct AppState {
  Allocator allocator;
  GameSim sim;
  UISystem *ui;
  TouchControls touch;
  b32 touch_jump_held;
  b32 editor_open;
  b32 look_locked;
  i32 crowd_wanted;  // arena_crowd stress ring: target count
  i32 crowd_spawned; // streamed in a few per frame (the spawn queue cannot absorb 150 at once)
#if GAME_DEV_TOOLS
  EcsEditorDefault editor;
#endif
} AppState;

// "arena_force:push | punch | hit | fall | getup | aim | walk | jog | idle | off"
hz_internal void arena_cmd_force(const HzCommandCtx *ctx, void *user) {
  AppState *s = user;
  static const char *names[] = {"idle", "walk", "jog", "push", "punch", "hit", "fall", "getup", "aim"};
  i32 id = -1;
  for (i32 k = 0; k < 9; k++) {
    if (cstr_equal(ctx->args, names[k])) {
      id = k;
      break;
    }
  }
  if (id < 0 && !cstr_equal(ctx->args, "off")) {
    hz_command_fail(ctx, "unknown state (idle|walk|jog|push|punch|hit|fall|getup|aim|off)");
    return;
  }
  ecs_resource_get_mut(s->sim.world, ArenaGameState)->debug_force = id;
  hz_command_set_summary(ctx, id < 0 ? "arena: follow sim" : names[id]);
}

// "arena_cam:<dist>[:yaw_deg]" — camera tracks the player at chest height (empty arg = clear override)
hz_internal void arena_cmd_cam(const HzCommandCtx *ctx, void *user) {
  AppState *s = user;
  RendererState *r = ecs_resource_get_mut(s->sim.world, RendererState);
  if (ctx->args[0] == 0) {
    ecs_resource_get_mut(s->sim.world, ArenaGameState)->debug_cam = false;
    renderer_debug_camera_clear(r);
    hz_command_set_summary(ctx, "camera override cleared");
    return;
  }
  f32 dist = 2.6f, yaw = 0.0f;
  cstr_to_f32(ctx->args, &dist);
  char *sep = ctx->args;
  while (*sep && *sep != ':') sep++;
  if (*sep == ':') cstr_to_f32(sep + 1, &yaw);
  ArenaGameState *g = ecs_resource_get_mut(s->sim.world, ArenaGameState);
  g->debug_cam = true;
  g->debug_cam_dist = dist;
  g->debug_cam_yaw = yaw;
  hz_command_set_summary(ctx, "follow close-up camera on");
}

// "arena_crowd:<n>" — n extra walk-in-place commuters in a ring (50-char skin/draw stress test).
// Engine-driven EcsAnimationRef: the retargeted clips cover the palette 1:1 so no remap is needed,
// and no IK/faces budget is spent on background bodies (the real game's crowd policy).
// Spawns stream in a few per frame: one flush cannot absorb 150 deferred entity spawns.
hz_internal void arena_spawn_crowd_one(EcsWorld *w, AssetSystem *assets, i32 i) {
  static const char *models[] = {"arena_commuter/female_commuter.glb", "arena_commuter/male_casual.glb",
                                 "arena_commuter/male_hoodie.glb", "arena_commuter/female_hijab.glb"};
  HzHandleT(AnimationBlobAsset) walk = asset_load(AnimationBlobAsset, assets, .path = "arena_retarget_male/actions/Walk_Loop.hza");
  f32 ang = (f32)i * 2.399963f; // golden angle: no clumping
  f32 rad = 6.5f + (f32)(i % 7) * 0.45f;
  v3 at = {m_sinf(ang) * rad, 0.0f, m_cosf(ang) * rad};
  quat yaw = quat_axis_angle(V3_UP, ang + (f32)M_PI * 0.5f);
  EcsEntity e = ecs_entity_create(w);
  ecs_component_set(w, e, LocalTransform, {.position = at, .rotation = yaw, .scale = V3_ONE});
  ecs_component_set(w, e, WorldTransform, {.position = at, .rotation = yaw, .scale = V3_ONE});
  EcsEntity av = ecs_entity_create(w);
  ecs_component_set(w, av, EcsParent, {.parent = e});
  ecs_component_set(w, av, LocalTransform, {.position = V3_ZERO, .rotation = quat_identity(), .scale = V3_ONE});
  ecs_component_set(w, av, EcsModelRef,
                    {.model = blob_asset_ref_from_handle(ModelBlobAsset, asset_load(ModelBlobAsset, assets, .path = models[i % 4]))});
  ecs_component_set(w, av, EcsAnimationRef, {.animation = blob_asset_ref_from_handle(AnimationBlobAsset, walk)});
  ecs_component_set(w, av, EcsVisibility, {.visible = true, .casts_shadow = false});
  EcsEntity disc = ecs_entity_create(w);
  ecs_component_set(w, disc, EcsParent, {.parent = e});
  ecs_component_set(w, disc, LocalTransform,
                    {.position = {0.0f, 0.03f, 0.0f},
                     .rotation = quat_axis_angle((v3){1.0f, 0.0f, 0.0f}, -(f32)M_PI * 0.5f),
                     .scale = (v3){1.24f, 1.24f, 1.0f}});
  ecs_component_set(w, disc, EcsModelRef,
                    {.model = blob_asset_ref_from_handle(ModelBlobAsset, asset_load(ModelBlobAsset, assets, .path = "engine/primitives/plane/plane.hza"))});
  ecs_component_set(w, disc, EcsMaterial,
                    {.material = blob_asset_ref_from_handle(MaterialBlobAsset, asset_load(MaterialBlobAsset, assets, .path = "arena/blob_soft_mat.hzt"))});
  ecs_component_set(w, disc, EcsVisibility, {.visible = true, .casts_shadow = false});
}

hz_internal void arena_cmd_crowd(const HzCommandCtx *ctx, void *user) {
  AppState *s = user;
  i32 n = 0;
  if (!cstr_to_i32(ctx->args, &n) || n < 0 || n > 200) {
    hz_command_fail(ctx, "usage: arena_crowd:<n 0..200>");
    return;
  }
  s->crowd_wanted = n;
  s->crowd_spawned = 0;
  hz_command_set_summary(ctx, "crowd ring spawning");
}

HZ_APP_API void app_init(AppMemory *memory) {
  // app_init runs on every lane; world setup is main-lane work
  if (!is_main_thread())
    return;
  AppState *s = memory->state;
  s->allocator = make_arena_allocator(arena_create(MB(16), MB(1)));

  EcsWorld *w = ecs_world_create();
  ecs_resource_set_ref(w, AppMemory, memory);

  // ---- engine modules the app adds to the simulation's: delete the ones your game does not use ----
  ecs_input_init(w);
  ecs_assets_init(w, NULL);
  ecs_renderer_init(w, &(RendererInitDesc){.shadows_enabled = true,
                                           .bloom_enabled = true,
                                           // 62 joints per commuter: the 1024 default caps the scene at ~16 skinned bodies
                                           .max_bones = 4096,
                                           .max_skinned_model_instances = 160});
  // the hardware's quality level: without one every feature keeps its highest default
  RendererHardware hw = renderer_hardware(ecs_resource_get(w, RendererState));
  renderer_set_quality(ecs_resource_get_mut(w, RendererState), renderer_quality_for_hardware(&hw));
  // the whole frame at min(dpr, 1.25): a phone's 3x density costs pixels the eye does not resolve
  hz_set_max_dpr(1.25f);
  AssetSystem *assets = ecs_resource_get_mut(w, AssetSystem);
  RendererState *renderer = ecs_resource_get_mut(w, RendererState);
  game_sim_init(&s->sim, w, assets, &s->allocator);

  // ---- the sky: day and night on the scene's Sun (its DayNightCycle: time, day length, latitude); see wiki gameplay_blocks/day_night ----
  // DAY_NIGHT_SKY_PHYSICAL swaps the stylized sky for the physical atmosphere
  day_night_init(w, renderer, &s->allocator, DAY_NIGHT_SKY_STYLIZED);
  day_night_stylized_base(w)->haze = 0.6f; // the floor's edge fades into the sky

  // ---- the avatars were spawned with the arena characters in game_sim_init (Kaigen bots + their idle clips)

  // ---- UI (Clay): the HUD is built every frame after the scope, see app_update_and_render ----
  s->ui = ui_create(&(UIInitDesc){.max_glyphs = 4096}, assets);
  ecs_resource_set_ref(w, UISystem, s->ui);
  ui_system_attach_to_renderer(s->ui, renderer);

  // ---- touch: a stick on the left, a jump button on the right, drag elsewhere to look; shown once a touch arrives ----
  s->touch = touch_controls_init((TouchControlsConfig){.ui = s->ui,
                                                       .landscape = touch_controls_layout_default(TOUCH_ORIENTATION_LANDSCAPE),
                                                       .portrait = touch_controls_layout_default(TOUCH_ORIENTATION_PORTRAIT)});

#if GAME_DEV_TOOLS
  ecs_editor_default_init(&s->editor, &(EcsEditorDefaultDesc){.world = w,
                                                              .assets = assets,
                                                              .ui = s->ui,
                                                              .allocator = &s->allocator,
                                                              .canvas_width = memory->canvas_width,
                                                              .canvas_height = memory->canvas_height});
  ecs_resource_set_ref(w, GizmoSystem, gizmos_create(&(GizmoInitDesc){.assets = assets, .renderer = renderer, .sample_count = 4}));
  gizmos_attach_to_renderer(ecs_resource_get_mut(w, GizmoSystem), renderer);
#endif

  // ---- YOUR APP INIT HERE: presentation only (materials, sounds, HUD state); game state goes in game_sim_init ----

  // verification commands (hz-build --commands): pin a pose, put the debug camera in front of the player
  hz_command_register("arena_force", arena_cmd_force, s);
  hz_command_register("arena_cam", arena_cmd_cam, s);
  hz_command_register("arena_crowd", arena_cmd_crowd, s);

  log_info("starting template initialized");
}

// one line of HUD text
hz_internal void hud_text(HzUIString text, u16 size, HzUIColor color) {
  ui_text(text, ui_text_config({.fontSize = size, .textColor = color, .wrapMode = UI_TEXT_WRAP_NONE}));
}

// frame-stable copy of a formatted string (the temp buffer dies before draw)
hz_internal HzUIString hud_fmt(String s) {
  return (HzUIString){.chars = ui_frame_string(s.value, s.len), .length = (i32)s.len};
}

hz_internal CString arena_result_text(i32 r) {
  switch (r) {
  case ARENA_BRACE_PERFECT: return "PAS. Dia kehilangan keseimbangan.";
  case ARENA_BRACE_EARLY: return "TERLALU AWAL. Kamu kaku duluan.";
  case ARENA_BRACE_LATE: return "TELAT. Bahumu kena.";
  case ARENA_BRACE_INTERRUPT: return "DIBLOK. Kamu dorong duluan.";
  case ARENA_BRACE_MISS: return "MELESET. Dia kelebihan tenaga.";
  default: return "";
  }
}

// the arena HUD: counters, live status, charge meter, controls and the viral game-over panel (main lane, after the scope)
hz_internal void arena_hud_draw(GameSim *sim, EcsWorld *w, const TouchControls *touch) {
  if (touch->last_active)
    return;
  const ArenaGameState *g = ecs_resource_get(w, ArenaGameState);
  const ArenaChar *player = ecs_component_get(w, sim->player, ArenaChar);
  OsSafeAreaInsets safe = os_get_safe_area();
  HzUIColor panel = {16, 18, 24, 170};
  HzUIColor ink = {240, 242, 246, 255};
  HzUIColor dim = {176, 182, 194, 255};
  HzUIColor accent = {30, 200, 165, 255};
  HzUIColor warn = {255, 107, 53, 255};

  CString status = "";
  HzUIColor status_color = dim;
  f32 age = g->time - g->result_at;
  if (player && player->fallen > 0.0f) {
    status = "KAMU JATUH. ...";
    status_color = warn;
  } else if (g->brace_result != ARENA_BRACE_NONE && age <= 1.0f) {
    status = arena_result_text(g->brace_result);
    status_color = g->brace_result == ARENA_BRACE_PERFECT ? accent : warn;
  } else if (g->filmer_mode == ARENA_FILMER_RECORDING) {
    status = "JANGAN DORONG. Kamera hidup.";
    status_color = warn;
  } else if (g->has_incoming) {
    status = g->time >= g->window_start ? "DIA MENDORONG — TAHAN SEKARANG!" : "MENGANCAM...";
    status_color = g->time >= g->window_start ? warn : dim;
  }

  ui_element({.id = ui_id("ArenaTop"),
              .floating = {.attach_to = UI_ATTACH_TO_ROOT,
                           .attach_points = {.element = UI_ATTACH_POINT_CENTER_TOP, .parent = UI_ATTACH_POINT_CENTER_TOP},
                           .offset = {0.0f, safe.top + 14.0f}},
              .layout = {.layout_direction = UI_TOP_TO_BOTTOM,
                         .padding = {.left = 18, .right = 18, .top = 10, .bottom = 10},
                         .child_gap = 4},
              .background_color = panel,
              .corner_radius = ui_corner_radius(8)}) {
    hud_text(ui_string("ARENA UJI · DORONG & TAHAN"), 12, dim);
    TempAllocator ta = tctx_temp_allocator_begin(NULL);
    tctx_temp_allocator_scope(ta, NULL) {
      String counters = str_format(&ta.allocator, "DORONG %  ·  PAS %", fmt_i32(g->pushes), fmt_i32(g->perfects));
      hud_text(hud_fmt(counters), 20, ink);
      if (player && player->push_held) {
        i32 pct = (i32)(player->push_charge * 100.0f);
        String charge = pct >= 72 ? str_format(&ta.allocator, "ISI % — LEPAS!", fmt_i32(pct))
                                  : str_format(&ta.allocator, "ISI %…", fmt_i32(pct));
        hud_text(hud_fmt(charge), 14, pct >= 72 ? accent : warn);
      }
    }
    if (status[0])
      hud_text(ui_str_c(status), 14, status_color);
  }

  ui_element({.id = ui_id("HudControls"),
              .floating = {.attach_to = UI_ATTACH_TO_ROOT,
                           .attach_points = {.element = UI_ATTACH_POINT_LEFT_BOTTOM, .parent = UI_ATTACH_POINT_LEFT_BOTTOM},
                           .offset = {safe.left + 16.0f, -safe.bottom - 16.0f}},
              .layout = {.layout_direction = UI_TOP_TO_BOTTOM, .padding = {.left = 14, .right = 14, .top = 10, .bottom = 10},
                         .child_gap = 4},
              .background_color = panel,
              .corner_radius = ui_corner_radius(6)}) {
    hud_text(ui_string("WASD gerak   J DORONG (tahan lalu lepas = keras)"), 14, ink);
    hud_text(ui_string("K / Space Tahan   L bantuan arah   R reset   Wheel zoom"), 14, dim);
#if GAME_DEV_TOOLS
    hud_text(ui_string("F1 editor   F5 save the level"), 14, dim);
#endif
  }

  if (g->game_over) {
    ui_element({.id = ui_id("ViralOver"),
                .floating = {.attach_to = UI_ATTACH_TO_ROOT,
                             .attach_points = {.element = UI_ATTACH_POINT_CENTER_CENTER, .parent = UI_ATTACH_POINT_CENTER_CENTER},
                             .offset = {0.0f, 0.0f}},
                .layout = {.layout_direction = UI_TOP_TO_BOTTOM,
                           .padding = {.left = 28, .right = 28, .top = 22, .bottom = 22},
                           .child_gap = 8},
                .background_color = {12, 10, 16, 242},
                .corner_radius = ui_corner_radius(12)}) {
      hud_text(ui_string("VIDEO TERSIMPAN · VIRAL"), 13, warn);
      hud_text(ui_string("GAME OVER"), 34, ink);
      hud_text(ui_string("Dia merekam semuanya. Besok semua orang tahu."), 15, dim);
      hud_text(ui_string("Tekan R untuk COBA LAGI"), 15, accent);
    }
  }
}
HZ_APP_API void app_update_and_render(AppMemory *memory) {
  AppState *s = memory->state;
  EcsWorld *w = s->sim.world;
  perf_stats_begin_frame();
  ui_font_update(s->ui);
  f32 dt = m_minf(memory->dt, GAME_MAX_DT);

  // ---- main lane, BEFORE the scope: OS input to the simulation's controls, and dev keys. Game logic is systems ----
  if (is_main_thread()) {
    InputSystem *input = ecs_resource_get_mut(w, InputSystem);
    input_update(input, &memory->input_events, memory->total_time);
#if GAME_DEV_TOOLS
    if (input->buttons[KEY_F1].pressed_this_frame)
      s->editor_open = !s->editor_open;
    if (s->editor_open && input->buttons[KEY_F5].pressed_this_frame)
      s->sim.scene = scene_save(&s->sim.scene_sys, s->sim.scene, GAME_SCENE_PATH);
#endif
    // touch claims its fingers before anything else reads the pointer
    TouchControlsFrame tf = touch_controls_update(&s->touch, input, memory->total_time);
    b32 touch_on = tf.active && !s->editor_open;
    // keys, pad and touch to camera-relative controls; R respawns
    const CameraRigState *rig = ecs_resource_get(w, CameraRigState);
    v2 move = {(f32)input->buttons[KEY_D].is_pressed - (f32)input->buttons[KEY_A].is_pressed,
               (f32)input->buttons[KEY_W].is_pressed - (f32)input->buttons[KEY_S].is_pressed};
    move = v2_add(move, input_gamepad_stick(input->gamepads[input->active_gamepad].left_stick, 0.15f));
    move = v2_add(move, touch_on ? tf.move : (v2){0});
    f32 head_yaw = rig ? rig->yaw : 0.0f;
    // aim assist (L): steer straight at the nearest pushable body — verification harness and accessibility aid
    if (input->buttons[KEY_L].is_pressed) {
      const ArenaChar *pc = ecs_component_get(w, s->sim.player, ArenaChar);
      EcsQuery *q = ecs_query_cached(w, EcsIn(ArenaChar));
      const ArenaChar *best = NULL;
      f32 best_d = 1e30f;
      EcsIter aq = ecs_query_iter(q);
      while (ecs_iter_next(&aq)) {
        for (i32 qi = 0; qi < aq.count; qi++) {
          const ArenaChar *ac = ecs_component_get(w, aq.entities[qi], ArenaChar);
          if (!ac || ac->role == 0 || ac->role == 3 || ac == pc)
            continue;
          f32 dx = ac->x - pc->x;
          f32 dz = ac->z - pc->z;
          f32 d = dx * dx + dz * dz;
          if (d < best_d) {
            best_d = d;
            best = ac;
          }
        }
      }
      if (best && pc) {
        f32 dx = best->x - pc->x;
        f32 dz = best->z - pc->z;
        f32 len = m_sqrtf(dx * dx + dz * dz);
        if (len > 0.01f) {
          dx /= len;
          dz /= len;
          f32 ch = m_cosf(head_yaw);
          f32 sh = m_sinf(head_yaw);
          move = (v2){dx * ch - dz * sh, -dx * sh - dz * ch};
        }
      }
    }
    PlayerControls controls = {
        .move = move,
        .heading = rig ? rig->yaw : 0.0f,
        .jump = input->buttons[KEY_SPACE].pressed_this_frame || (touch_on && tf.jump_held && !s->touch_jump_held) ||
                input->gamepads[input->active_gamepad].buttons[GAMEPAD_A].pressed_this_frame,
        .run = input->buttons[KEY_LEFT_SHIFT].is_pressed,
        .respawn = input->buttons[KEY_R].pressed_this_frame,
        .push = input->buttons[KEY_J].is_pressed,
        .hold = input->buttons[KEY_K].is_pressed || input->buttons[KEY_SPACE].is_pressed,
    };
    s->touch_jump_held = tf.jump_held;
    // hold the right mouse button to look around; the warp on the lock frame is not a look
    b32 look = !s->editor_open && input->buttons[MOUSE_RIGHT].is_pressed;
    os_lock_mouse(look);
    v2 mouse = look && s->look_locked ? (v2){input->mouse_delta.x, -input->mouse_delta.y} : (v2){0};
    v2 pan = touch_on ? (v2){tf.camera_pan_px.x, -tf.camera_pan_px.y} : (v2){0};
    *ecs_resource_get_mut(w, CameraRigInput) = (CameraRigInput){
        .look = v2_add(v2_scale(mouse, GAME_LOOK_SENSITIVITY), v2_scale(pan, GAME_TOUCH_LOOK)),
        .zoom = s->editor_open ? 0.0f
                               : -input->scroll_delta.y * GAME_ZOOM_RATE - (touch_on ? tf.camera_pinch_px * GAME_PINCH_ZOOM : 0.0f),
    };
    s->look_locked = look;
    // the editor pauses the simulation
    game_sim_begin_frame(&s->sim, &controls, dt, s->editor_open);
  }
  if (is_main_thread() && s->crowd_spawned < s->crowd_wanted) {
    // stream the stress ring in: 6 spawns per frame keeps the deferred spawn queue well under its cap
    AssetSystem *assets = ecs_resource_get_mut(w, AssetSystem);
    for (i32 k = 0; k < 6 && s->crowd_spawned < s->crowd_wanted; k++)
      arena_spawn_crowd_one(w, assets, s->crowd_spawned++);
  }
  lane_sync(); // publishes the main-lane writes above to every lane

  // ALL lanes enter the scope. Never call is_main_thread() in here: schedule systems instead.
  ecs_scope(w) {
    day_night_schedule(w); // turns the Sun, sets the light, ambient and fog
    game_sim_schedule(&s->sim, dt);
    ecs_ik_resolve_schedule(w);
    ecs_renderer_schedule_pose(w); // clips -> joint_poses
    ecs_ik_schedule(w);            // foot plant + gaze edit the poses BEFORE skinning
    ecs_renderer_schedule_skin(w); // joint_poses -> bone matrices
    ecs_flush(w, dt);
  }

  // null until the scene's camera entity has loaded
  Camera *cam = ecs_query_get_singleton(Camera, s->sim.camera_query);

  // ---- main lane, AFTER the scope: renderer settings and UI. Clay is main-lane state; read what the systems published ----
  if (is_main_thread()) {
    day_night_sync(w, ecs_resource_get_mut(w, RendererState)); // the sky follows the clock
    // verification close-up: keep the debug camera glued to the player while the sim shoves it around
    const ArenaGameState *g = ecs_resource_get(w, ArenaGameState);
    if (g->debug_cam) {
      const WorldTransform *wt = ecs_component_get(w, s->sim.player, WorldTransform);
      const ArenaChar *ac = ecs_component_get(w, s->sim.player, ArenaChar);
      v3 base = wt ? wt->position : V3_ZERO;
      f32 rad = (ac ? ac->facing : 0.0f) + g->debug_cam_yaw * ((f32)M_PI / 180.0f);
      v3 fwd = {-m_sinf(rad), 0.0f, -m_cosf(rad)};
      // lying / rising poses live near the floor: drop the aim so the body stays framed
      f32 aim = (g->debug_force == AANIM_FALL || g->debug_force == AANIM_GETUP) ? 0.35f : 1.05f;
      Camera dcam = camera_create(&(CameraInitDesc){
          .pos = {base.x + fwd.x * g->debug_cam_dist, base.y + 1.45f, base.z + fwd.z * g->debug_cam_dist},
          .target = {base.x, base.y + aim, base.z},
          .fov_degrees = 42.0f});
      renderer_debug_camera_set(ecs_resource_get_mut(w, RendererState), dcam);
    }
    const InputSystem *input = ecs_resource_get(w, InputSystem);
    ui_begin_frame(s->ui, input, memory->dt);
#if GAME_DEV_TOOLS
    if (s->editor_open && cam)
      ecs_editor_default_update(&s->editor, &(EcsEditorDefaultUpdateDesc){.camera = cam,
                                                                         .canvas_width = memory->canvas_width,
                                                                         .canvas_height = memory->canvas_height});
    if (cam)
      gizmos_prepare(ecs_resource_get_mut(w, GizmoSystem), &(GizmoFlushDesc){.camera = cam,
                                                                             .line_width = 2.0f,
                                                                             .screen_width = memory->canvas_width,
                                                                             .screen_height = memory->canvas_height});
#endif
    // YOUR HUD HERE: ui_* calls; read game state from resources (ecs_resource_get), never mutate the world
    if (!s->editor_open) {
      arena_hud_draw(&s->sim, w, &s->touch);
      touch_controls_draw_stick(&s->touch);
      touch_controls_draw_jump_button(&s->touch);
      perf_stats_draw(input, memory->dt); // the editor's hierarchy sits where the stats draw
    }
    ui_finish_layout(s->ui);
  }
  lane_sync();

  // ALL lanes: the renderer records and submits in parallel
  if (cam) {
    renderer_update(ecs_resource_get_mut(w, RendererState), &(RendererBeginFrameDesc){
                                                                .camera = cam,
                                                                .clear_color = (ColorF32){0.6f, 0.75f, 0.9f, 1.0f},
                                                                .time = memory->total_time,
                                                            });
  }
  perf_stats_end_frame();
}

HZ_APP_API size_t app_state_size(void) { return sizeof(AppState); }
