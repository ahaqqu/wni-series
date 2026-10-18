export type FrameCallback = (delta: number, elapsed: number) => void;

export class Loop {
  private running = false;
  private last = 0;
  private elapsed = 0;
  private raf = 0;
  private timeScale = 1;
  private hitstopRemaining = 0;

  constructor(private readonly callback: FrameCallback) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      const raw = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;

      let scale = this.timeScale;
      if (this.hitstopRemaining > 0) {
        this.hitstopRemaining = Math.max(0, this.hitstopRemaining - raw * 1000);
        scale *= 0.08;
      }
      const delta = raw * scale;
      this.elapsed += delta;
      this.callback(delta, this.elapsed);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  setTimeScale(scale: number): void {
    this.timeScale = scale;
  }

  hitstop(durationMs: number): void {
    this.hitstopRemaining = Math.max(this.hitstopRemaining, durationMs);
  }

  dispose(): void {
    this.stop();
  }
}
