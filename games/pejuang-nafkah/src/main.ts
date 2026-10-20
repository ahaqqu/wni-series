import './style.css';
import { createInput, createSimulation, startRun, stepSimulation } from './sim/simulation';
import type { SeatChoice, SimInput, SimState } from './sim/types';
import { GameWorld } from './render/world';
import { Hud } from './ui/hud';

const app = document.getElementById('app');
const canvas = document.getElementById('game');
const ui = document.getElementById('ui');

if (!(app instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement) || !(ui instanceof HTMLElement)) {
  throw new Error('Game shell is missing #app, #game, or #ui');
}

const appElement: HTMLElement = app;
const canvasElement: HTMLCanvasElement = canvas;
const uiElement: HTMLElement = ui;

const params = new URLSearchParams(window.location.search);
const debug = params.has('debug');
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) && seedParam > 0 ? Math.floor(seedParam) : 20261020;
const fixedStep = 1 / 60;

let state: SimState = createSimulation(seed);
let hold = false;
let targetZone = 1;
let pendingCoffee = false;
let pendingSeat: SeatChoice | null = null;
let hud: Hud | null = null;
let world: GameWorld | null = null;
let paused = false;
let debugPaused = false;
let lastFrame = performance.now() / 1000;
let accumulator = 0;
let hudAccumulator = 0;
let frames = 0;
let fps = 60;
let fpsStart = lastFrame;
let fatalShown = false;

function requestZone(delta: number): void {
  if (
    state.phase !== 'platform' &&
    state.phase !== 'arrival' &&
    state.phase !== 'board'
  ) {
    return;
  }
  targetZone = Math.min(2, Math.max(0, targetZone + delta));
}

function requestZoneTo(zone: number): void {
  if (
    state.phase !== 'platform' &&
    state.phase !== 'arrival' &&
    state.phase !== 'board'
  ) {
    return;
  }
  targetZone = Math.min(2, Math.max(0, Math.round(zone)));
}

function beginRun(): void {
  if (!world || fatalShown) return;
  const retry = state.phase === 'result';
  if (retry) {
    state = createSimulation(seed);
    targetZone = 1;
  }
  if (state.phase === 'ready') startRun(state);
  hold = false;
  pendingCoffee = false;
  pendingSeat = null;
  hud?.reset();
  hud?.update(state, performance.now() / 1000, fps, world.drawCalls);
}

function showFatal(message: string): void {
  fatalShown = true;
  if (document.getElementById('webgl-error')) return;
  const error = document.createElement('div');
  error.id = 'webgl-error';
  error.className = 'is-visible';
  error.innerHTML = `
    <div>
      <h1 style="margin:0 0 8px;font-size:24px;">Tidak bisa menjalankan 3D.</h1>
      <p style="margin:0;color:rgba(244,235,221,.65);font-size:13px;line-height:1.5;">
        ${message}<br>Prototipe ini butuh WebGL 2. Coba browser Chromium terbaru atau muat ulang.
      </p>
    </div>
  `;
  appElement.appendChild(error);
}

hud = new Hud(uiElement, {
  onStart: beginRun,
  onRetry: beginRun,
  onHold: (nextHold) => {
    hold = nextHold;
  },
  onZone: requestZone,
  onZoneTo: requestZoneTo,
  onCoffee: () => {
    if (state.phase === 'concourse' && state.coffee.available) pendingCoffee = true;
  },
  onSeat: (choice) => {
    if (state.phase === 'inside' && state.seatChoice) pendingSeat = choice;
  },
});

try {
  world = new GameWorld(canvasElement);
  world.setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error);
  showFatal(detail);
}

const startButton = document.getElementById('start');
startButton?.focus({ preventScroll: true });

function resize(): void {
  if (!world) return;
  world.resize(appElement.clientWidth, appElement.clientHeight);
}

if (typeof ResizeObserver !== 'undefined') {
  const observer = new ResizeObserver(resize);
  observer.observe(appElement);
} else {
  window.addEventListener('resize', resize);
}
window.addEventListener('resize', resize);
resize();

const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
const applyReducedMotion = (): void => {
  document.body.classList.toggle('reduced-motion', reducedMotionMedia.matches);
  world?.setReducedMotion(reducedMotionMedia.matches);
};
applyReducedMotion();
reducedMotionMedia.addEventListener?.('change', applyReducedMotion);

