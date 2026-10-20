import '../style.css';
import {
  createArenaInput,
  createArenaState,
  resetArena,
  stepArena,
  type ArenaInput,
  type ArenaState,
} from './sim';
import { ArenaHud } from './hud';
import { ARENA_ZOOM_MAX, ARENA_ZOOM_MIN, ArenaWorld } from './world';

const app = document.getElementById('app');
const canvas = document.getElementById('game');
const ui = document.getElementById('ui');

if (!(app instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement) || !(ui instanceof HTMLElement)) {
  throw new Error('Arena shell is missing #app, #game, or #ui');
}

const appElement: HTMLElement = app;
const canvasElement: HTMLCanvasElement = canvas;
const uiElement: HTMLElement = ui;

const params = new URLSearchParams(window.location.search);
const debug = params.has('debug');
const fixedStep = 1 / 60;

let state: ArenaState = createArenaState();
let paused = false;
let debugPaused = false;
let stickX = 0;
let stickZ = 0;
let hudHold = false;
let hudPushHeld = false;
let pushTapUntil = 0;
const keys = new Set<string>();
let lastFrame = performance.now() / 1000;
let viralFrame: string | null = null;
let zoom = ARENA_ZOOM_MIN;
let accumulator = 0;
let hudAccumulator = 0;
let frames = 0;
let fps = 60;
let fpsStart = lastFrame;
let world: ArenaWorld | null = null;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function currentInput(): ArenaInput {
  let keyX = 0;
  let keyZ = 0;
  if (keys.has('KeyD') || keys.has('ArrowRight')) keyX += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) keyX -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) keyZ += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) keyZ -= 1;
  return createArenaInput({
    moveX: clamp(stickX + keyX, -1, 1),
    moveZ: clamp(stickZ + keyZ, -1, 1),
    push: hudPushHeld || keys.has('KeyJ') || performance.now() / 1000 < pushTapUntil,
    hold: hudHold || keys.has('KeyK') || keys.has('Space'),
  });
}

function showFatal(message: string): void {
  if (document.getElementById('webgl-error')) return;
  const error = document.createElement('div');
  error.id = 'webgl-error';
  error.className = 'is-visible';
  error.innerHTML = `
    <div>
      <h1 style="margin:0 0 8px;font-size:24px;">Tidak bisa menjalankan 3D.</h1>
      <p style="margin:0;color:rgba(244,235,221,.65);font-size:13px;line-height:1.5;">
        ${message}<br>Arena ini butuh WebGL 2. Coba browser Chromium terbaru atau muat ulang.
      </p>
    </div>
  `;
  appElement.appendChild(error);
}

function reset(): void {
  resetArena(state);
  viralFrame = null;
  hudPushHeld = false;
  pushTapUntil = 0;
  keys.clear();
  hud?.reset();
}

const hud = new ArenaHud(uiElement, {
  onMove: (x, z) => {
    stickX = x;
    stickZ = z;
  },
  onPush: (held) => {
    hudPushHeld = held;
    if (held) pushTapUntil = performance.now() / 1000 + 0.06;
  },
  onHold: (held) => {
    hudHold = held;
  },
  onReset: reset,
  onZoom: (delta) => setZoom(zoom + delta),
});

function setZoom(value: number): void {
  zoom = clamp(value, ARENA_ZOOM_MIN, ARENA_ZOOM_MAX);
  world?.setZoom(zoom);
  hud.setZoom(zoom, ARENA_ZOOM_MIN, ARENA_ZOOM_MAX);
}

try {
  world = new ArenaWorld(canvasElement);
  world.setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  setZoom(zoom);
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error);
  showFatal(detail);
}

function resize(): void {
  world?.resize(appElement.clientWidth, appElement.clientHeight);
}

if (typeof ResizeObserver !== 'undefined') {
  const observer = new ResizeObserver(resize);
  observer.observe(appElement);
} else {
  window.addEventListener('resize', resize);
}
window.addEventListener('resize', resize);
resize();

const activePointers = new Map<number, { x: number; y: number }>();
let pinchStartDistance = 0;
let pinchStartZoom = zoom;

function pointerDistance(): number {
  const points = Array.from(activePointers.values());
  const first = points[0];
  const second = points[1];
  if (!first || !second) return 0;
  return Math.hypot(second.x - first.x, second.y - first.y);
}

canvasElement.addEventListener('pointerdown', (event) => {
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (activePointers.size === 2) {
    pinchStartDistance = pointerDistance();
    pinchStartZoom = zoom;
  }
  if (event.pointerType !== 'mouse') canvasElement.setPointerCapture(event.pointerId);
});

canvasElement.addEventListener('pointermove', (event) => {
  if (!activePointers.has(event.pointerId)) return;
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (activePointers.size === 2 && pinchStartDistance > 0) {
    const distance = pointerDistance();
    if (distance > 0) setZoom(pinchStartZoom * (distance / pinchStartDistance));
  }
});

