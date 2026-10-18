/** Lightweight Web Audio SFX (no external files required). */
export class AudioSystem {
  private ctx?: AudioContext;
  private master?: GainNode;
  private engineOsc?: OscillatorNode;
  private engineGain?: GainNode;
  private muted = false;
  private unlocked = false;

  async unlock(): Promise<void> {
    if (this.unlocked) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.22;
    this.master.connect(this.ctx.destination);
    this.unlocked = true;
    if (this.ctx.state === 'suspended') await this.ctx.resume();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.22;
  }

  private tone(freq: number, duration: number, type: OscillatorType, gain = 0.2, slide = 0): void {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + duration);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  private noise(duration: number, gain = 0.18, filterFreq = 1200): void {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t);
  }

  horn(): void {
    this.tone(420, 0.18, 'square', 0.12);
    this.tone(520, 0.16, 'square', 0.08);
  }

  nearMiss(): void {
    this.tone(880, 0.12, 'triangle', 0.14, 400);
  }

  crash(): void {
    this.noise(0.35, 0.28, 400);
    this.tone(120, 0.3, 'sawtooth', 0.12, -60);
  }

  boost(): void {
    this.tone(180, 0.35, 'sawtooth', 0.1, 420);
    this.noise(0.2, 0.08, 2000);
  }

  uiClick(): void {
    this.tone(660, 0.05, 'triangle', 0.08);
  }

  trainBrake(): void {
    this.noise(0.55, 0.16, 500);
    this.tone(90, 0.5, 'sine', 0.08, -30);
  }

  crowd(): void {
    this.noise(0.25, 0.06, 800);
  }

  startEngine(): void {
    if (!this.ctx || !this.master || this.engineOsc) return;
    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 70;
    this.engineGain.gain.value = 0.03;
    this.engineOsc.connect(this.engineGain);
    this.engineGain.connect(this.master);
    this.engineOsc.start();
  }

  setEngineLoad(load: number): void {
    if (!this.engineOsc || !this.engineGain) return;
    const t = this.ctx?.currentTime ?? 0;
    this.engineOsc.frequency.setTargetAtTime(55 + load * 90, t, 0.08);
    this.engineGain.gain.setTargetAtTime(0.02 + load * 0.04, t, 0.1);
  }

  stopEngine(): void {
    this.engineOsc?.stop();
    this.engineOsc?.disconnect();
    this.engineGain?.disconnect();
    this.engineOsc = undefined;
    this.engineGain = undefined;
  }

  dispose(): void {
    this.stopEngine();
    void this.ctx?.close();
    this.ctx = undefined;
    this.unlocked = false;
  }
}
