import type { Game, HudSnapshot } from '../game/Game';
import { createPaywuzCheckout, type PayMethod } from '../payments/paywuz';

export class Hud {
  private readonly root: HTMLElement;
  private readonly landing: HTMLElement;
  private readonly pauseMenu: HTMLElement;
  private readonly resultMenu: HTMLElement;
  private readonly modeMenu: HTMLElement;
  private readonly paywall: HTMLElement;
  private readonly banner: HTMLElement;
  private bannerTimer = 0;
  private lastStationBanner = '';

  constructor(
    private readonly game: Game,
    els: {
      root: HTMLElement;
      landing: HTMLElement;
      pauseMenu: HTMLElement;
      resultMenu: HTMLElement;
      modeMenu: HTMLElement;
      paywall: HTMLElement;
      banner: HTMLElement;
    },
  ) {
    this.root = els.root;
    this.landing = els.landing;
    this.pauseMenu = els.pauseMenu;
    this.resultMenu = els.resultMenu;
    this.modeMenu = els.modeMenu;
    this.paywall = els.paywall;
    this.banner = els.banner;
  }

  bind(): void {
    const q = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

    const showModeMenu = () => {
      this.modeMenu.classList.remove('hidden');
    };
    const hideModeMenu = () => this.modeMenu.classList.add('hidden');

    q('nav-play').addEventListener('click', () => {
      this.game.audio.uiClick();
      showModeMenu();
    });
    q('hero-play').addEventListener('click', () => {
      this.game.audio.uiClick();
      showModeMenu();
    });
    q('hero-trailer').addEventListener('click', () => {
      document.getElementById('modes')?.scrollIntoView({ behavior: 'smooth' });
    });
    q('cta-unlock').addEventListener('click', () => this.openPaywall());
    q('btn-result-unlock').addEventListener('click', () => this.openPaywall());

    document.querySelectorAll<HTMLButtonElement>('.play-mode').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = (btn.dataset.mode === 'krl' ? 'krl' : 'motor') as 'motor' | 'krl';
        void this.begin(mode);
      });
    });

    document.querySelectorAll<HTMLButtonElement>('.mode-pick').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = (btn.dataset.mode === 'krl' ? 'krl' : 'motor') as 'motor' | 'krl';
        hideModeMenu();
        void this.begin(mode);
      });
    });
    q('mode-close').addEventListener('click', hideModeMenu);

    q('btn-pause').addEventListener('click', () => this.game.pause());
    q('btn-resume').addEventListener('click', () => this.game.resume());
    q('btn-restart').addEventListener('click', () => {
      this.pauseMenu.classList.add('hidden');
      void this.game.startRun(this.game.score.mode);
    });
    q('btn-quit').addEventListener('click', () => {
      this.pauseMenu.classList.add('hidden');
      void this.game.quitToMenu();
      this.showLanding();
    });
    q('btn-retry').addEventListener('click', () => {
      this.resultMenu.classList.add('hidden');
      void this.game.startRun(this.game.score.mode);
    });
    q('btn-result-menu').addEventListener('click', () => {
      this.resultMenu.classList.add('hidden');
      void this.game.quitToMenu();
      this.showLanding();
    });

    // paywall
    q('paywall-close').addEventListener('click', () => this.paywall.classList.add('hidden'));
    document.querySelectorAll<HTMLButtonElement>('.pay-method').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pay-method').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
    q('btn-pay').addEventListener('click', () => void this.runPayment());

    this.game.setHooks({
      onHud: (data) => this.updateHud(data),
      onBanner: (text, kind) => this.showBanner(text, kind),
      onPhase: (phase) => this.onPhase(phase),
      onResult: (result) => this.showResult(result),
    });
  }

  private async begin(mode: 'motor' | 'krl'): Promise<void> {
    this.landing.classList.add('hidden');
    this.root.classList.remove('hidden');
    this.modeMenu.classList.add('hidden');
    this.resultMenu.classList.add('hidden');
    this.pauseMenu.classList.add('hidden');
    await this.game.startRun(mode);
  }

  private showLanding(): void {
    this.root.classList.add('hidden');
    this.landing.classList.remove('hidden');
  }

  private onPhase(phase: string): void {
    if (phase === 'landing') {
      this.root.classList.add('hidden');
      this.landing.classList.remove('hidden');
      this.pauseMenu.classList.add('hidden');
      this.resultMenu.classList.add('hidden');
    }
    if (phase === 'playing' || phase === 'paused' || phase === 'result') {
      this.landing.classList.add('hidden');
      this.root.classList.remove('hidden');
    }
    if (phase === 'playing') {
      this.pauseMenu.classList.add('hidden');
      this.resultMenu.classList.add('hidden');
    }
  }

  private updateHud(data: HudSnapshot): void {
    const set = (id: string, text: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    set('route-label', data.route);
    set('clock-value', data.clock);
    set('gaji-value', String(Math.round(data.gaji)));
    set('health-text', String(Math.round(data.health)));
    set('sanity-text', String(Math.round(data.sanity)));
    set('boost-text', String(Math.round(data.boost)));
    set('zone-label', data.zone);
    set('distance-label', data.distanceKm);

    const bar = (id: string, pct: number) => {
      const el = document.getElementById(id) as HTMLElement | null;
      if (el) el.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    };
    bar('health-bar', data.health);
    bar('sanity-bar', data.sanity);
    bar('boost-bar', data.boost);
    bar('progress-fill', data.progress);

    const hint = document.getElementById('touch-hint');
    if (hint) {
      hint.textContent =
        data.mode === 'krl'
          ? data.krl?.phase === 'board'
            ? 'Drag ke pintu kereta · Hold untuk desak masuk'
            : 'Drag untuk geser · Hold untuk plant feet (rem)'
          : 'Drag untuk steer · Hold untuk rem';
    }

    this.renderKrlMap(data);
  }

  private renderKrlMap(data: HudSnapshot): void {
    const panel = document.getElementById('krl-map');
    if (!panel) return;

    if (data.mode !== 'krl' || !data.krl) {
      panel.classList.add('hidden');
      return;
    }
    panel.classList.remove('hidden');

    const k = data.krl;
    const set = (id: string, text: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    set('krl-line-label', k.lineLabel);
    set('krl-phase', k.phase === 'board' ? 'BOARDING' : 'IN TRAIN');
    set('krl-current', k.current);
    set('krl-next', k.next);
    set('krl-remaining', String(k.remaining));
    set('krl-door', k.phase === 'board' ? `${Math.ceil(k.doorTimer)}s` : '—');

    // station arrival / next-station banner
    if (k.stationBanner && k.stationBanner !== this.lastStationBanner) {
      this.lastStationBanner = k.stationBanner;
      this.showBanner(k.stationBanner, 'good');
    }

    const dot = document.getElementById('krl-line-dot');
    if (dot) (dot as HTMLElement).style.background = k.lineColor;

    const path = document.getElementById('krl-map-path');
    const stopsG = document.getElementById('krl-map-stops');
    const train = document.getElementById('krl-train-dot');
    if (!path || !stopsG || !train) return;

    // map space: viewBox 320x120, padding
    const toXY = (mx: number, my: number) => ({
      x: 24 + mx * 272,
      y: 16 + my * 88,
    });

    if (k.stops.length < 2) return;

    const pts = k.stops.map((s) => toXY(s.mapX, s.mapY));
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    path.setAttribute('d', d);
    path.setAttribute('stroke', k.lineColor);

    // rebuild stop dots (small enough to do every HUD tick)
    stopsG.innerHTML = '';
    for (const s of k.stops) {
      const p = toXY(s.mapX, s.mapY);
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', String(p.x));
      c.setAttribute('cy', String(p.y));
      c.setAttribute('r', '4');
      c.setAttribute('class', 'krl-stop-dot');
      stopsG.appendChild(c);

      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', String(p.x));
      t.setAttribute('y', String(p.y - 8));
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('class', 'krl-stop-label');
      t.textContent = s.name;
      stopsG.appendChild(t);
    }

    // train position interpolated along stops by t
    let ax = pts[0].x;
    let ay = pts[0].y;
    let bx = pts[pts.length - 1].x;
    let by = pts[pts.length - 1].y;
    for (let i = 0; i < k.stops.length - 1; i += 1) {
      const a = k.stops[i];
      const b = k.stops[i + 1];
      if (k.progress >= a.t && k.progress <= b.t) {
        const u = (k.progress - a.t) / Math.max(0.0001, b.t - a.t);
        ax = pts[i].x;
        ay = pts[i].y;
        bx = pts[i + 1].x;
        by = pts[i + 1].y;
        const x = ax + (bx - ax) * u;
        const y = ay + (by - ay) * u;
        train.setAttribute('cx', String(x));
        train.setAttribute('cy', String(y));
        return;
      }
    }
    train.setAttribute('cx', String(pts[pts.length - 1].x));
    train.setAttribute('cy', String(pts[pts.length - 1].y));
  }

  showBanner(text: string, kind: 'good' | 'bad' | 'info' = 'info'): void {
    this.banner.textContent = text;
    this.banner.classList.remove('show', 'good', 'bad');
    if (kind === 'good') this.banner.classList.add('good');
    if (kind === 'bad') this.banner.classList.add('bad');
    // reflow
    void this.banner.offsetWidth;
    this.banner.classList.add('show');
    window.clearTimeout(this.bannerTimer);
    this.bannerTimer = window.setTimeout(() => this.banner.classList.remove('show'), 1600);
  }

  private showResult(result: { win: boolean; reason: string; gaji: number; distanceM: number; timeSec: number }): void {
    const set = (id: string, text: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    set('result-eyebrow', result.win ? 'Berhasil' : 'Run selesai');
    set('result-title', result.win ? 'Tepat Waktu!' : 'Perjuangan Belum Selesai');
    set('result-cause', result.reason);
    set('result-gaji', String(Math.round(result.gaji)));
    set('result-dist', `${(result.distanceM / 1000).toFixed(1)} km`);
    set('result-time', `${Math.floor(result.timeSec / 60)}m ${Math.floor(result.timeSec % 60)}s`);
    this.resultMenu.classList.remove('hidden');
  }

  private openPaywall(): void {
    this.paywall.classList.remove('hidden');
    const status = document.getElementById('pay-status');
    if (status) status.textContent = 'Pembayaran diamankan oleh Paywuz.id';
  }

  private async runPayment(): Promise<void> {
    const status = document.getElementById('pay-status');
    const method =
      document.querySelector('.pay-method.active')?.getAttribute('data-method') ?? 'qris';
    if (status) status.textContent = `Membuat invoice Paywuz (${method})…`;

    const result = await createPaywuzCheckout({ method: method as PayMethod, amount: 25000 });
    if (result.ok) {
      if (status) status.textContent = `Pembayaran diterima · ref ${result.ref}`;
      this.game.unlockFull();
      window.setTimeout(() => {
        this.paywall.classList.add('hidden');
        this.showBanner('FULL MAP UNLOCKED', 'good');
      }, 600);
    } else {
      if (status) status.textContent = result.message;
    }
  }
}
