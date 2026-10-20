import { RUN, WORLD, ZONE_NAMES } from './constants';
import { clamp, chance, lerp, moveToward, nextRandom, randomInt } from './rng';
import { computeScore, resultMessage } from './score';
import type {
  Actor,
  Behavior,
  Build,
  FailReason,
  Result,
  Role,
  SimInput,
  SimState,
  Spot,
} from './types';

export function zoneX(zone: number): number {
  return WORLD.zone0X + zone * WORLD.zoneSpacing;
}

export function zoneName(zone: number): string {
  return ZONE_NAMES[zone] ?? '?';
}

export function createInput(overrides: Partial<SimInput> = {}): SimInput {
  return {
    hold: false,
    targetZone: 1,
    coffee: false,
    seat: null,
    ...overrides,
  };
}

const ROLE_POOL: Role[] = ['office', 'student', 'shopper', 'elderly', 'parent', 'worker'];

function buildFromMass(mass: number): Build {
  if (mass < 0.98) return 'slim';
  if (mass < 1.18) return 'medium';
  return 'broad';
}

function behaviorFromAggression(aggression: number): Behavior {
  if (aggression > 0.62) return 'aggressive';
  if (aggression < 0.16) return 'cautious';
  return 'neutral';
}

function addActor(
  state: SimState,
  zone: number,
  role: Role,
  options: {
    vulnerable?: boolean;
    aggression?: number;
    mass?: number;
    boardProgress?: number;
    boardRate?: number;
    lane?: number;
    xOffset?: number;
  } = {},
): Actor {
  const aggression = options.aggression ?? clamp(nextRandom(state) * 0.6, 0, 0.6);
  const mass = options.mass ?? 0.8 + nextRandom(state) * 0.55;
  const vulnerable = options.vulnerable ?? false;
  const boardProgress = options.boardProgress ?? nextRandom(state) * 0.22;
  const boardRate =
    options.boardRate ??
    clamp(
      0.16 + aggression * 0.11 + Math.max(0, mass - 1) * 0.025,
      0.12,
      vulnerable ? 0.14 : 0.32,
    );
  const actor: Actor = {
    id: state.actors.length + 1,
    role,
    build: buildFromMass(mass),
    behavior: vulnerable ? 'cautious' : behaviorFromAggression(aggression),
    zone,
    lane: options.lane ?? nextRandom(state),
    xOffset: options.xOffset ?? (nextRandom(state) * 2 - 1) * 1.1,
    mass,
    aggression,
    vulnerable,
    boardProgress,
    initialBoardProgress: boardProgress,
    boardRate,
    boarded: false,
    boardTime: 0,
    protected: false,
    colorIndex: randomInt(state, 0, 7),
  };
  state.actors.push(actor);
  return actor;
}

function generateActors(state: SimState): Actor[] {
  state.actors = [];

  // Zone A: the pregnant passenger and a broad, aggressive worker.
  addActor(state, 0, 'pregnant', {
    vulnerable: true,
    mass: 0.94,
    aggression: 0,
    boardProgress: 0.44,
    boardRate: 0.12,
    lane: 0.35,
    xOffset: -0.25,
  });
  addActor(state, 0, 'worker', {
    mass: 1.32,
    aggression: 0.9,
    boardProgress: 0.18,
    boardRate: 0.28,
    lane: 0.6,
    xOffset: 0.45,
  });

  // Zone B: a schoolchild with a parent, and a sharp-elbowed office worker.
  addActor(state, 1, 'child', {
    vulnerable: true,
    mass: 0.7,
    aggression: 0,
    boardProgress: 0.4,
    boardRate: 0.11,
    lane: 0.3,
    xOffset: -0.2,
  });
  addActor(state, 1, 'parent', {
    mass: 0.98,
    aggression: 0.08,
    boardProgress: 0.32,
    boardRate: 0.15,
    lane: 0.36,
    xOffset: 0.15,
  });
  addActor(state, 1, 'office', {
    mass: 1.08,
    aggression: 0.74,
    boardProgress: 0.2,
    boardRate: 0.26,
    lane: 0.62,
    xOffset: 0.55,
  });

  // Zone C: no vulnerable passenger; a safer, possibly rear, option.
  addActor(state, 2, 'worker', {
    mass: 1.2,
    aggression: 0.58,
    boardProgress: 0.16,
    boardRate: 0.24,
    lane: 0.55,
    xOffset: 0.25,
  });

  const counts = [8, 8, 8];
  for (let zone = 0; zone < 3; zone += 1) {
    const target = counts[zone] ?? 8;
    while (state.actors.filter((actor) => actor.zone === zone).length < target) {
      const role = ROLE_POOL[randomInt(state, 0, ROLE_POOL.length - 1)] ?? 'office';
      addActor(state, zone, role);
    }
  }

  return state.actors;
}

