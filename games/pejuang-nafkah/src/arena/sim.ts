import type { Build, Role } from '../sim/types';

export type ArenaBraceResult = 'none' | 'perfect' | 'early' | 'late' | 'interrupt' | 'miss';
export type ArenaIncomingKind = 'shove' | 'revenge';
export type ArenaFilmerMode = 'idle' | 'preparing' | 'recording' | 'cooldown';
export type ArenaGameOver = 'viral';

export interface ArenaPassenger {
  id: number;
  role: Role;
  build: Build;
  colorIndex: number;
  behavior: 'passive' | 'aggressive' | 'filmer';
  x: number;
  z: number;
  vx: number;
  vz: number;
  homeX: number;
  homeZ: number;
  mass: number;
  facing: number;
  stagger: number;
  fallen: number;
  anger: number;
  revenge: boolean;
  revengeDelay: number;
  attackCooldown: number;
  windup: number;
  hitFlash: number;
}

export interface ArenaIncoming {
  attackerId: number;
  kind: ArenaIncomingKind;
  startedAt: number;
  impactAt: number;
  windowStart: number;
}

export interface ArenaBrace {
  held: boolean;
  pressedAt: number | null;
  result: ArenaBraceResult;
  resultAt: number;
  perfects: number;
}

export interface ArenaPlayer {
  x: number;
  z: number;
  vx: number;
  vz: number;
  facing: number;
  stagger: number;
  fallen: number;
  pushCooldown: number;
  pushFlash: number;
  pushHeld: boolean;
  pushCharge: number;
  hitFlash: number;
  braceFlash: number;
}

export interface ArenaState {
  time: number;
  player: ArenaPlayer;
  passengers: ArenaPassenger[];
  incoming: ArenaIncoming | null;
  brace: ArenaBrace;
  pushTargetId: number | null;
  lastPushHitId: number | null;
  lastPushHard: boolean;
  filmerMode: ArenaFilmerMode;
  filmerTimer: number;
  gameOver: ArenaGameOver | null;
  viralTargetId: number | null;
  viralAt: number;
  viralHard: boolean;
  pushes: number;
  shoves: number;
  prevPush: boolean;
  prevHold: boolean;
}

export interface ArenaInput {
  moveX: number;
  moveZ: number;
  push: boolean;
  hold: boolean;
}

export const ARENA = {
  radius: 4.4,
  playerRadius: 0.28,
  bodyRadius: 0.34,
  moveSpeed: 3.1,
  friction: 6.2,
  pushReach: 1.5,
  pushCooldown: 0.45,
  pushChargeTime: 0.7,
  hardPushThreshold: 0.72,
  pushImpulse: 5.4,
  hardPushImpulse: 11.5,
  pushStagger: 0.42,
  hardPushStagger: 1.0,
  pushFall: 1.05,
  pushLunge: 0.16,
  hardPushLunge: 0.24,
  angerPerPush: 0.35,
  angerPerCharge: 0.9,
  revengeDelay: 0.35,
  filmerPrepare: 0.9,
  filmerRecord: 1.8,
  filmerCooldown: 0.7,
  filmerX: 0,
  filmerZ: -2.85,
  aggressiveSpeed: 1.45,
  aggressiveRange: 2.05,
  windup: 0.9,
  window: 0.3,
  quickWindup: 0.55,
  quickWindow: 0.18,
  attackCooldown: 2.2,
  shoveImpulse: 9.5,
  quickShoveImpulse: 8.5,
  shoveStagger: 0.9,
  shoveFall: 0.95,
  quickShoveFall: 0.8,
  retreatSpeed: 0.35,
  resetPlayerX: 0,
  resetPlayerZ: 3.0,
} as const;

export function createArenaInput(overrides: Partial<ArenaInput> = {}): ArenaInput {
  return {
    moveX: 0,
    moveZ: 0,
    push: false,
    hold: false,
    ...overrides,
  };
}

function makePassenger(
  id: number,
  role: Role,
  build: Build,
  colorIndex: number,
  behavior: 'passive' | 'aggressive' | 'filmer',
  x: number,
  z: number,
  mass: number,
): ArenaPassenger {
  return {
    id,
    role,
    build,
    colorIndex,
    behavior,
    x,
    z,
    vx: 0,
    vz: 0,
    homeX: x,
    homeZ: z,
    mass,
    facing: 0,
    stagger: 0,
    fallen: 0,
    anger: 0,
    revenge: false,
    revengeDelay: 0,
    attackCooldown: behavior === 'aggressive' ? 1.5 : 0,
    windup: 0,
    hitFlash: 0,
  };
}

