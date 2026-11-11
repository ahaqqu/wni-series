// Reflected components live in headers: the build's codegen only scans headers, which is what makes them editable in the F1 editor and savable in the scene.
#pragma once

#include "ecs/ecs.h"
#include "lib/reflect.h"
#include "lib/typedefs.h"

// tag on the entity the player controls
HZ_REFLECT()
ECS_COMPONENT(Player) {
  b32 sprint_enabled;
};

// scene marker: this entity's transform scale is the size of a solid box the character walks on and collides with
HZ_REFLECT()
ECS_COMPONENT(SolidBox) {
  u8 _;
};

// one arena character (player or passenger): xz-plane body state, ported from the three.js arena sim
HZ_REFLECT()
ECS_COMPONENT(ArenaChar) {
  i32 role; // 0 player, 1 aggressive, 2 passive, 3 filmer
  f32 mass;
  f32 x, z; // live position, sim-authoritative (transforms follow it each step)
  f32 home_x, home_z;
  f32 vx, vz;
  f32 facing; // yaw: model +Z forward, smoothed toward facing_target each step
  f32 facing_target; // desired yaw from steering; facing turns toward it at a capped rate
  f32 stagger, fallen, hit_flash;
  f32 anger, revenge_delay, attack_cooldown, windup;
  b32 revenge;
  f32 push_cooldown, push_flash, push_charge;
  b32 push_held;
  f32 brace_flash;
};