function rollDoorRead(state: SimState): void {
  state.frontZone = randomInt(state, 0, 2);
  // The board is usually right, but it is explicitly an estimate.
  state.estimate = chance(state, 0.65)
    ? state.frontZone
    : (state.frontZone + (chance(state, 0.5) ? 1 : 2)) % 3;
  state.trainRevealed = false;
}

function addNotice(
  state: SimState,
  text: string,
  tone: 'info' | 'warn' | 'good' = 'info',
  duration = 2.6,
): void {
  const active = state.notices.filter((notice) => notice.until > state.elapsed);
  active.push({ text, tone, until: state.elapsed + duration });
  state.notices = active.slice(-3);
}

function activeNotice(state: SimState) {
  for (let index = state.notices.length - 1; index >= 0; index -= 1) {
    const notice = state.notices[index];
    if (notice && notice.until > state.elapsed) return notice;
  }
  return null;
}

function failRun(state: SimState, reason: FailReason): void {
  if (state.phase === 'result' || state.phase === 'inside') return;
  state.phase = 'result';
  state.phaseTime = 0;
  state.failReason = reason;
  state.viral = reason === 'viral';
  state.player.holding = false;
  state.seatChoice = false;
  if (reason === 'viral' || reason === 'gengsi') state.player.gengsi = 0;

  let message = 'Kehabisan waktu. Kamu belum masuk kereta.';
  if (reason === 'viral') message = 'Video itu viral. Gengsi 0. Kamu pulang.';
  if (reason === 'gengsi') message = 'Gengsi habis. Kamu pulang.';
  if (reason === 'time') state.elapsed = RUN.limit;

  const result: Result = {
    success: false,
    failReason: reason,
    score: 0,
    positionScore: 0,
    gengsiScore: 0,
    carRank: -1,
    rank: 0,
    spot: null,
    gengsi: state.player.gengsi,
    energy: state.player.energy,
    elapsed: state.elapsed,
    message,
  };
  state.result = result;
}

function finishSuccess(state: SimState): void {
  if (state.phase === 'result') return;
  const fallbackSpot: Spot =
    state.player.carRank === 0 ? 'door' : state.player.rank > 4 ? 'deep' : 'pole';
  const spot = state.player.spot ?? fallbackSpot;
  state.player.spot = spot;
  const breakdown = computeScore(
    state.player.carRank,
    state.player.rank,
    spot,
    state.player.gengsi,
  );
  state.phase = 'result';
  state.phaseTime = 0;
  state.player.holding = false;
  state.seatChoice = false;
  state.result = {
    success: true,
    failReason: null,
    score: breakdown.total,
    positionScore: breakdown.positionScore,
    gengsiScore: breakdown.gengsiScore,
    carRank: state.player.carRank,
    rank: state.player.rank,
    spot,
    gengsi: state.player.gengsi,
    energy: state.player.energy,
    elapsed: state.boardedAt || state.elapsed,
    message: resultMessage(state.player.carRank, state.player.rank, spot),
  };
}

function checkMeters(state: SimState): boolean {
  state.player.energy = clamp(state.player.energy, 0, RUN.maxEnergy);
  state.player.gengsi = clamp(state.player.gengsi, 0, RUN.maxGengsi);
  if (state.player.gengsi <= 0 && state.phase !== 'result') {
    failRun(state, 'gengsi');
    return false;
  }
  return true;
}