window.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  if (event.code === 'Space') {
    if (state.phase === 'ready' || state.phase === 'result' || state.phase === 'inside') return;
    event.preventDefault();
    hold = true;
    return;
  }
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
    event.preventDefault();
    requestZone(-1);
    return;
  }
  if (event.code === 'ArrowRight' || event.code === 'KeyD') {
    event.preventDefault();
    requestZone(1);
    return;
  }
  if (event.code === 'KeyC') {
    if (state.phase === 'concourse' && state.coffee.available) pendingCoffee = true;
    return;
  }
  if (event.code === 'Digit1') {
    if (state.phase === 'inside' && state.seatChoice) pendingSeat = 'seat';
    return;
  }
  if (event.code === 'Digit2') {
    if (state.phase === 'inside' && state.seatChoice) pendingSeat = 'stand';
    return;
  }
  if (event.code === 'KeyR' && state.phase === 'result') {
    beginRun();
  }
});

window.addEventListener('keyup', (event) => {
  if (event.code === 'Space') {
    hold = false;
    event.preventDefault();
  }
});

window.addEventListener('blur', () => {
  hold = false;
});

document.addEventListener('visibilitychange', () => {
  paused = document.hidden;
  lastFrame = performance.now() / 1000;
  accumulator = 0;
});

canvasElement.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  showFatal('Konteks WebGL hilang saat game berjalan.');
});

function tick(nowMs: number): void {
  requestAnimationFrame(tick);
  const now = nowMs / 1000;
  const dt = Math.min(0.1, Math.max(0, now - lastFrame));
  lastFrame = now;
  if (paused) return;

  frames += 1;
  if (now - fpsStart >= 0.5) {
    fps = frames / (now - fpsStart);
    frames = 0;
    fpsStart = now;
  }

  if (!debugPaused && state.phase !== 'result' && state.phase !== 'ready') {
    accumulator += dt;
    let steps = 0;
    while (accumulator >= fixedStep && steps < 5) {
      const stepInput: SimInput = createInput({
        hold,
        targetZone,
        coffee: pendingCoffee,
        seat: pendingSeat,
      });
      stepSimulation(state, fixedStep, stepInput);
      pendingCoffee = false;
      pendingSeat = null;
      accumulator -= fixedStep;
      steps += 1;
      const phaseAfterStep: string = state.phase;
      if (phaseAfterStep === 'result') break;
    }
    if (steps === 5) accumulator = 0;
  } else {
    accumulator = 0;
  }

  if (world) {
    world.update(state, now, dt);
    world.render();
  }

  hudAccumulator += dt;
  if (hud && hudAccumulator >= 0.1) {
    hud.update(state, now, fps, world?.drawCalls ?? 0);
    hudAccumulator = 0;
  }
}

hud.update(state, performance.now() / 1000, fps, world?.drawCalls ?? 0);
if (debug) {
  hud.setDebug(true);
  window.__PEJUANG__ = {
    state: () => state,
    start: beginRun,
    advance: (seconds: number, overrides: Partial<SimInput> = {}) => {
      const input = createInput({
        targetZone: state.player.zone,
        ...overrides,
      });
      const steps = Math.max(0, Math.ceil(seconds / fixedStep));
      for (let index = 0; index < steps; index += 1) {
        if (state.phase === 'ready') beginRun();
        stepSimulation(state, fixedStep, input);
        const phaseAfterStep: string = state.phase;
      if (phaseAfterStep === 'result') break;
      }
      hud?.update(state, performance.now() / 1000, fps, world?.drawCalls ?? 0);
    },
    updateHud: () => {
      hud?.update(state, performance.now() / 1000, fps, world?.drawCalls ?? 0);
    },
    setPaused: (value: boolean) => {
      debugPaused = value;
    },
    drawCalls: () => world?.drawCalls ?? 0,
  };
}

declare global {
  interface Window {
    __PEJUANG__?: {
      state: () => SimState;
      start: () => void;
      advance: (seconds: number, overrides?: Partial<SimInput>) => void;
      updateHud: () => void;
      setPaused: (value: boolean) => void;
      drawCalls: () => number;
    };
  }
}

requestAnimationFrame(tick);
