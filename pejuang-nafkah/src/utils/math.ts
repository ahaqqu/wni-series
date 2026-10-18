export type Easing = (t: number) => number;

export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const easeOutCubic: Easing = (t) => 1 - Math.pow(1 - t, 3);
export const easeOutBack: Easing = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const easeInOutQuad: Easing = (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

interface ActiveTween {
  elapsed: number;
  duration: number;
  easing: Easing;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
}

export class TweenManager {
  private readonly tweens: ActiveTween[] = [];

  tween(
    durationSec: number,
    onUpdate: (value: number) => void,
    easing: Easing = easeOutCubic,
    onComplete?: () => void,
  ): void {
    this.tweens.push({ elapsed: 0, duration: Math.max(0.001, durationSec), easing, onUpdate, onComplete });
  }

  update(delta: number): void {
    for (let i = this.tweens.length - 1; i >= 0; i -= 1) {
      const t = this.tweens[i];
      t.elapsed += delta;
      const k = Math.min(t.elapsed / t.duration, 1);
      t.onUpdate(t.easing(k));
      if (t.elapsed >= t.duration) {
        t.onComplete?.();
        this.tweens.splice(i, 1);
      }
    }
  }

  clear(): void {
    this.tweens.length = 0;
  }
}

function pseudoNoise(t: number, seed: number): number {
  const x = Math.sin(t * 12.9898 + seed * 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

export class ShakeRig {
  private trauma = 0;
  private time = 0;

  addTrauma(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  update(delta: number, camera: { position: { x: number; y: number }; rotation: { z: number } }): void {
    this.time += delta;
    this.trauma = Math.max(0, this.trauma - 1.4 * delta);
    if (this.trauma <= 0) return;
    const shake = this.trauma * this.trauma;
    const freq = this.time * 32;
    camera.position.x += 0.55 * shake * pseudoNoise(freq, 1);
    camera.position.y += 0.55 * shake * pseudoNoise(freq, 2);
    camera.rotation.z += 0.1 * shake * pseudoNoise(freq, 3);
  }
}

export function formatClock(totalMinutes: number): string {
  const m = Math.max(0, Math.floor(totalMinutes));
  const h = Math.floor(m / 60) % 24;
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