function triggerViral(state: SimState): void {
  if (state.phase === 'result') return;
  state.player.gengsi = 0;
  addNotice(state, 'Video itu tersebar. Gengsi 0.', 'warn', 5);
  failRun(state, 'viral');
}

function enterGate(state: SimState): void {
  state.phase = 'gate';
  state.phaseTime = 0;
  state.gate.active = true;
  state.gate.paid = true;
  state.gate.wait = RUN.gateWait;
  state.gate.cutting = false;
  state.player.x = WORLD.gateX;
  state.player.rupiah = Math.max(0, state.player.rupiah - RUN.fare);
  addNotice(state, `Tap in · Rp ${RUN.fare.toLocaleString('id-ID')}`, 'info', 2.2);
}

function enterConcourse(state: SimState): void {
  state.phase = 'concourse';
  state.phaseTime = 0;
  state.gate.active = false;
  state.player.x = WORLD.gateX;
  state.coffee.available = true;
  state.coffee.timer = RUN.coffeeWindow;
  addNotice(state, 'Kopi Subuh. Mau mampir?', 'info', 2.8);
}

function enterPlatform(state: SimState, waveIndex: number): void {
  state.phase = 'platform';
  state.phaseTime = 0;
  state.wave = waveIndex;
  state.platformEnterTime = state.elapsed;
  state.player.x = WORLD.platformStartX;
  state.player.zone = 1;
  state.player.zoneFloat = 1;
  state.player.claim = RUN.claimStart;
  state.player.boardProgress = 0;
  state.player.charge = 0;
  state.player.hadSpot = false;
  state.player.canBoard = false;
  state.player.lostSpot = false;
  state.player.holding = false;
  state.alightPenalty = false;
  state.trainState = 'hidden';
  state.trainProgress = 0;
  state.doorsOpen = 0;
  state.cameraWarning = 0;
  state.protectWindow = 0;
  state.protectUsed = false;
  state.protectedActorId = null;
  state.player.spot = null;

  const scheduleIndex = RUN.trainSchedule.findIndex(
    (time: number) => time > state.elapsed - 3,
  );
  if (scheduleIndex === -1) {
    failRun(state, 'time');
    return;
  }
  state.trainIndex = scheduleIndex;
  state.nextTrainTime = RUN.trainSchedule[scheduleIndex] ?? RUN.limit;
  state.wave = scheduleIndex;
  rollDoorRead(state);
  addNotice(
    state,
    `Perkiraan pintu depan: zona ${zoneName(state.estimate)}. Jaga posisi di belakang garis kuning.`,
    'info',
    4,
  );
  if (waveIndex === 1 && state.elapsed >= RUN.trainSchedule[0] + 10) {
    addNotice(state, 'Kereta pertama sudah lewat. Ini gelombang terakhir.', 'warn', 3.2);
  }
}

function switchZone(state: SimState, targetZone: number): void {
  const zone = clamp(Math.round(targetZone), 0, 2);
  if (zone === state.player.zone) return;
  if (state.phase !== 'platform' && state.phase !== 'arrival' && state.phase !== 'board') return;
  state.player.zone = zone;
  state.player.charge = 0;
  state.player.boardProgress = state.phase === 'board' ? 0.05 : 0;
  state.player.claim = Math.max(0.25, state.player.claim - RUN.claimSwitchCost);
  state.cameraWarning = 0;
  state.protectWindow = 0;
  addNotice(state, `Pindah ke zona ${zoneName(zone)}. Posisi klaim turun.`, 'info', 1.8);
}

function computePulse(state: SimState): number {
  const waited = Math.max(0, state.elapsed - state.platformEnterTime);
  // A 2.4 s surge every 8 s; the first surge starts after a short grace.
  const cycle = (waited + 6) % 8;
  if (cycle >= 2.4) return 0;
  return Math.sin((cycle / 2.4) * Math.PI);
}

function updateZoneMovement(state: SimState, dt: number): void {
  state.player.zoneFloat = moveToward(state.player.zoneFloat, state.player.zone, dt * 3.5);
  state.player.x = moveToward(state.player.x, zoneX(state.player.zone), dt * 7);
}

