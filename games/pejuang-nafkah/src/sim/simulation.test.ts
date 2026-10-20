import { describe, expect, it } from 'vitest';
import { RUN, WORLD } from './constants';
import { computeScore } from './score';
import {
  createInput,
  createSimulation,
  startRun,
  stepSimulation,
  zoneX,
} from './simulation';
import type { SimInput, SimState } from './types';

const DT = 1 / 60;

function runSeconds(
  state: SimState,
  seconds: number,
  inputFor: (index: number) => SimInput = () => createInput({ targetZone: state.player.zone }),
): void {
  const steps = Math.ceil(seconds / DT);
  for (let index = 0; index < steps; index += 1) {
    stepSimulation(state, DT, inputFor(index));
    if (state.phase === 'result') return;
  }
}

function makePlatform(seed = 7): SimState {
  const state = createSimulation(seed);
  startRun(state);
  state.phase = 'platform';
  state.phaseTime = 0;
  state.elapsed = 50;
  state.platformEnterTime = 46.8;
  state.nextTrainTime = 120;
  state.trainIndex = 0;
  state.frontZone = 0;
  state.estimate = 0;
  state.trainRevealed = false;
  state.player.zone = 1;
  state.player.zoneFloat = 1;
  state.player.x = zoneX(1);
  state.player.claim = RUN.claimStart;
  state.player.energy = RUN.startEnergy;
  state.player.gengsi = RUN.maxGengsi;
  state.notices = [];
  return state;
}

function makeBoard(seed = 7): SimState {
  const state = createSimulation(seed);
  startRun(state);
  state.phase = 'board';
  state.phaseTime = 0;
  state.elapsed = 100;
  state.nextTrainTime = 120;
  state.trainIndex = 0;
  state.frontZone = 0;
  state.estimate = 0;
  state.trainRevealed = true;
  state.trainState = 'stopped';
  state.trainProgress = 1;
  state.doorsOpen = 1;
  state.player.zone = 0;
  state.player.zoneFloat = 0;
  state.player.x = zoneX(0);
  state.player.claim = 0.6;
  state.player.boardProgress = 0.4;
  state.player.charge = 0;
  state.player.hadSpot = true;
  state.player.canBoard = true;
  state.player.holding = false;
  state.player.energy = RUN.startEnergy;
  state.player.gengsi = RUN.maxGengsi;
  state.protectWindow = 0;
  state.protectUsed = false;
  state.cameraWarning = 0;
  state.notices = [];
  return state;
}

function boardInput(state: SimState, overrides: Partial<SimInput> = {}): SimInput {
  return createInput({
    targetZone: state.player.zone,
    ...overrides,
  });
}

