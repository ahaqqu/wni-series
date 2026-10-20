import { describe, expect, it } from 'vitest';
import {
  ARENA,
  createArenaInput,
  createArenaState,
  resetArena,
  stepArena,
  type ArenaInput,
  type ArenaPassenger,
  type ArenaState,
} from './sim';

const DT = 1 / 60;

function passenger(state: ArenaState, behavior: 'passive' | 'aggressive'): ArenaPassenger {
  const found = state.passengers.find((q) => q.behavior === behavior);
  if (!found) throw new Error(`Missing ${behavior} passenger`);
  return found;
}

function run(
  state: ArenaState,
  seconds: number,
  input: Partial<ArenaInput> = {},
): void {
  const steps = Math.max(1, Math.ceil(seconds / DT));
  const frame = createArenaInput(input);
  for (let index = 0; index < steps; index += 1) {
    stepArena(state, DT, frame);
  }
}

function tapPush(state: ArenaState, holdSeconds = 0.1): void {
  run(state, holdSeconds, { push: true });
  run(state, 0.02, { push: false });
}

function makeDuel(): ArenaState {
  const state = createArenaState();
  state.player.x = 0;
  state.player.z = 0;
  const aggressive = passenger(state, 'aggressive');
  aggressive.x = 1.55;
  aggressive.z = 0;
  aggressive.vx = 0;
  aggressive.vz = 0;
  aggressive.attackCooldown = 0;
  aggressive.stagger = 0;
  const passive = passenger(state, 'passive');
  passive.x = 3.6;
  passive.z = 2.2;
  return state;
}

function primeIncoming(state: ArenaState, lead = 1): ArenaPassenger {
  const aggressive = passenger(state, 'aggressive');
  state.time = 0;
  state.brace.pressedAt = null;
  state.brace.held = false;
  state.brace.result = 'none';
  state.prevHold = false;
  state.incoming = {
    attackerId: aggressive.id,
    kind: 'shove',
    startedAt: 0,
    impactAt: lead,
    windowStart: lead - ARENA.window,
  };
  aggressive.windup = lead;
  return aggressive;
}

function filmer(state: ArenaState): ArenaPassenger {
  const found = state.passengers.find((q) => q.behavior === 'filmer');
  if (!found) throw new Error('Missing filmer passenger');
  return found;
}

function stagePassive(state: ArenaState): ArenaPassenger {
  const aggressive = passenger(state, 'aggressive');
  aggressive.x = -3.4;
  aggressive.z = -3.2;
  aggressive.vx = 0;
  aggressive.vz = 0;
  aggressive.attackCooldown = 99;
  const passive = passenger(state, 'passive');
  passive.x = 1;
  passive.z = 0;
  passive.homeX = 1;
  passive.homeZ = 0;
  passive.vx = 0;
  passive.vz = 0;
  state.player.x = 0;
  state.player.z = 0;
  return passive;
}