function findVulnerableActor(state: SimState): Actor | null {
  return (
    state.actors.find(
      (actor) =>
        actor.zone === state.player.zone &&
        actor.vulnerable &&
        !actor.boarded &&
        !actor.protected,
    ) ?? null
  );
}

function hasAggressiveActor(state: SimState, zone: number): boolean {
  return state.actors.some(
    (actor) => actor.zone === zone && !actor.vulnerable && !actor.boarded && actor.aggression > 0.6,
  );
}

function protectVulnerable(state: SimState): void {
  const actor = findVulnerableActor(state);
  if (!actor) return;
  actor.protected = true;
  state.protectedActorId = actor.id;
  state.protectUsed = true;
  state.protectWindow = 0;
  state.cameraWarning = 0;
  state.player.gengsi += RUN.protectGengsi;
  state.player.energy -= RUN.protectCostEnergy;
  state.player.boardProgress = Math.max(0, state.player.boardProgress - 0.15);
  addNotice(state, 'Kamu kasih ruang. Gengsi +12, energi -20.', 'good', 3);
  checkMeters(state);
}

function beginArrival(state: SimState): void {
  state.phase = 'arrival';
  state.phaseTime = 0;
  state.trainRevealed = true;
  state.trainState = 'arriving';
  state.trainProgress = 0;
  state.doorsOpen = 0;
  state.player.hadSpot = state.player.claim >= RUN.claimSafeMin;
  state.player.canBoard = state.player.hadSpot;
  state.player.charge = 0;

  if (!state.player.hadSpot) {
    addNotice(state, 'Kamu terdesak ke belakang. Tunggu kereta berikutnya.', 'warn', 3.2);
    return;
  }

  if (state.player.zone < state.frontZone) {
    addNotice(
      state,
      `Pintu depan di zona ${zoneName(state.frontZone)}. Tidak ada pintu di sini—geser ke kanan.`,
      'warn',
      3.4,
    );
  } else {
    addNotice(
      state,
      `Pintu depan di zona ${zoneName(state.frontZone)}. Siap-siap.`,
      'info',
      3,
    );
  }
}

function beginAlight(state: SimState): void {
  state.phase = 'alight';
  state.phaseTime = 0;
  state.trainState = 'stopped';
  state.trainProgress = 1;
  state.doorsOpen = 0;
  state.alightPenalty = false;
  addNotice(state, 'Biar penumpang turun dulu.', 'info', 2.4);
}

function beginBoard(state: SimState): void {
  state.phase = 'board';
  state.phaseTime = 0;
  state.trainState = 'stopped';
  state.doorsOpen = 1;
  state.player.charge = 0;
  state.cameraWarning = 0;
  state.protectUsed = false;
  state.protectedActorId = null;
  state.protectWindow = 0;

  if (!state.player.hadSpot) {
    state.player.canBoard = false;
    addNotice(state, 'Kamu tidak dapat posisi. Tunggu kereta berikutnya.', 'warn', 3);
    return;
  }

  state.player.canBoard = true;
  state.player.boardProgress =
    0.08 + state.player.claim * RUN.boardStartClaim;

  if (state.player.zone < state.frontZone) {
    addNotice(
      state,
      'Tidak ada pintu di zona ini. Geser ke kanan, sekarang.',
      'warn',
      3,
    );
    return;
  }

  if (findVulnerableActor(state) && hasAggressiveActor(state, state.player.zone)) {
    state.protectWindow = 2.6;
    addNotice(state, 'Ada yang mau nyerobot ibu/anak. Lepas untuk lindungi.', 'warn', 3.4);
  } else {
    addNotice(state, 'Pintu depan. Rebut posisi pertama.', 'info', 2.6);
  }
}

function beginMissed(state: SimState): void {
  state.phase = 'missed';
  state.phaseTime = 0;
  state.trainState = 'closing';
  state.doorsOpen = 0;
  state.player.holding = false;
  state.player.canBoard = false;
  addNotice(
    state,
    state.wave === 0 ? 'Ketinggalan. Kereta berikutnya sebentar lagi.' : 'Kereta terakhir lewat.',
    'warn',
    3,
  );
}