function releasePointer(event: PointerEvent): void {
  activePointers.delete(event.pointerId);
  if (activePointers.size < 2) pinchStartDistance = 0;
}

canvasElement.addEventListener('pointerup', releasePointer);
canvasElement.addEventListener('pointercancel', releasePointer);
canvasElement.addEventListener('lostpointercapture', releasePointer);
canvasElement.addEventListener('pointerleave', (event) => {
  if (event.pointerType === 'mouse') releasePointer(event);
});
canvasElement.addEventListener(
  'wheel',
  (event) => {
    event.preventDefault();
    setZoom(zoom + (event.deltaY < 0 ? 0.2 : -0.2));
  },
  { passive: false },
);

const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
const applyReducedMotion = (): void => {
  document.body.classList.toggle('reduced-motion', reducedMotionMedia.matches);
  world?.setReducedMotion(reducedMotionMedia.matches);
};
applyReducedMotion();
if (typeof reducedMotionMedia.addEventListener === 'function') {
  reducedMotionMedia.addEventListener('change', applyReducedMotion);
}

function tick(): void {
  const now = performance.now() / 1000;
  const delta = Math.min(0.05, Math.max(0, now - lastFrame));
  lastFrame = now;
  frames += 1;
  if (now - fpsStart >= 1) {
    fps = frames / (now - fpsStart);
    frames = 0;
    fpsStart = now;
  }

  if (!paused && !debugPaused) {
    accumulator += delta;
    let guard = 0;
    while (accumulator >= fixedStep && guard < 6 && state.gameOver === null) {
      stepArena(state, fixedStep, currentInput());
      accumulator -= fixedStep;
      guard += 1;
    }
  }

  world?.update(state, now);
  world?.render();

  if (state.gameOver === 'viral' && viralFrame === null) {
    const frame = world?.captureFrame() ?? null;
    if (frame) {
      viralFrame = frame;
      hud.setViralFrame(frame);
    }
  }

  hudAccumulator += delta;
  if (hudAccumulator >= 0.1) {
    hudAccumulator = 0;
    hud.update(state);
  }

  if (debug) {
    document.getElementById('debug')?.replaceChildren(
      document.createTextNode(
        `${fps.toFixed(0)} fps · ${world?.drawCalls ?? 0} draw · ` +
          `P (${state.player.x.toFixed(1)}, ${state.player.z.toFixed(1)}) · ` +
          `A (${state.passengers[0]?.x.toFixed(1) ?? '—'}, ${state.passengers[0]?.z.toFixed(1) ?? '—'})`,
      ),
    );
  }

  requestAnimationFrame(tick);
}

window.addEventListener('keydown', (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
  if (
    event.code === 'ArrowUp' ||
    event.code === 'ArrowDown' ||
    event.code === 'ArrowLeft' ||
    event.code === 'ArrowRight' ||
    event.code === 'Space'
  ) {
    event.preventDefault();
  }
  if (event.code === 'KeyR' && !event.repeat) {
    reset();
    return;
  }
  if ((event.code === 'KeyZ' || event.code === 'Equal' || event.code === 'NumpadAdd') && !event.repeat) {
    setZoom(zoom + 0.2);
    return;
  }
  if ((event.code === 'KeyX' || event.code === 'Minus' || event.code === 'NumpadSubtract') && !event.repeat) {
    setZoom(zoom - 0.2);
    return;
  }
  if (event.code === 'KeyJ' && !event.repeat) {
    pushTapUntil = performance.now() / 1000 + 0.06;
  }
  keys.add(event.code);
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.code);
});

window.addEventListener('blur', () => {
  keys.clear();
  hudHold = false;
  hudPushHeld = false;
});

if (debug) {
  window.__ARENA__ = {
    state: () => state,
    reset,
    step: (seconds: number, overrides: Partial<ArenaInput> = {}) => {
      const steps = Math.max(0, Math.ceil(seconds / fixedStep));
      const input = createArenaInput(overrides);
      for (let index = 0; index < steps; index += 1) {
        stepArena(state, fixedStep, input);
      }
      world?.update(state, performance.now() / 1000);
      hud.update(state);
    },
    setPaused: (value: boolean) => {
      debugPaused = value;
    },
    drawCalls: () => world?.drawCalls ?? 0,
    setZoom: (value: number) => setZoom(value),
    zoom: () => zoom,
  };
}

declare global {
  interface Window {
    __ARENA__?: {
      state: () => ArenaState;
      reset: () => void;
      step: (seconds: number, overrides?: Partial<ArenaInput>) => void;
      setPaused: (value: boolean) => void;
      drawCalls: () => number;
      setZoom: (value: number) => void;
      zoom: () => number;
    };
  }
}

requestAnimationFrame(tick);