export function createArenaState(): ArenaState {
  return {
    time: 0,
    player: {
      x: ARENA.resetPlayerX,
      z: ARENA.resetPlayerZ,
      vx: 0,
      vz: 0,
      facing: Math.PI,
      stagger: 0,
      fallen: 0,
      pushCooldown: 0,
      pushFlash: 0,
      pushHeld: false,
      pushCharge: 0,
      hitFlash: 0,
      braceFlash: 0,
    },
    passengers: [
      makePassenger(1, 'worker', 'broad', 1, 'aggressive', -2.3, -0.7, 1.32),
      makePassenger(2, 'student', 'slim', 2, 'passive', 2.35, 0.35, 0.88),
      makePassenger(3, 'shopper', 'medium', 3, 'filmer', ARENA.filmerX, ARENA.filmerZ, 1.0),
    ],
    incoming: null,
    brace: { held: false, pressedAt: null, result: 'none', resultAt: -10, perfects: 0 },
    pushTargetId: null,
    lastPushHitId: null,
    lastPushHard: false,
    filmerMode: 'idle',
    filmerTimer: 0,
    gameOver: null,
    viralTargetId: null,
    viralAt: 0,
    viralHard: false,
    pushes: 0,
    shoves: 0,
    prevPush: false,
    prevHold: false,
  };
}

export function resetArena(state: ArenaState): void {
  const fresh = createArenaState();
  Object.assign(state, fresh);
  state.passengers = fresh.passengers;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function length(x: number, z: number): number {
  return Math.hypot(x, z);
}

function separation(
  ax: number,
  az: number,
  aMass: number,
  bx: number,
  bz: number,
  bMass: number,
  radius: number,
): { ax: number; az: number; bx: number; bz: number } | null {
  const dx = ax - bx;
  const dz = az - bz;
  const distance = length(dx, dz);
  if (distance >= radius) return null;
  const nx = distance > 0.0001 ? dx / distance : 1;
  const nz = distance > 0.0001 ? dz / distance : 0;
  const overlap = radius - distance;
  const total = aMass + bMass;
  const aShare = bMass / total;
  const bShare = aMass / total;
  return {
    ax: ax + nx * overlap * aShare,
    az: az + nz * overlap * aShare,
    bx: bx - nx * overlap * bShare,
    bz: bz - nz * overlap * bShare,
  };
}

function clampToArena(state: ArenaState, radius: number): void {
  const p = state.player;
  const pd = length(p.x, p.z);
  const pMax = ARENA.radius - radius;
  if (pd > pMax) {
    p.x = (p.x / pd) * pMax;
    p.z = (p.z / pd) * pMax;
  }
  for (const q of state.passengers) {
    const qd = length(q.x, q.z);
    const qMax = ARENA.radius - radius;
    if (qd > qMax) {
      q.x = (q.x / qd) * qMax;
      q.z = (q.z / qd) * qMax;
    }
  }
}

function findPushTarget(state: ArenaState): ArenaPassenger | null {
  const p = state.player;
  let best: ArenaPassenger | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const q of state.passengers) {
    if (q.behavior === 'filmer') continue;
    const distance = length(q.x - p.x, q.z - p.z);
    if (distance > ARENA.pushReach) continue;
    if (distance < bestScore) {
      bestScore = distance;
      best = q;
    }
  }
  return best;
}

function calmDown(passenger: ArenaPassenger): void {
  passenger.revenge = false;
  passenger.anger = 0;
  passenger.revengeDelay = 0;
}