function prepareSecondWave(state: SimState): void {
  for (const actor of state.actors) {
    actor.boardProgress = actor.initialBoardProgress;
    actor.boarded = false;
    actor.boardTime = 0;
    actor.protected = false;
  }
  state.elapsed = Math.max(state.elapsed, RUN.secondWaveFastForward);
  state.trainIndex = 1;
  state.nextTrainTime = RUN.trainSchedule[1] ?? RUN.limit;
  state.wave = 1;
  state.crowdDensity = 1.35;
  enterPlatform(state, 1);
  if (state.phase === 'platform') {
    addNotice(state, 'Peron makin padat. Posisi makin mahal.', 'warn', 3.2);
  }
}

function boardPlayer(state: SimState): void {
  const rank =
    1 + state.actors.filter((actor) => actor.zone === state.player.zone && actor.boarded).length;
  state.player.boarded = true;
  state.player.rank = rank;
  state.player.carRank = state.player.zone - state.frontZone;
  state.boardedAt = state.elapsed;
  state.phase = 'inside';
  state.phaseTime = 0;
  state.trainState = 'closing';
  state.doorsOpen = 0;
  state.player.holding = false;
  state.insideTimer = RUN.insideChoice;
  state.seatChoice = rank === 1;
  state.seatAvailable = rank === 1;
  state.seatTimer = RUN.insideChoice;
  state.player.spot = null;

  if (rank === 1) {
    addNotice(state, 'Masuk pertama! Pilih tempat.', 'good', 3.2);
  } else {
    state.player.spot =
      state.player.carRank === 0 ? 'door' : rank > 4 ? 'deep' : 'pole';
    state.insideTimer = 2.4;
    addNotice(state, `Kamu masuk ke-${rank}. Dapat tempat berdiri.`, 'info', 2.6);
  }
}

function finishInside(state: SimState, choice: 'seat' | 'stand' | null): void {
  if (choice === 'seat' && state.seatAvailable) {
    state.player.spot = 'seat';
    state.player.energy = clamp(state.player.energy + 20, 0, RUN.maxEnergy);
  } else if (choice === 'stand') {
    state.player.spot = state.player.carRank === 0 ? 'door' : 'pole';
  } else {
    state.player.spot =
      state.player.carRank === 0 ? 'door' : state.player.rank > 4 ? 'deep' : 'pole';
  }
  finishSuccess(state);
}

function updateInside(state: SimState, dt: number, input: SimInput): void {
  state.phaseTime += dt;
  if (!state.seatChoice) {
    state.insideTimer -= dt;
    if (state.insideTimer <= 0) finishInside(state, null);
    return;
  }

  if (input.seat === 'seat' || input.seat === 'stand') {
    finishInside(state, input.seat);
    return;
  }

  state.seatTimer -= dt;
  state.insideTimer -= dt;
  if (state.seatTimer <= 0 || state.insideTimer <= 0) {
    finishInside(state, 'stand');
  }
}

function updatePlatform(state: SimState, dt: number, input: SimInput): void {
  if (state.nextTrainTime - state.elapsed <= 3) {
    beginArrival(state);
    return;
  }

  const pulse = computePulse(state);
  state.crowdPulse = pulse;
  updateZoneMovement(state, dt);

  if (input.targetZone !== state.player.zone) switchZone(state, input.targetZone);

  const pushedByCrowd =
    !state.player.holding && pulse > 0.8 && state.player.claim > 0.9;

  if (state.player.holding) {
    state.player.claim +=
      (pulse > 0.25 ? RUN.claimHoldPulse : RUN.claimHoldCalm) * dt;
    state.player.energy -= RUN.claimEnergy * dt;
  } else {
    state.player.claim -= (RUN.claimDriftCalm + pulse * RUN.claimDriftPulse) * dt;
    if (pushedByCrowd) {
      // The crowd can carry you over the line. It is not a choice, so it is
      // not a gengsi offence; the yellow line still stops you at the edge.
      state.player.claim += pulse * 0.135 * dt;
    }
  }

  if (state.player.claim > 1) {
    if (pushedByCrowd) {
      state.player.claim = 0.98;
      addNotice(state, 'Kamu terdorong kerumunan. Bukan salahmu.', 'info', 2.2);
    } else {
      state.player.claim = 0.55;
      state.player.gengsi -= RUN.claimLinePenalty;
      state.player.energy -= 8;
      state.whistle = 1.4;
      addNotice(
        state,
        'Lewat garis kuning sebelum kereta berhenti. Peluit! Gengsi -15.',
        'warn',
        3,
      );
    }
  }

  if (state.player.claim < RUN.claimLost) {
    state.player.claim = 0.3;
    state.player.lostSpot = true;
    state.player.gengsi -= RUN.claimLostPenalty;
    addNotice(state, 'Kamu terdesak ke belakang. Gengsi -5.', 'warn', 2.4);
  }

  state.player.claim = clamp(state.player.claim, 0, 1);
  state.player.x = moveToward(state.player.x, zoneX(state.player.zone), dt * 7);
  checkMeters(state);
}