describe('push/hold arena', () => {
  it('AR-SIM-01 movement stays inside the arena and is blocked by another body', () => {
    const state = createArenaState();
    const passive = passenger(state, 'passive');
    passive.x = 1;
    passive.z = 0;
    passive.homeX = 1;
    passive.homeZ = 0;
    state.player.x = 0;
    state.player.z = 0;

    run(state, 1.2, { moveX: 1 });
    expect(state.player.x).toBeLessThan(ARENA.radius - ARENA.bodyRadius + 0.01);
    const distance = Math.hypot(state.player.x - passive.x, state.player.z - passive.z);
    expect(distance).toBeGreaterThanOrEqual(ARENA.playerRadius + ARENA.bodyRadius - 0.02);
  });

  it('AR-SIM-02 a tap push shoves the nearest passenger and spends the cooldown', () => {
    const state = createArenaState();
    stagePassive(state);

    const passive = passenger(state, 'passive');
    const before = passive.x;
    tapPush(state, 0.1);
    run(state, 0.2);
    expect(state.pushes).toBe(1);
    expect(state.lastPushHard).toBe(false);
    expect(passive.x).toBeGreaterThan(before + 0.25);
    expect(passive.fallen).toBe(0);
    expect(state.player.pushCooldown).toBeGreaterThan(0);
  });

  it('AR-SIM-03 a second push is ignored while the cooldown is running', () => {
    const state = createArenaState();
    stagePassive(state);

    tapPush(state, 0.1);
    expect(state.pushes).toBe(1);
    tapPush(state, 0.1);
    expect(state.pushes).toBe(1);
  });

  it('AR-SIM-04 the aggressive passenger telegraphs a shove when in range', () => {
    const state = createArenaState();
    const aggressive = passenger(state, 'aggressive');
    state.player.x = 0;
    state.player.z = 0;
    aggressive.x = 1.4;
    aggressive.z = 0;
    aggressive.attackCooldown = 0;
    run(state, 0.2);
    expect(state.incoming).not.toBeNull();
    expect(state.incoming?.attackerId).toBe(aggressive.id);
    expect(state.incoming?.kind).toBe('shove');
    expect(state.incoming?.impactAt).toBeGreaterThan(state.time);
    expect(state.incoming?.windowStart).toBeLessThan(state.incoming?.impactAt ?? 0);
  });

  it('AR-SIM-05 a hold pressed inside the green window blocks the shove', () => {
    const state = makeDuel();
    primeIncoming(state);
    run(state, 0.74);
    run(state, 0.4, { hold: true });
    expect(state.brace.result).toBe('perfect');
    expect(state.brace.perfects).toBe(1);
    expect(state.shoves).toBe(0);
    const aggressive = passenger(state, 'aggressive');
    expect(aggressive.stagger).toBeGreaterThan(0);
    expect(Math.hypot(state.player.x, state.player.z)).toBeLessThan(0.6);
  });

  it('AR-SIM-06 holding too early fails, and re-pressing in the window succeeds', () => {
    const state = makeDuel();
    primeIncoming(state);
    run(state, 0.15, { hold: true });
    expect(state.brace.pressedAt).not.toBeNull();
    run(state, 0.85, { hold: true });
    run(state, 0.3, { hold: true });
    expect(state.brace.result).toBe('early');
    expect(state.shoves).toBe(1);
    expect(Math.hypot(state.player.x, state.player.z)).toBeGreaterThan(0.25);

    const retry = makeDuel();
    primeIncoming(retry);
    run(retry, 0.1, { hold: true });
    run(retry, 0.3, { hold: false });
    run(retry, 0.35, { hold: false });
    run(retry, 0.3, { hold: true });
    expect(retry.brace.result).toBe('perfect');
    expect(retry.shoves).toBe(0);
  });

  it('AR-SIM-07 no hold means the shove lands, throws the player, and knocks them down', () => {
    const state = makeDuel();
    primeIncoming(state);
    run(state, 1.1);
    expect(state.brace.result).toBe('late');
    expect(state.shoves).toBe(1);
    expect(state.player.stagger).toBeGreaterThan(0);
    expect(state.player.fallen).toBeGreaterThan(0);
    run(state, 0.3);
    expect(Math.hypot(state.player.x, state.player.z)).toBeGreaterThan(0.9);
  });

  it('AR-SIM-08 pushing the aggressive during the wind-up interrupts the shove', () => {
    const state = makeDuel();
    const aggressive = primeIncoming(state);
    state.player.x = 0.2;
    aggressive.x = 1.2;
    aggressive.z = 0;
    tapPush(state, 0.1);
    expect(state.incoming).toBeNull();
    expect(state.brace.result).toBe('interrupt');
    expect(aggressive.stagger).toBeGreaterThan(0);
    expect(state.shoves).toBe(0);
  });

  it('AR-SIM-09 stepping out of range makes the shove miss', () => {
    const state = makeDuel();
    primeIncoming(state);
    state.player.x = -3.6;
    state.player.z = 0;
    run(state, 1.1);
    expect(state.brace.result).toBe('miss');
    expect(state.shoves).toBe(0);
  });

  it('AR-SIM-10 reset clears the arena and replay is deterministic', () => {
    const state = createArenaState();
    run(state, 1.2, { moveX: 0.7, moveZ: 0.4, push: true, hold: true });
    const aggressive = passenger(state, 'aggressive');
    expect(state.time).toBeGreaterThan(0);
    expect(state.player.pushHeld).toBe(true);

    resetArena(state);
    expect(state.time).toBe(0);
    expect(state.player.x).toBe(ARENA.resetPlayerX);
    expect(state.player.z).toBe(ARENA.resetPlayerZ);
    expect(state.player.pushHeld).toBe(false);
    expect(state.player.pushCharge).toBe(0);
    expect(state.incoming).toBeNull();
    expect(state.brace.result).toBe('none');
    expect(state.pushes).toBe(0);
    expect(aggressive).not.toBe(passenger(state, 'aggressive'));

    const first = createArenaState();
    const second = createArenaState();
    for (let index = 0; index < 90; index += 1) {
      const input = createArenaInput({
        moveX: Math.sin(index / 10),
        moveZ: Math.cos(index / 14),
        push: index === 20 || index === 21 || index === 60 || index === 61,
        hold: index >= 70 && index <= 80,
      });
      stepArena(first, DT, input);
      stepArena(second, DT, input);
    }
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it('AR-SIM-11 charging PUSH then releasing lands a hard push that throws and fells a passenger', () => {
    const state = createArenaState();
    const passive = stagePassive(state);

    run(state, 0.82, { push: true });
    expect(state.pushes).toBe(0);
    expect(state.player.pushHeld).toBe(true);
    expect(state.player.pushCharge).toBeGreaterThanOrEqual(ARENA.hardPushThreshold);
    run(state, 0.02, { push: false });
    expect(state.pushes).toBe(1);
    expect(state.lastPushHard).toBe(true);
    expect(passive.fallen).toBeGreaterThan(0);
    expect(passive.revenge).toBe(true);
    run(state, 0.3);
    expect(passive.x).toBeGreaterThan(1.9);
  });

  it('AR-SIM-12 a fallen player cannot move until the get-up timer expires', () => {
    const state = makeDuel();
    primeIncoming(state);
    run(state, 1.1);
    expect(state.player.fallen).toBeGreaterThan(0);
    const aggressive = passenger(state, 'aggressive');
    aggressive.attackCooldown = 99;

    state.player.vx = 0;
    state.player.vz = 0;
    const before = state.player.x;
    run(state, 0.25, { moveX: 1 });
    expect(state.player.x - before).toBeLessThan(0.05);

    run(state, 1.2);
    expect(state.player.fallen).toBe(0);
    run(state, 0.35, { moveX: 1 });
    expect(state.player.x).toBeGreaterThan(before + 0.2);
  });

  it('AR-SIM-13 a hard-pushed passenger gets angry and opens a revenge shove with quick timing', () => {
    const state = createArenaState();
    const passive = stagePassive(state);

    run(state, 0.82, { push: true });
    run(state, 0.02, { push: false });
    expect(passive.revenge).toBe(true);
    expect(passive.fallen).toBeGreaterThan(0);

    let guard = 0;
    while (state.incoming === null && guard < 180) {
      stepArena(state, DT, createArenaInput());
      guard += 1;
    }
    expect(state.incoming).not.toBeNull();
    expect(state.incoming?.kind).toBe('revenge');
    const incoming = state.incoming;
    if (!incoming) throw new Error('Expected a revenge incoming');
    expect(incoming.impactAt - incoming.startedAt).toBeCloseTo(ARENA.quickWindup, 5);
    expect(incoming.impactAt - incoming.windowStart).toBeCloseTo(ARENA.quickWindow, 5);
    expect(ARENA.quickWindup).toBeLessThan(ARENA.windup);
    expect(ARENA.quickWindow).toBeLessThan(ARENA.window);
  });

  it('AR-SIM-14 a hold inside the shorter revenge window blocks the quick shove', () => {
    const state = createArenaState();
    const passive = stagePassive(state);

    run(state, 0.82, { push: true });
    run(state, 0.02, { push: false });
    let guard = 0;
    while (state.incoming === null && guard < 180) {
      stepArena(state, DT, createArenaInput());
      guard += 1;
    }
    const incoming = state.incoming;
    if (!incoming) throw new Error('Expected a revenge incoming');
    while (state.time < incoming.windowStart) {
      stepArena(state, DT, createArenaInput());
    }
    run(state, ARENA.quickWindow + 0.08, { hold: true });
    expect(state.brace.result).toBe('perfect');
    expect(state.shoves).toBe(0);
    expect(passive.revenge).toBe(false);
  });
  it('AR-SIM-15 the camera passenger prepares after a push and catches the next push while recording', () => {
    const state = createArenaState();
    const passive = stagePassive(state);
    const camera = filmer(state);

    tapPush(state, 0.1);
    expect(state.gameOver).toBeNull();
    expect(state.filmerMode).toBe('preparing');
    expect(camera.x).toBeCloseTo(ARENA.filmerX, 5);
    run(state, ARENA.filmerPrepare + 0.05);
    expect(state.filmerMode).toBe('recording');

    tapPush(state, 0.1);
    expect(state.gameOver).toBe('viral');
    expect(state.viralTargetId).toBe(passive.id);
    expect(state.pushes).toBe(2);
  });

  it('AR-SIM-16 pushing during camera prep is not recorded; a clean recording returns to idle', () => {
    const state = createArenaState();
    stagePassive(state);

    tapPush(state, 0.1);
    expect(state.filmerMode).toBe('preparing');
    tapPush(state, 0.1);
    expect(state.gameOver).toBeNull();
    expect(state.filmerMode).toBe('preparing');

    run(state, ARENA.filmerPrepare + ARENA.filmerRecord + ARENA.filmerCooldown + 0.2);
    expect(state.gameOver).toBeNull();
    expect(state.filmerMode).toBe('idle');
  });

  it('AR-SIM-17 a viral catch freezes the arena and reset clears the camera state', () => {
    const state = createArenaState();
    stagePassive(state);

    tapPush(state, 0.1);
    run(state, ARENA.filmerPrepare + 0.05);
    tapPush(state, 0.1);
    expect(state.gameOver).toBe('viral');

    const time = state.time;
    const pushes = state.pushes;
    const playerX = state.player.x;
    stepArena(state, DT, createArenaInput({ moveX: 1, push: true }));
    expect(state.time).toBe(time);
    expect(state.pushes).toBe(pushes);
    expect(state.player.x).toBe(playerX);

    resetArena(state);
    expect(state.gameOver).toBeNull();
    expect(state.viralTargetId).toBeNull();
    expect(state.filmerMode).toBe('idle');
    expect(state.filmerTimer).toBe(0);
    expect(state.passengers).toHaveLength(3);
  });

  it('AR-SIM-18 the camera passenger is not a push target', () => {
    const state = createArenaState();
    const camera = filmer(state);
    state.player.x = camera.x;
    state.player.z = camera.z + 0.8;
    state.player.facing = Math.PI;

    tapPush(state, 0.1);
    expect(state.pushes).toBe(0);
    expect(state.lastPushHitId).toBeNull();
    expect(state.gameOver).toBeNull();
    expect(state.filmerMode).toBe('idle');
    expect(camera.fallen).toBe(0);
  });

});