function performPush(state: ArenaState, charge: number): void {
  const p = state.player;
  const hard = charge >= ARENA.hardPushThreshold;
  p.pushCooldown = ARENA.pushCooldown;
  p.pushFlash = hard ? 0.3 : 0.2;
  state.lastPushHard = false;
  const target = findPushTarget(state);
  state.lastPushHitId = target?.id ?? null;
  if (!target) return;

  const dx = target.x - p.x;
  const dz = target.z - p.z;
  const distance = length(dx, dz);
  const nx = distance > 0.0001 ? dx / distance : 0;
  const nz = distance > 0.0001 ? dz / distance : 1;
  const impulse = (hard ? ARENA.hardPushImpulse : ARENA.pushImpulse) / target.mass;
  target.vx += nx * impulse;
  target.vz += nz * impulse;
  target.stagger = hard ? ARENA.hardPushStagger : ARENA.pushStagger;
  target.hitFlash = hard ? 0.4 : 0.22;
  target.windup = 0;
  target.attackCooldown = Math.max(target.attackCooldown, 0.45);
  if (hard) target.fallen = Math.max(target.fallen, ARENA.pushFall);

  target.anger = Math.min(1, target.anger + ARENA.angerPerPush + charge * ARENA.angerPerCharge);
  if (target.anger >= 1 && !target.revenge) {
    target.revenge = true;
    target.revengeDelay = ARENA.revengeDelay;
    target.attackCooldown = Math.min(target.attackCooldown, 0.25);
  }

  if (state.filmerMode === 'recording') {
    state.gameOver = 'viral';
    state.viralTargetId = target.id;
    state.viralAt = state.time;
    state.viralHard = hard;
  } else if (state.filmerMode === 'idle') {
    state.filmerMode = 'preparing';
    state.filmerTimer = ARENA.filmerPrepare;
  }

  p.x += nx * (hard ? ARENA.hardPushLunge : ARENA.pushLunge);
  p.z += nz * (hard ? ARENA.hardPushLunge : ARENA.pushLunge);
  p.facing = Math.atan2(-nx, -nz);
  state.pushes += 1;
  state.lastPushHard = hard;

  if (state.incoming && state.incoming.attackerId === target.id) {
    state.incoming = null;
    state.brace.result = 'interrupt';
    state.brace.resultAt = state.time;
    target.stagger = Math.max(target.stagger, hard ? 1.0 : 0.72);
    target.vx -= nx * (hard ? 0.8 : 0.4);
    target.vz -= nz * (hard ? 0.8 : 0.4);
    if (hard) target.fallen = Math.max(target.fallen, ARENA.pushFall);
  }
}

function startIncoming(
  state: ArenaState,
  attacker: ArenaPassenger,
  kind: ArenaIncomingKind,
): void {
  const lead = kind === 'revenge' ? ARENA.quickWindup : ARENA.windup;
  const window = kind === 'revenge' ? ARENA.quickWindow : ARENA.window;
  const startedAt = state.time;
  state.incoming = {
    attackerId: attacker.id,
    kind,
    startedAt,
    impactAt: startedAt + lead,
    windowStart: startedAt + lead - window,
  };
  attacker.windup = lead;
  if (state.brace.result !== 'none' && state.time - state.brace.resultAt > 0.9) {
    state.brace.result = 'none';
  }
}

function resolveIncoming(state: ArenaState, holding: boolean): void {
  const incoming = state.incoming;
  if (!incoming) return;
  const attacker = state.passengers.find((q) => q.id === incoming.attackerId);
  if (!attacker) {
    state.incoming = null;
    return;
  }

  const p = state.player;
  const dx = p.x - attacker.x;
  const dz = p.z - attacker.z;
  const distance = length(dx, dz);
  const nx = distance > 0.0001 ? dx / distance : 0;
  const nz = distance > 0.0001 ? dz / distance : 1;
  const pressedAt = state.brace.pressedAt;
  const isRevenge = incoming.kind === 'revenge';

  if (distance > 2.45) {
    state.brace.result = 'miss';
    state.brace.resultAt = state.time;
    state.brace.pressedAt = null;
    attacker.stagger = Math.max(attacker.stagger, 0.5);
    attacker.attackCooldown = ARENA.attackCooldown;
    attacker.windup = 0;
    if (isRevenge) calmDown(attacker);
    state.incoming = null;
    return;
  }

  const inWindow =
    pressedAt !== null && pressedAt >= incoming.windowStart && pressedAt <= incoming.impactAt;
  const perfect = inWindow && holding;

  if (perfect) {
    state.brace.result = 'perfect';
    state.brace.perfects += 1;
    p.braceFlash = 0.35;
    p.vx -= nx * 0.4;
    p.vz -= nz * 0.4;
    attacker.vx += nx * (isRevenge ? 2.8 : 2.2);
    attacker.vz += nz * (isRevenge ? 2.8 : 2.2);
    attacker.stagger = isRevenge ? 0.9 : 0.8;
    attacker.attackCooldown = ARENA.attackCooldown;
    if (isRevenge) calmDown(attacker);
  } else {
    state.brace.result =
      holding && pressedAt !== null && pressedAt < incoming.windowStart ? 'early' : 'late';
    state.shoves += 1;
    p.vx += nx * (isRevenge ? ARENA.quickShoveImpulse : ARENA.shoveImpulse);
    p.vz += nz * (isRevenge ? ARENA.quickShoveImpulse : ARENA.shoveImpulse);
    p.stagger = ARENA.shoveStagger;
    p.fallen = Math.max(p.fallen, isRevenge ? ARENA.quickShoveFall : ARENA.shoveFall);
    p.pushHeld = false;
    p.pushCharge = 0;
    p.hitFlash = 0.42;
    attacker.attackCooldown = ARENA.attackCooldown;
    if (isRevenge) calmDown(attacker);
  }

  state.brace.resultAt = state.time;
  state.brace.pressedAt = null;
  attacker.windup = 0;
  state.incoming = null;
}