function updateArrival(state: SimState, dt: number, input: SimInput): void {
  updateZoneMovement(state, dt);
  if (input.targetZone !== state.player.zone) switchZone(state, input.targetZone);
  state.trainProgress = Math.min(1, state.trainProgress + dt / 2.2);
  if (state.trainProgress >= 1) state.trainState = 'stopped';

  if (state.elapsed >= state.nextTrainTime) {
    beginAlight(state);
    return;
  }
  if (state.player.zone < state.frontZone) {
    // Keep the warning visible; the player may still scramble.
    state.player.canBoard = state.player.hadSpot;
  }
  checkMeters(state);
}

function updateAlight(state: SimState, dt: number, input: SimInput): void {
  updateZoneMovement(state, dt);
  if (input.targetZone !== state.player.zone) switchZone(state, input.targetZone);
  state.doorsOpen = Math.min(1, state.doorsOpen + dt / 0.35);

  if (state.player.holding && !state.alightPenalty) {
    state.alightPenalty = true;
    state.player.gengsi -= RUN.alightPushGengsi;
    state.player.energy -= 4;
    state.player.boardProgress = 0;
    addNotice(state, 'Jangan dorong yang turun. Gengsi -8.', 'warn', 2.8);
  }

  if (state.phaseTime >= RUN.alightDuration) {
    beginBoard(state);
    return;
  }
  checkMeters(state);
}

