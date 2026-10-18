export interface RunStats {
  gaji: number;
  health: number;
  sanity: number;
  boost: number;
  distanceM: number;
  timeSec: number;
  nearMisses: number;
  bestGaji: number;
  unlockedFull: boolean;
  mode: 'motor' | 'krl';
}

const STORAGE_KEY = 'wni-pejuang-nafkah-v1';

function loadMeta(): { bestGaji: number; unlockedFull: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { bestGaji: 0, unlockedFull: false };
    const data = JSON.parse(raw) as { bestGaji?: number; unlockedFull?: boolean };
    return {
      bestGaji: data.bestGaji ?? 0,
      unlockedFull: Boolean(data.unlockedFull),
    };
  } catch {
    return { bestGaji: 0, unlockedFull: false };
  }
}

function saveMeta(meta: { bestGaji: number; unlockedFull: boolean }): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
  } catch {
    /* ignore */
  }
}

export class ScoreSystem {
  gaji = 0;
  health = 100;
  sanity = 100;
  boost = 0;
  distanceM = 0;
  timeSec = 0;
  nearMisses = 0;
  bestGaji = 0;
  unlockedFull = false;
  mode: 'motor' | 'krl' = 'motor';

  private bannerListeners = new Set<(text: string, kind: 'good' | 'bad' | 'info') => void>();

  constructor() {
    const meta = loadMeta();
    this.bestGaji = meta.bestGaji;
    this.unlockedFull = meta.unlockedFull;
  }

  reset(mode: 'motor' | 'krl'): void {
    this.mode = mode;
    this.gaji = 0;
    this.health = 100;
    this.sanity = 100;
    this.boost = 0;
    this.distanceM = 0;
    this.timeSec = 0;
    this.nearMisses = 0;
  }

  onBanner(fn: (text: string, kind: 'good' | 'bad' | 'info') => void): () => void {
    this.bannerListeners.add(fn);
    return () => this.bannerListeners.delete(fn);
  }

  private banner(text: string, kind: 'good' | 'bad' | 'info' = 'info'): void {
    for (const fn of this.bannerListeners) fn(text, kind);
  }

  addGaji(amount: number, reason?: string): void {
    const gain = Math.max(0, Math.round(amount));
    this.gaji += gain;
    if (reason && gain > 0) this.banner(`+${gain} Gaji · ${reason}`, 'good');
  }

  addNearMiss(): void {
    this.nearMisses += 1;
    this.boost = Math.min(100, this.boost + 18);
    this.addGaji(25, 'Near-miss');
    if (this.nearMisses % 3 === 0) this.banner('NGELAWAN ARUS!', 'good');
  }

  damage(amount: number, cause: string): void {
    this.health = Math.max(0, this.health - amount);
    this.sanity = Math.max(0, this.sanity - amount * 0.35);
    this.boost = Math.max(0, this.boost - 20);
    this.banner(cause, 'bad');
    if (this.health <= 0) this.banner('GAME OVER', 'bad');
  }

  drainSanity(amount: number): void {
    this.sanity = Math.max(0, this.sanity - amount);
  }

  restoreSanity(amount: number): void {
    this.sanity = Math.min(100, this.sanity + amount);
  }

  tickTravel(delta: number, speed: number): void {
    this.timeSec += delta;
    this.distanceM += speed * delta;
    this.boost = Math.max(0, this.boost - delta * 6);
  }

  arrivalBonus(clockMinutes: number): number {
    // target 08:30 = 510 minutes from midnight; start ~07:00 = 420
    const lateBy = Math.max(0, clockMinutes - 510);
    const punctuality = Math.max(0, 1 - lateBy / 40);
    const base = 400 + punctuality * 900 + this.sanity * 2 + this.health * 1.5 + this.nearMisses * 12;
    const total = Math.round(base);
    this.addGaji(total, 'Tiba di SCBD');
    if (this.gaji > this.bestGaji) {
      this.bestGaji = this.gaji;
      saveMeta({ bestGaji: this.bestGaji, unlockedFull: this.unlockedFull });
    }
    return total;
  }

  unlockFull(): void {
    this.unlockedFull = true;
    saveMeta({ bestGaji: this.bestGaji, unlockedFull: true });
    this.banner('FULL MAP UNLOCKED', 'good');
  }

  snapshot(): RunStats {
    return {
      gaji: this.gaji,
      health: this.health,
      sanity: this.sanity,
      boost: this.boost,
      distanceM: this.distanceM,
      timeSec: this.timeSec,
      nearMisses: this.nearMisses,
      bestGaji: this.bestGaji,
      unlockedFull: this.unlockedFull,
      mode: this.mode,
    };
  }
}