function stepFilmer(state: ArenaState, step: number): void {
  if (state.filmerMode === 'preparing') {
    state.filmerTimer -= step;
    if (state.filmerTimer <= 0) {
      state.filmerMode = 'recording';
      state.filmerTimer = ARENA.filmerRecord;
    }
  } else if (state.filmerMode === 'recording') {
    state.filmerTimer -= step;
    if (state.filmerTimer <= 0) {
      state.filmerMode = 'cooldown';
      state.filmerTimer = ARENA.filmerCooldown;
    }
  } else if (state.filmerMode === 'cooldown') {
    state.filmerTimer = Math.max(0, state.filmerTimer - step);
    if (state.filmerTimer <= 0) {
      state.filmerMode = 'idle';
    }
  }
}

export function stepArena(state: ArenaState, dt: number, input: ArenaInput): void {
  if (state.gameOver) return;
  const step = clamp(dt, 0, 0.05);
  state.time += step;
  const p = state.player;

  p.pushCooldown = Math.max(0, p.pushCooldown - step);
  p.pushFlash = Math.max(0, p.pushFlash - step);
  p.hitFlash = Math.max(0, p.hitFlash - step);
  p.braceFlash = Math.max(0, p.braceFlash - step);
  p.stagger = Math.max(0, p.stagger - step);
  p.fallen = Math.max(0, p.fallen - step);

  for (const q of state.passengers) {
    q.stagger = Math.max(0, q.stagger - step);
    q.fallen = Math.max(0, q.fallen - step);
    q.hitFlash = Math.max(0, q.hitFlash - step);
    q.attackCooldown = Math.max(0, q.attackCooldown - step);
    q.revengeDelay = Math.max(0, q.revengeDelay - step);
    q.windup = Math.max(0, q.windup - step);
  }

  stepFilmer(state, step);

  const pushPressed = input.push && !state.prevPush;
  const holdPressed = input.hold && !state.prevHold;
  if (holdPressed && p.fallen <= 0) {
    state.brace.held = true;
    state.brace.pressedAt = state.time;
  }
  if (!input.hold || p.fallen > 0) state.brace.held = false;

  let releaseCharge: number | null = null;
  if (p.fallen > 0) {
    p.pushHeld = false;
    p.pushCharge = 0;
  } else {
    if (pushPressed) {
      p.pushHeld = true;
      p.pushCharge = 0;
    }
    if (p.pushHeld) {
      if (input.push) {
        p.pushCharge = Math.min(1, p.pushCharge + step / ARENA.pushChargeTime);
      } else {
        releaseCharge = p.pushCharge;
        p.pushHeld = false;
        p.pushCharge = 0;
      }
    }
  }
  state.prevPush = input.push;
  state.prevHold = input.hold;

  let mx = p.fallen > 0 ? 0 : clamp(input.moveX, -1, 1);
  let mz = p.fallen > 0 ? 0 : clamp(input.moveZ, -1, 1);
  const inputLength = length(mx, mz);
  if (inputLength > 1) {
    mx /= inputLength;
    mz /= inputLength;
  }
  const speed =
    ARENA.moveSpeed *
    (p.fallen > 0 ? 0 : p.stagger > 0 ? 0.35 : 1) *
    (p.pushHeld ? 0.7 : 1);
  if (p.fallen <= 0 && inputLength > 0.05) p.facing = Math.atan2(-mx, -mz);
  p.x += (mx * speed + p.vx) * step;
  p.z += (mz * speed + p.vz) * step;
  p.vx *= Math.exp(-ARENA.friction * step);
  p.vz *= Math.exp(-ARENA.friction * step);

  for (const q of state.passengers) {
    if (q.behavior === 'filmer') {
      q.vx = 0;
      q.vz = 0;
      q.facing = Math.atan2(-(p.x - q.x), -(p.z - q.z));
      q.x += q.vx * step;
      q.z += q.vz * step;
      continue;
    }
    const hostile = q.behavior === 'aggressive' || q.revenge;
    const canAct = q.fallen <= 0 && q.stagger <= 0 && q.revengeDelay <= 0;
    if (!canAct) {
      q.vx *= Math.exp(-ARENA.friction * step);
      q.vz *= Math.exp(-ARENA.friction * step);
      if (q.revenge) {
        const faceDx = p.x - q.x;
        const faceDz = p.z - q.z;
        if (length(faceDx, faceDz) > 0.001) q.facing = Math.atan2(-faceDx, -faceDz);
      }
    } else if (hostile) {
      if (state.incoming && state.incoming.attackerId === q.id) {
        q.vx *= Math.exp(-ARENA.friction * step);
        q.vz *= Math.exp(-ARENA.friction * step);
      } else {
        const dx = p.x - q.x;
        const dz = p.z - q.z;
        const distance = length(dx, dz);
        const nx = distance > 0.0001 ? dx / distance : 0;
        const nz = distance > 0.0001 ? dz / distance : 1;
        q.facing = Math.atan2(-nx, -nz);
        if (distance > ARENA.aggressiveRange) {
          q.vx += (nx * ARENA.aggressiveSpeed - q.vx) * Math.min(1, step * 8);
          q.vz += (nz * ARENA.aggressiveSpeed - q.vz) * Math.min(1, step * 8);
        } else {
          q.vx *= Math.exp(-ARENA.friction * step);
          q.vz *= Math.exp(-ARENA.friction * step);
          if (!state.incoming && q.attackCooldown <= 0 && p.fallen <= 0) {
            startIncoming(state, q, q.revenge ? 'revenge' : 'shove');
          }
        }
      }
    } else {
      if (q.stagger > 0) {
        q.vx *= Math.exp(-ARENA.friction * step);
        q.vz *= Math.exp(-ARENA.friction * step);
      } else {
        const dx = q.homeX - q.x;
        const dz = q.homeZ - q.z;
        const distance = length(dx, dz);
        if (distance > 0.25) {
          q.vx += (dx / distance) * ARENA.retreatSpeed * step * 3;
          q.vz += (dz / distance) * ARENA.retreatSpeed * step * 3;
        } else {
          q.vx *= Math.exp(-ARENA.friction * step);
          q.vz *= Math.exp(-ARENA.friction * step);
        }
      }
      const faceDx = p.x - q.x;
      const faceDz = p.z - q.z;
      if (length(faceDx, faceDz) > 0.001) q.facing = Math.atan2(-faceDx, -faceDz);
    }

    q.x += q.vx * step;
    q.z += q.vz * step;
    q.vx *= Math.exp(-ARENA.friction * step);
    q.vz *= Math.exp(-ARENA.friction * step);
  }

  if (releaseCharge !== null && p.pushCooldown <= 0 && p.fallen <= 0) {
    performPush(state, releaseCharge);
  }

  if (state.incoming && state.time >= state.incoming.impactAt) {
    resolveIncoming(state, input.hold);
  }

  const bodyRadius = ARENA.playerRadius + ARENA.bodyRadius;
  for (const q of state.passengers) {
    const result = separation(p.x, p.z, 1.05, q.x, q.z, q.mass, bodyRadius);
    if (result) {
      p.x = result.ax;
      p.z = result.az;
      q.x = result.bx;
      q.z = result.bz;
    }
  }

  const [aggressive, passive] = state.passengers;
  if (aggressive && passive) {
    const result = separation(
      aggressive.x,
      aggressive.z,
      aggressive.mass,
      passive.x,
      passive.z,
      passive.mass,
      ARENA.bodyRadius * 2,
    );
    if (result) {
      aggressive.x = result.ax;
      aggressive.z = result.az;
      passive.x = result.bx;
      passive.z = result.bz;
    }
  }

  clampToArena(state, ARENA.bodyRadius);
  state.pushTargetId = findPushTarget(state)?.id ?? null;
}

export function braceRemaining(state: ArenaState): number {
  if (!state.incoming) return 0;
  return Math.max(0, state.incoming.impactAt - state.time);
}

export function incomingProgress(state: ArenaState): number {
  if (!state.incoming) return 0;
  const span = state.incoming.impactAt - state.incoming.startedAt;
  if (span <= 0) return 1;
  return clamp((state.time - state.incoming.startedAt) / span, 0, 1);
}