function updateBoard(
  state: SimState,
  dt: number,
  input: SimInput,
  released: boolean,
): void {
  state.doorsOpen = 1;
  updateZoneMovement(state, dt);

  const releaseCharge = state.player.charge;

  if (input.targetZone !== state.player.zone) switchZone(state, input.targetZone);

  const hasDoor = state.player.zone >= state.frontZone;
  const vulnerable = hasDoor ? findVulnerableActor(state) : null;
  const vulnerableNear =
    vulnerable !== null && vulnerable.boardProgress > state.player.boardProgress - 0.15;
  const aggressiveNear = hasAggressiveActor(state, state.player.zone);

  state.protectWindow = Math.max(0, state.protectWindow - dt);

  if (released) {
    state.player.charge = 0;
    if (state.protectWindow > 0 && !state.protectUsed) {
      protectVulnerable(state);
      if (state.phase === 'result') return;
    } else if (state.cameraWarning > 0.04) {
      state.player.gengsi -= RUN.cameraCancelGengsi;
      state.cameraWarning = 0;
      addNotice(state, 'Kamu berhenti. Gengsi -10.', 'warn', 2.6);
      checkMeters(state);
      if (state.phase === 'result') return;
    } else if (releaseCharge >= 0.99) {
      state.player.boardProgress = Math.min(1, state.player.boardProgress + RUN.boardHentak);
      state.player.energy -= RUN.hentakEnergy;
      state.burst = 0.45;
      if (vulnerableNear) state.cameraWarning += 0.5;
      addNotice(state, 'Hentak! Kamu nyerobot.', 'info', 1.8);
    }
  }

  if (state.player.holding && state.player.canBoard && hasDoor) {
    let rate = RUN.boardRateBase + state.player.claim * RUN.boardRateClaim;
    if (state.player.energy < 25) rate *= 0.85;
    if (aggressiveNear) rate = Math.max(0.18, rate - 0.04);

    let effectiveRate = rate * state.crowdDensity;
    state.player.boardProgress = Math.min(1, state.player.boardProgress + effectiveRate * dt);
    state.player.energy -= RUN.boardEnergy * dt;
    state.player.charge = Math.min(1, state.player.charge + dt / 1.05);

    if (vulnerableNear) {
      state.cameraWarning += dt / RUN.cameraWarningTime;
      if (state.cameraWarning >= 1) {
        triggerViral(state);
        return;
      }
    } else {
      state.cameraWarning = Math.max(0, state.cameraWarning - dt * 2);
    }

    if (state.player.boardProgress >= 1) {
      boardPlayer(state);
      return;
    }
  } else if (!state.player.holding) {
    state.player.boardProgress = Math.max(0, state.player.boardProgress - 0.018 * dt);
    state.cameraWarning = Math.max(0, state.cameraWarning - dt * 1.8);
    if (!released) state.player.charge = 0;
  }

  for (const actor of state.actors) {
    if (actor.boarded || actor.zone < state.frontZone) continue;
    let rate = actor.boardRate * state.crowdDensity;
    if (actor.protected) rate *= 0.2;
    actor.boardProgress = Math.min(1, actor.boardProgress + rate * dt);
    if (actor.boardProgress >= 1) {
      actor.boarded = true;
      actor.boardTime = state.elapsed;
    }
  }

  if (state.player.holding && state.player.canBoard && hasDoor && state.player.boardProgress >= 1) {
    boardPlayer(state);
    return;
  }

  if (state.phaseTime >= RUN.boardWindow) {
    state.doorsOpen = 0;
    state.player.holding = false;
    if (state.wave === 0) {
      beginMissed(state);
    } else {
      failRun(state, 'time');
    }
    return;
  }

  checkMeters(state);
}

function updateMissed(state: SimState, dt: number): void {
  state.phaseTime += dt;
  state.doorsOpen = 0;
  if (state.phaseTime < 2.4) return;

  if (state.wave === 0) {
    prepareSecondWave(state);
  } else {
    failRun(state, 'time');
  }
}

export function createSimulation(seed = 20261020): SimState {
  const state: SimState = {
    seed,
    rng: seed >>> 0,
    phase: 'ready',
    phaseTime: 0,
    elapsed: 0,
    runLimit: RUN.limit,
    player: {
      energy: RUN.startEnergy,
      gengsi: RUN.maxGengsi,
      rupiah: RUN.startMoney,
      zone: 1,
      zoneFloat: 1,
      x: WORLD.entranceX,
      claim: RUN.claimStart,
      boardProgress: 0,
      charge: 0,
      boarded: false,
      rank: 0,
      carRank: -1,
      spot: null,
      hadSpot: false,
      canBoard: false,
      lostSpot: false,
      holding: false,
    },
    actors: [],
    trainSchedule: RUN.trainSchedule,
    trainIndex: 0,
    nextTrainTime: 0,
    frontZone: -1,
    estimate: 1,
    trainRevealed: false,
    trainProgress: 0,
    trainState: 'hidden',
    doorsOpen: 0,
    platformEnterTime: 0,
    crowdPulse: 0,
    crowdDensity: 1,
    gate: {
      active: false,
      wait: 0,
      paid: false,
      cutting: false,
    },
    coffee: {
      available: false,
      bought: false,
      timer: 0,
    },
    notices: [],
    cameraWarning: 0,
    protectWindow: 0,
    protectUsed: false,
    protectedActorId: null,
    burst: 0,
    whistle: 0,
    viral: false,
    failReason: null,
    result: null,
    seatChoice: false,
    seatAvailable: false,
    seatTimer: 0,
    insideTimer: 0,
    alightPenalty: false,
    wave: 0,
    boardedAt: 0,
  };
  generateActors(state);
  rollDoorRead(state);
  return state;
}