describe('Pejuang Nafkah push-and-hold simulation', () => {
  it('PA-SIM-01 energy is only spent while holding; gate cutting is a real trade', () => {
    const state = createSimulation(11);
    startRun(state);
    state.phase = 'gate';
    state.phaseTime = 0;
    state.elapsed = 4;
    state.gate.active = true;
    state.gate.wait = 10;
    state.player.x = WORLD.gateX;
    state.player.energy = 100;
    state.player.gengsi = 100;
    runSeconds(state, 1, () => createInput({ hold: true, targetZone: 1 }));
    expect(state.phase).toBe('gate');
    expect(state.player.energy).toBeCloseTo(96, 5);
    expect(state.player.gengsi).toBeCloseTo(97.8, 5);
  });

  it('PA-SIM-02 claim must survive the surge and clear the safe floor at arrival', () => {
    const safe = makePlatform();
    safe.player.claim = 0.5;
    safe.nextTrainTime = safe.elapsed + 2.9;
    stepSimulation(safe, 0.2, createInput({ targetZone: 1 }));
    expect(safe.phase).toBe('arrival');
    expect(safe.player.hadSpot).toBe(true);
    expect(safe.player.canBoard).toBe(true);

    const lost = makePlatform();
    lost.player.claim = 0.34;
    lost.nextTrainTime = lost.elapsed + 2.9;
    stepSimulation(lost, 0.2, createInput({ targetZone: 1 }));
    expect(lost.phase).toBe('arrival');
    expect(lost.player.hadSpot).toBe(false);
    expect(lost.player.canBoard).toBe(false);
  });

  it('PA-SIM-03 holding against the surge costs energy and moves the claim forward', () => {
    const held = makePlatform();
    held.platformEnterTime = held.elapsed - 3.2;
    held.player.claim = 0.5;
    runSeconds(held, 1, () => createInput({ hold: true, targetZone: 1 }));
    expect(held.player.claim).toBeGreaterThan(0.58);
    expect(held.player.energy).toBeLessThan(98);

    const released = makePlatform();
    released.platformEnterTime = released.elapsed - 3.2;
    released.player.claim = 0.55;
    runSeconds(released, 1, () => createInput({ hold: false, targetZone: 1 }));
    expect(released.player.claim).toBeLessThan(0.5);
    expect(released.player.energy).toBe(100);
  });

  it('PA-SIM-04 intentional yellow-line crossing is a whistle and gengsi loss', () => {
    const state = makePlatform();
    state.player.claim = 0.99;
    state.platformEnterTime = state.elapsed - 1;
    runSeconds(state, 1, () => createInput({ hold: true, targetZone: 1 }));
    expect(state.player.gengsi).toBe(85);
    expect(state.player.claim).toBeLessThan(0.7);
    expect(state.whistle).toBeGreaterThan(0);
  });

  it('PA-SIM-05 a crowd shove over the line is not the player’s fault', () => {
    const state = makePlatform();
    state.player.claim = 1.005;
    state.platformEnterTime = state.elapsed - 3.2;
    state.player.gengsi = 100;
    stepSimulation(state, DT, createInput({ hold: false, targetZone: 1 }));
    expect(state.player.gengsi).toBe(100);
    expect(state.player.claim).toBeCloseTo(0.98, 5);
  });

  it('PA-SIM-06 alighters go first; pushing the outflow costs gengsi', () => {
    const state = createSimulation(21);
    state.phase = 'alight';
    state.phaseTime = 0;
    state.trainState = 'stopped';
    state.doorsOpen = 0;
    state.alightPenalty = false;
    state.player.holding = true;
    state.player.gengsi = 100;
    state.player.energy = 100;
    stepSimulation(state, DT, createInput({ hold: true, targetZone: 0 }));
    expect(state.alightPenalty).toBe(true);
    expect(state.player.gengsi).toBe(92);
    expect(state.player.energy).toBe(96);
  });

  it('PA-SIM-07 release at full charge performs a Hentak burst', () => {
    const state = makeBoard();
    state.player.boardProgress = 0.5;
    state.player.charge = 1;
    state.player.holding = true;
    state.player.energy = 100;
    state.player.gengsi = 100;
    stepSimulation(state, DT, boardInput(state, { hold: false }));
    expect(state.player.boardProgress).toBeGreaterThan(0.7);
    expect(state.player.energy).toBeLessThan(85);
    expect(state.burst).toBeGreaterThan(0);
    expect(state.phase).toBe('board');
  });

  it('PA-SIM-08 camera warning reaches viral and zeroes gengsi', () => {
    const state = makeBoard();
    state.player.boardProgress = 0.2;
    state.player.holding = true;
    state.cameraWarning = 0.99;
    state.player.energy = 100;
    stepSimulation(state, DT, boardInput(state, { hold: true }));
    expect(state.phase).toBe('result');
    expect(state.failReason).toBe('viral');
    expect(state.player.gengsi).toBe(0);
    expect(state.result?.message).toContain('viral');
  });

  it('PA-SIM-09 gengsi can reach zero from ordinary cuts and ends the run', () => {
    const state = createSimulation(31);
    startRun(state);
    state.phase = 'gate';
    state.phaseTime = 0;
    state.elapsed = 4;
    state.gate.active = true;
    state.gate.wait = 10;
    state.player.x = WORLD.gateX;
    state.player.energy = 100;
    state.player.gengsi = 1;
    runSeconds(state, 1, () => createInput({ hold: true, targetZone: 1 }));
    expect(state.phase).toBe('result');
    expect(state.failReason).toBe('gengsi');
    expect(state.player.gengsi).toBe(0);
  });

  it('PA-SIM-10 two waves: first miss becomes a second, denser platform', () => {
    const state = makeBoard();
    state.wave = 0;
    state.phaseTime = 6.0;
    state.player.hadSpot = false;
    state.player.canBoard = false;
    state.player.holding = false;
    stepSimulation(state, 0.2, boardInput(state));
    expect(state.phase).toBe('missed');

    runSeconds(state, 2.5, () => createInput({ targetZone: 1 }));
    expect(state.phase).toBe('platform');
    expect(state.wave).toBe(1);
    expect(state.nextTrainTime).toBe(RUN.trainSchedule[1]);
    expect(state.elapsed).toBeGreaterThanOrEqual(180);
    expect(state.crowdDensity).toBe(1.35);
  });

  it('PA-SIM-11 missing the second train is a hard time fail at 4:00', () => {
    const state = makeBoard();
    state.wave = 1;
    state.phaseTime = 6.0;
    state.player.hadSpot = false;
    state.player.canBoard = false;
    state.player.holding = false;
    stepSimulation(state, 0.2, boardInput(state));
    expect(state.phase).toBe('result');
    expect(state.failReason).toBe('time');
    expect(state.elapsed).toBe(RUN.limit);
    expect(state.result?.elapsed).toBe(RUN.limit);
  });

  it('PA-SIM-12 a wrong door zone can be scrambled at the last second', () => {
    const state = makeBoard();
    state.frontZone = 2;
    state.player.zone = 0;
    state.player.zoneFloat = 0;
    state.player.x = zoneX(0);
    state.player.claim = 0.6;
    state.player.boardProgress = 0.05;
    state.player.holding = true;
    state.player.hadSpot = true;
    state.player.canBoard = true;
    state.player.energy = 100;

    const input = boardInput(state, { hold: true, targetZone: 2 });
    stepSimulation(state, DT, input);
    expect(state.player.zone).toBe(2);

    for (let index = 0; index < 240 && state.phase === 'board'; index += 1) {
      stepSimulation(state, DT, input);
    }
    expect(state.phase).toBe('inside');
    expect(state.player.carRank).toBe(0);
    expect(state.player.boarded).toBe(true);
  });

  it('PA-SIM-13 releasing during the protect window protects instead of filming', () => {
    const state = makeBoard();
    state.player.gengsi = 50;
    state.player.energy = 100;
    state.player.boardProgress = 0.3;
    state.player.holding = true;
    state.protectWindow = 2;
    state.protectUsed = false;
    stepSimulation(state, DT, boardInput(state, { hold: false }));
    expect(state.player.gengsi).toBe(62);
    expect(state.player.energy).toBe(76);
    expect(state.actors.find((actor) => actor.vulnerable)?.protected).toBe(true);
    expect(state.protectedActorId).not.toBeNull();
  });

  it('PA-SIM-14 coffee is an optional energy/gengsi trade with a time cost', () => {
    const state = createSimulation(41);
    startRun(state);
    state.phase = 'concourse';
    state.phaseTime = 0;
    state.elapsed = 20;
    state.coffee.available = true;
    state.coffee.timer = 3;
    state.player.energy = 50;
    state.player.gengsi = 50;
    state.player.rupiah = 15000;
    state.player.x = WORLD.gateX;
    stepSimulation(state, DT, createInput({ coffee: true, targetZone: 1 }));
    expect(state.player.energy).toBe(90);
    expect(state.player.gengsi).toBe(58);
    expect(state.player.rupiah).toBe(5000);
    expect(state.elapsed).toBeGreaterThan(37.9);
    expect(state.elapsed).toBeLessThan(38.1);
    expect(state.coffee.bought).toBe(true);
  });

  it('PA-SIM-15 first-in chooses seat or standing; seat pays energy and score', () => {
    const state = createSimulation(51);
    state.phase = 'inside';
    state.phaseTime = 0;
    state.insideTimer = 4;
    state.seatChoice = true;
    state.seatAvailable = true;
    state.seatTimer = 4;
    state.player.carRank = 0;
    state.player.rank = 1;
    state.player.spot = null;
    state.player.energy = 50;
    state.player.gengsi = 100;
    state.boardedAt = 100;
    stepSimulation(state, DT, createInput({ seat: 'seat', targetZone: 0 }));
    expect(state.phase).toBe('result');
    expect(state.result?.success).toBe(true);
    expect(state.player.spot).toBe('seat');
    expect(state.player.energy).toBe(70);
    expect(state.result?.score).toBe(900);
  });

  it('PA-SIM-16 score is position plus remaining gengsi, capped', () => {
    const best = computeScore(0, 1, 'seat', 100);
    expect(best.total).toBe(900);
    expect(best.positionScore).toBe(600);
    expect(best.gengsiScore).toBe(300);

    const back = computeScore(2, 5, 'deep', 0);
    expect(back.total).toBe(180);
    expect(back.carScore).toBe(100);
    expect(back.rankScore).toBe(60);
    expect(back.spotScore).toBe(20);
  });

  it('PA-SIM-17 same seed and same input replay identically', () => {
    const a = createSimulation(20261020);
    const b = createSimulation(20261020);
    startRun(a);
    startRun(b);
    for (let index = 0; index < 1800; index += 1) {
      const input = createInput({
        hold: index % 45 < 8,
        targetZone: index % 600 > 300 ? 2 : 1,
      });
      stepSimulation(a, DT, input);
      stepSimulation(b, DT, input);
    }
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
