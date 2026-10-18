import { clamp, lerp } from '../utils/math';

export type InputMode = 'idle' | 'playing' | 'brake' | 'brace';

export interface InputState {
  steerX: number;
  brake: boolean;
  pointerDown: boolean;
  pointerX: number;
  pointerY: number;
}

export class InputController {
  readonly state: InputState = {
    steerX: 0,
    brake: false,
    pointerDown: false,
    pointerX: 0,
    pointerY: 0,
  };

  private targetSteer = 0;
  private active = false;
  private readonly onDown?: () => void;
  private readonly onUp?: () => void;

  constructor(
    private readonly element: HTMLElement,
    handlers?: { onDown?: () => void; onUp?: () => void },
  ) {
    this.onDown = handlers?.onDown;
    this.onUp = handlers?.onUp;
    this.bind();
  }

  setActive(active: boolean): void {
    this.active = active;
    if (!active) {
      this.state.brake = false;
      this.state.pointerDown = false;
      this.targetSteer = 0;
    }
  }

  private bind(): void {
    const el = this.element;
    el.style.touchAction = 'none';

    const getPos = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: ((e.clientY - rect.top) / rect.height) * 2 - 1,
      };
    };

    const down = (e: PointerEvent) => {
      if (!this.active) return;
      el.setPointerCapture(e.pointerId);
      const p = getPos(e);
      this.state.pointerDown = true;
      this.state.pointerX = p.x;
      this.state.pointerY = p.y;
      this.state.brake = true; // hold to brake / brace
      this.targetSteer = clamp(p.x * 1.15, -1, 1);
      this.onDown?.();
      e.preventDefault();
    };

    const move = (e: PointerEvent) => {
      if (!this.active || !this.state.pointerDown) return;
      const p = getPos(e);
      this.state.pointerX = p.x;
      this.state.pointerY = p.y;
      this.targetSteer = clamp(p.x * 1.15, -1, 1);
      e.preventDefault();
    };

    const up = (e: PointerEvent) => {
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      this.state.pointerDown = false;
      this.state.brake = false;
      this.targetSteer = 0;
      this.onUp?.();
    };

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
    window.addEventListener('blur', () => {
      this.state.pointerDown = false;
      this.state.brake = false;
      this.targetSteer = 0;
    });

    // keyboard assist
    window.addEventListener('keydown', (e) => {
      if (!this.active) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.targetSteer = -1;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.targetSteer = 1;
      if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'KeyS') this.state.brake = true;
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'KeyA' || e.code === 'KeyD') {
        this.targetSteer = 0;
      }
      if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'KeyS') this.state.brake = false;
    });
  }

  update(delta: number): void {
    this.state.steerX = lerp(this.state.steerX, this.targetSteer, clamp(delta * 10, 0, 1));
  }

  dispose(): void {
    this.setActive(false);
  }
}