export function startRun(state: SimState): void {
  if (state.phase !== 'ready') return;
  state.phase = 'approach';
  state.phaseTime = 0;
  state.elapsed = 0;
  state.player.holding = false;
  addNotice(state, 'Baca papan. Jaga posisi. Jangan sampai ketinggalan.', 'info', 3.2);
}

export function updateNoticeText(state: SimState): string | null {
  return activeNotice(state)?.text ?? null;
}

export function updateNoticeTone(state: SimState): 'info' | 'warn' | 'good' | null {
  return activeNotice(state)?.tone ?? null;
}

export function stepSimulation(state: SimState, dt: number, input: SimInput): void {
  if (state.phase === 'ready' || state.phase === 'result') return;
  const step = Math.min(Math.max(dt, 0), 0.05);
  if (step === 0) return;

  if (state.phase === 'inside') {
    updateInside(state, step, input);
    return;
  }

  state.elapsed += step;
  state.phaseTime += step;
  state.whistle = Math.max(0, state.whistle - step);
  state.burst = Math.max(0, state.burst - step);
  state.notices = state.notices.filter((notice) => notice.until > state.elapsed - 1);

  const previousHolding = state.player.holding;
  const hold = input.hold && state.player.energy > 0.4;
  state.player.holding = hold;
  const released = previousHolding && !hold;

  switch (state.phase) {
    case 'approach': {
      const t = Math.min(1, state.phaseTime / RUN.approachDuration);
      state.player.x = lerp(WORLD.entranceX, WORLD.gateX, t);
      if (t >= 1) enterGate(state);
      break;
    }
    case 'gate': {
      state.player.x = WORLD.gateX;
      if (state.player.holding) {
        state.gate.wait -= step * RUN.gateCutMultiplier;
        state.player.energy -= RUN.gateCutEnergy * step;
        state.player.gengsi -= RUN.gateCutGengsi * step;
        if (!state.gate.cutting) {
          state.gate.cutting = true;
          addNotice(state, 'Kamu nyerobot antrean. Gengsi turun.', 'warn', 2.4);
        }
      } else {
        state.gate.wait -= step;
      }
      if (state.gate.wait <= 0) {
        enterConcourse(state);
        addNotice(state, 'Gerbang terbuka. Jangan lupa kopi?', 'good', 2.2);
      }
      checkMeters(state);
      break;
    }
    case 'concourse': {
      const t = Math.min(1, state.phaseTime / RUN.concourseDuration);
      state.player.x = lerp(WORLD.gateX, WORLD.platformStartX, t);
      state.coffee.timer = Math.max(0, state.coffee.timer - step);
      if (state.coffee.timer <= 0) state.coffee.available = false;
      if (
        input.coffee &&
        state.coffee.available &&
        !state.coffee.bought &&
        state.player.rupiah >= RUN.coffeeCost
      ) {
        state.coffee.bought = true;
        state.coffee.available = false;
        state.player.rupiah -= RUN.coffeeCost;
        state.player.energy = clamp(
          state.player.energy + RUN.coffeeEnergy,
          0,
          RUN.maxEnergy,
        );
        state.player.gengsi = clamp(
          state.player.gengsi + RUN.coffeeGengsi,
          0,
          RUN.maxGengsi,
        );
        state.elapsed += RUN.coffeeTimePenalty;
        addNotice(
          state,
          'Kopi Subuh: energi +40, gengsi +8, Rp -10.000, waktu -18 detik.',
          'good',
          3.2,
        );
      }
      if (t >= 1) enterPlatform(state, 0);
      checkMeters(state);
      break;
    }
    case 'platform':
      updatePlatform(state, step, input);
      break;
    case 'arrival':
      updateArrival(state, step, input);
      break;
    case 'alight':
      updateAlight(state, step, input);
      break;
    case 'board':
      updateBoard(state, step, input, released);
      break;
    case 'missed':
      updateMissed(state, step);
      break;
  }

  if (state.elapsed >= RUN.limit) {
    failRun(state, 'time');
  }
  if (state.phase === 'platform' || state.phase === 'arrival') {
    state.crowdPulse = computePulse(state);
  }
}
