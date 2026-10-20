import {
  ARENA,
  incomingProgress,
  type ArenaBraceResult,
  type ArenaPassenger,
  type ArenaState,
} from './sim';

export interface ArenaHudCallbacks {
  onMove: (x: number, z: number) => void;
  onPush: (held: boolean) => void;
  onHold: (held: boolean) => void;
  onReset: () => void;
  onZoom: (delta: number) => void;
}

const RESULT_TEXT: Record<ArenaBraceResult, string> = {
  none: '',
  perfect: 'PAS. Dia kehilangan keseimbangan.',
  early: 'TERLALU AWAL. Kamu kaku duluan.',
  late: 'TELAT. Bahumu kena.',
  interrupt: 'DIBLOK. Kamu dorong duluan.',
  miss: 'MELESET. Dia kelebihan tenaga.',
};

export class ArenaHud {
  private readonly root: HTMLElement;

  private readonly callbacks: ArenaHudCallbacks;

  private readonly shell: HTMLElement;

  private readonly stick: HTMLElement;

  private readonly knob: HTMLElement;

  private readonly pushButton: HTMLButtonElement;

  private readonly pushLabel: HTMLElement;

  private readonly pushCaption: HTMLElement;

  private readonly holdButton: HTMLButtonElement;

  private readonly resetButton: HTMLButtonElement;

  private readonly zoomOut: HTMLButtonElement;

  private readonly zoomIn: HTMLButtonElement;

  private readonly zoomValue: HTMLElement;

  private readonly status: HTMLElement;

  private readonly timing: HTMLElement;

  private readonly timingLabel: HTMLElement;

  private readonly timingMarker: HTMLElement;

  private readonly timingWindow: HTMLElement;

  private readonly timingHint: HTMLElement;

  private readonly aggressiveState: HTMLElement;

  private readonly passiveState: HTMLElement;

  private readonly counters: HTMLElement;

  private readonly holdCaption: HTMLElement;

  private readonly filmer: HTMLElement;

  private readonly filmerState: HTMLElement;

  private readonly filmerHint: HTMLElement;

  private readonly filmerMeter: HTMLElement;

  private readonly viral: HTMLElement;

  private readonly viralScroll: HTMLElement;

  private readonly viralImage: HTMLImageElement;

  private readonly viralFallback: HTMLElement;

  private readonly viralRetry: HTMLButtonElement;

  private viralShown = false;

  private viralFrame: string | null = null;

  private stickPointer: number | null = null;

  private pushPointer: number | null = null;

  private stickX = 0;

  private stickZ = 0;

  private holdPointer: number | null = null;

  private lastResult: ArenaBraceResult = 'none';

  constructor(root: HTMLElement, callbacks: ArenaHudCallbacks) {
    this.root = root;
    this.callbacks = callbacks;
    root.innerHTML = `
      <div class="arena-hud">
        <header class="arena-head">
          <div>
            <p class="arena-kicker">ARENA UJI · DORONG &amp; TAHAN</p>
            <h1 class="arena-title">TIGA PENUMPANG.<br><span>SATU RUANG.</span></h1>
          </div>
          <div class="arena-head-actions">
            <button class="arena-reset" id="arena-reset" type="button">RESET</button>
            <div class="arena-zoom" role="group" aria-label="Zoom kamera arena" title="Cubit atau scroll untuk zoom">
              <button class="arena-zoom-btn" id="arena-zoom-out" type="button" aria-label="Perkecil arena" disabled>−</button>
              <span class="arena-zoom-value" id="arena-zoom-value">1.0×</span>
              <button class="arena-zoom-btn" id="arena-zoom-in" type="button" aria-label="Perbesar arena">+</button>
            </div>
          </div>
        </header>

        <div class="arena-topline">
          <span class="arena-dot"></span>
          <span>A · AGRESIF</span>
          <b id="arena-aggressive-state">SIAP</b>
          <span class="arena-dot blue"></span>
          <span>B · <span id="arena-passive-state">PASIF</span></span>
          <span class="arena-counters" id="arena-counters">DORONG 0 · PAS 0</span>
        </div>

        <div class="arena-status" id="arena-status" aria-live="polite">
          Geser. Cari ruang. Dorong.
        </div>

        <div class="arena-filmer is-idle" id="arena-filmer">
          <span class="arena-cam" aria-hidden="true"><i></i></span>
          <div class="arena-filmer-text">
            <b id="arena-filmer-state">C · DIAM</b>
            <span id="arena-filmer-hint">Ponsel di saku. Belum merekam.</span>
          </div>
          <span class="arena-filmer-meter" aria-hidden="true"><i id="arena-filmer-meter"></i></span>
        </div>

        <div class="arena-timing" id="arena-timing" aria-hidden="true">
          <div class="arena-timing-head">
            <span id="arena-timing-label">SERANGAN</span>
            <span id="arena-timing-hint">TAHAN PAS RING HIJAU</span>
          </div>
          <div class="arena-timing-track">
            <div class="arena-timing-window" id="arena-timing-window"></div>
            <div class="arena-timing-marker" id="arena-timing-marker"></div>
          </div>
        </div>

        <div class="arena-controls">
          <div class="arena-stick" id="arena-stick" aria-label="Gerak">
            <span class="arena-stick-cross">+</span>
            <div class="arena-stick-knob" id="arena-stick-knob"></div>
          </div>
          <div class="arena-buttons">
            <button class="arena-btn arena-push" id="arena-push" type="button">
              <span class="arena-charge" aria-hidden="true"></span>
              <span class="arena-btn-label" id="arena-push-label">DORONG</span>
              <small id="arena-push-caption">tahan → lepas</small>
            </button>
            <button class="arena-btn arena-hold" id="arena-hold" type="button">
              <span>TAHAN</span>
              <small id="arena-hold-caption">pas tabrakan</small>
            </button>
          </div>
        </div>

        <p class="arena-hint">
          Tahan <b>DORONG</b> lalu lepas untuk dorongan keras. <b>TAHAN</b> pas ring hijau.
          WASD / panah · J / K · R reset · Z / X zoom.
        </p>
        <a class="arena-link" href="./station.html">Prototipe stasiun →</a>

        <section class="viral-overlay" id="arena-viral" role="dialog" aria-modal="true" aria-labelledby="arena-viral-title" hidden>
          <div class="viral-screen">
            <header class="viral-appbar">
              <span class="viral-applogo" aria-hidden="true"><i></i></span>
              <span class="viral-appname">Instagram</span>
              <span class="viral-appmeta">JAKARTA · UNTUKMU</span>
            </header>

            <article class="viral-post">
              <header class="viral-user">
                <span class="viral-avatar" aria-hidden="true">JM</span>
                <div class="viral-usertext">
                  <b>@jakarta.hening</b>
                  <small>Jurangmangu · baru saja</small>
                </div>
                <span class="viral-dots" aria-hidden="true">•••</span>
              </header>

              <div class="viral-media">
                <img id="arena-viral-frame" alt="Cuplikan video dorongan di arena" hidden>
                <div class="viral-fallback" id="arena-viral-fallback" aria-hidden="true">
                  <span class="viral-fallback-ring"></span>
                  <span class="viral-fallback-label">CUPLIKAN VIDEO</span>
                  <span class="viral-fallback-sub">Dorongan terekam · 0:07</span>
                </div>
                <span class="viral-media-badge">VIDEO · 0:07</span>
                <span class="viral-play" aria-hidden="true">▶</span>
                <span class="viral-views">18,4 rb tayangan</span>
              </div>

              <div class="viral-actions" aria-hidden="true">
                <span>♡</span><span>◯</span><span>↗</span>
              </div>
              <p class="viral-likes">12.481 suka</p>
              <p class="viral-caption"><b>@jakarta.hening</b> POV: pejuang nafkah, tapi caranya...</p>
              <p class="viral-tag">#jurangmangu #commuter #viral</p>

              <div class="viral-comments">
                <p class="viral-comments-title">KOMENTAR</p>
                <ul>
                  <li><b>@rantau.kantor</b> gak ada urat malunya. orang lagi capek malah didorong.</li>
                  <li><b>@pulang.terlambat</b> semoga besok dapet kursi, tapi jangan gini caranya.</li>
                  <li><b>@kopi.tubruk</b> gue kira rebutan kerjaan, ternyata rebutan tempat berdiri.</li>
                  <li><b>@warga.krl</b> kamera udah nyala masih aja dorong. memang niat.</li>
                  <li><b>@tidur.di.kereta</b> aku malu lihatnya. kamu nggak?</li>
                  <li><b>@bapak.kost</b> capek itu bukan alasan buat nyakitin orang.</li>
                  <li><b>@nasi.bungkus</b> report. ini bukan lucu.</li>
                  <li><b>@jam.enam</b> semua orang juga capek. bukan cuma kamu.</li>
                </ul>
                <p class="viral-more">Lihat semua 1.284 komentar</p>
              </div>
            </article>

            <footer class="viral-gameover">
              <span class="viral-kicker">VIDEO TERSIMPAN · VIRAL</span>
              <h2 id="arena-viral-title">GAME OVER</h2>
              <p>Dia merekam semuanya. Besok semua orang tahu.</p>
              <button class="viral-retry" id="arena-viral-retry" type="button">COBA LAGI</button>
            </footer>
          </div>
        </section>
      </div>
    `;

    this.shell = this.query('.arena-hud');
    this.stick = this.query('#arena-stick');
    this.knob = this.query('#arena-stick-knob');
    this.pushButton = this.queryButton('#arena-push');
    this.pushLabel = this.query('#arena-push-label');
    this.pushCaption = this.query('#arena-push-caption');
    this.holdButton = this.queryButton('#arena-hold');
    this.resetButton = this.queryButton('#arena-reset');
    this.zoomOut = this.queryButton('#arena-zoom-out');
    this.zoomIn = this.queryButton('#arena-zoom-in');
    this.zoomValue = this.query('#arena-zoom-value');
    this.status = this.query('#arena-status');
    this.timing = this.query('#arena-timing');
    this.timingLabel = this.query('#arena-timing-label');
    this.timingMarker = this.query('#arena-timing-marker');
    this.timingWindow = this.query('#arena-timing-window');
    this.timingHint = this.query('#arena-timing-hint');
    this.aggressiveState = this.query('#arena-aggressive-state');
    this.passiveState = this.query('#arena-passive-state');
    this.counters = this.query('#arena-counters');
    this.holdCaption = this.query('#arena-hold-caption');
    this.filmer = this.query('#arena-filmer');
    this.filmerState = this.query('#arena-filmer-state');
    this.filmerHint = this.query('#arena-filmer-hint');
    this.filmerMeter = this.query('#arena-filmer-meter');
    this.viral = this.query('#arena-viral');
    this.viralScroll = this.query('.viral-post');
    this.viralImage = this.queryImage('#arena-viral-frame');
    this.viralFallback = this.query('#arena-viral-fallback');
    this.viralRetry = this.queryButton('#arena-viral-retry');

    this.bindStick();
    this.bindButtons();
  }

  update(state: ArenaState): void {
    const p = state.player;
    const incoming = state.incoming;
    const quick = incoming?.kind === 'revenge';
    const passive = this.passenger(state, 'passive');
    const aggressive = this.passenger(state, 'aggressive');
    const mode = state.filmerMode;
    const caught = state.gameOver === 'viral';
    this.filmer.classList.toggle('is-idle', !caught && mode === 'idle');
    this.filmer.classList.toggle('is-prep', !caught && mode === 'preparing');
    this.filmer.classList.toggle('is-rec', !caught && mode === 'recording');
    this.filmer.classList.toggle('is-cool', !caught && mode === 'cooldown');
    this.filmer.classList.toggle('is-caught', caught);
    if (caught) {
      this.filmerState.textContent = 'C · KETAHUAN';
      this.filmerHint.textContent = 'Video tersimpan. Game over.';
    } else if (mode === 'preparing') {
      this.filmerState.textContent = 'C · SIAP';
      this.filmerHint.textContent = 'Dia angkat ponsel. Jangan dorong.';
    } else if (mode === 'recording') {
      this.filmerState.textContent = 'C · MEREKAM';
      this.filmerHint.textContent = 'JANGAN DORONG. Kamera hidup.';
    } else if (mode === 'cooldown') {
      this.filmerState.textContent = 'C · TURUN';
      this.filmerHint.textContent = 'Kamera turun. Sebentar.';
    } else {
      this.filmerState.textContent = 'C · DIAM';
      this.filmerHint.textContent = 'Ponsel di saku. Belum merekam.';
    }
    const cameraDuration =
      mode === 'preparing' ? ARENA.filmerPrepare :
        mode === 'recording' ? ARENA.filmerRecord :
          mode === 'cooldown' ? ARENA.filmerCooldown : 0;
    const cameraRatio = caught ? 1 : cameraDuration > 0 ? Math.max(0, Math.min(1, state.filmerTimer / cameraDuration)) : 0;
    this.filmerMeter.style.width = `${Math.round(cameraRatio * 100)}%`;

    this.shell.classList.toggle('is-fallen', p.fallen > 0);
    if (passive) {
      this.passiveState.textContent =
        passive.fallen > 0 ? 'JATUH' : passive.revenge ? 'MARAH' : 'PASIF';
      this.passiveState.classList.toggle('is-angry', passive.revenge || passive.fallen > 0);
    } else {
      this.passiveState.textContent = 'PASIF';
      this.passiveState.classList.remove('is-angry');
    }

    if (aggressive) {
      const attacker = incoming?.attackerId === aggressive.id;
      if (attacker) {
        this.aggressiveState.textContent =
          state.time >= (incoming?.windowStart ?? 0) ? 'MENDORONG' : 'MENGANCAM';
      } else {
        this.aggressiveState.textContent = 'SIAP';
      }
    }
    if (incoming && passive && incoming.attackerId === passive.id) {
      this.passiveState.textContent =
        state.time >= incoming.windowStart ? 'MENDORONG' : 'MENGANCAM';
    }

    const charge = p.pushCharge;
    const charging = p.pushHeld;
    const full = charge >= ARENA.hardPushThreshold;
    this.pushButton.style.setProperty('--charge', `${Math.round(charge * 100)}%`);
    this.pushButton.classList.toggle('is-charging', charging);
    this.pushButton.classList.toggle('is-full', full);
    this.pushButton.classList.toggle('is-cooling', p.pushCooldown > 0);
    this.pushLabel.textContent = full ? 'LEPAS' : charging ? 'ISI' : 'DORONG';
    this.pushCaption.textContent = full
      ? 'lepas: KERAS'
      : charging
        ? 'tahan...'
        : 'tahan → lepas';

    if (incoming) {
      const progress = incomingProgress(state);
      const windowStart =
        (incoming.windowStart - incoming.startedAt) /
        Math.max(0.001, incoming.impactAt - incoming.startedAt);
      const windowWidth =
        (incoming.impactAt - incoming.windowStart) /
        Math.max(0.001, incoming.impactAt - incoming.startedAt);
      const inWindow = state.time >= incoming.windowStart;
      this.timing.classList.add('is-live');
      this.timing.classList.toggle('is-quick', quick === true);
      this.timing.classList.toggle('is-window', inWindow);
      this.timing.setAttribute('aria-hidden', 'false');
      this.timingLabel.textContent = quick ? 'BALAS DENDAM · CEPAT' : 'SERANGAN';
      this.timingMarker.style.left = `${Math.min(100, progress * 100)}%`;
      this.timingWindow.style.left = `${windowStart * 100}%`;
      this.timingWindow.style.width = `${windowWidth * 100}%`;
      this.timingHint.textContent = inWindow
        ? quick
          ? 'TAHAN CEPAT'
          : 'TAHAN SEKARANG'
        : quick
          ? 'CEPAT. RING HIJAU.'
          : 'TUNGGU RING HIJAU';
      this.holdCaption.textContent = inWindow
        ? quick
          ? 'SEKARANG!'
          : 'SEKARANG'
        : 'pas tabrakan';
      this.holdButton.classList.toggle('is-window', inWindow);
      this.holdButton.classList.toggle('is-held', state.brace.held);
      if (!inWindow && state.brace.held && state.brace.pressedAt !== null) {
        this.status.textContent = 'TERLALU AWAL. Lepas, lalu tekan lagi di ring hijau.';
      } else if (!inWindow && state.brace.held && state.brace.pressedAt === null) {
        this.status.textContent = 'LEPAS DULU. Tekan lagi di ring hijau.';
      }
    } else {
      this.timing.classList.remove('is-live', 'is-window', 'is-quick');
      this.timing.setAttribute('aria-hidden', 'true');
      this.holdCaption.textContent = 'pas tabrakan';
      this.holdButton.classList.remove('is-window', 'is-held');
    }

    const result = state.brace.result;
    if (result !== 'none' && result !== this.lastResult) {
      this.showResult(result);
      this.lastResult = result;
    }
    if (result === 'none') this.lastResult = 'none';

    if (p.fallen > 0) {
      this.status.textContent =
        result === 'early' || result === 'late' ? 'KAMU JATUH. Bangkit...' : 'JATUH. Bangkit...';
    } else if (incoming) {
      const inWindow = state.time >= incoming.windowStart;
      if (result === 'none' && state.brace.held) {
        if (inWindow) this.status.textContent = 'TAHAN. Pas.';
        // otherwise keep the early / release warning above
      } else if (result === 'none') {
        this.status.textContent = inWindow
          ? quick
            ? 'SEKARANG. Tahan cepat.'
            : 'SEKARANG. Tahan.'
          : quick
            ? 'Dia balas cepat. Tahan lebih awal.'
            : 'Dia menarik bahu. Tunggu ring hijau.';
      }
    } else if (result === 'early' || result === 'late') {
      if (state.time - state.brace.resultAt > 0.9) {
        this.status.textContent = 'Bangkit. Cari ruang.';
      }
    } else if (result === 'perfect' || result === 'interrupt' || result === 'miss') {
      if (state.time - state.brace.resultAt > 1.5) {
        this.status.textContent = 'Geser. Cari ruang. Dorong.';
      }
    } else if (mode === 'recording') {
      this.status.textContent = 'C MEREKAM. Jangan dorong.';
    } else if (mode === 'preparing') {
      this.status.textContent = 'C angkat ponsel. Tunggu turun.';
    } else if (result === 'none' && p.pushFlash > 0) {
      if (state.lastPushHitId === null) {
        this.status.textContent = 'Tidak ada di jangkauan.';
      } else if (state.lastPushHard) {
        this.status.textContent = 'DORONG KERAS. Dia jatuh.';
      } else {
        this.status.textContent = 'DORONG. Ruang terbuka.';
      }
    } else if (result === 'none' && passive?.revenge) {
      this.status.textContent = 'B marah. Dia akan balas.';
    } else if (result === 'none' && state.pushTargetId !== null) {
      this.status.textContent = 'Ada ruang. Tahan DORONG untuk yang lebih keras.';
    } else if (result === 'none') {
      this.status.textContent = 'Geser. Cari ruang. Dorong.';
    }

    this.counters.textContent = `DORONG ${state.pushes} · PAS ${state.brace.perfects}`;
    if (caught && !this.viralShown) this.showViral();
  }

  reset(): void {
    this.lastResult = 'none';
    this.stickX = 0;
    this.stickZ = 0;
    this.knob.style.transform = 'translate(0px, 0px)';
    this.status.textContent = 'Geser. Cari ruang. Dorong.';
    this.pushButton.classList.remove('is-cooling', 'is-charging', 'is-full');
    this.pushButton.style.setProperty('--charge', '0%');
    this.pushLabel.textContent = 'DORONG';
    this.pushCaption.textContent = 'tahan → lepas';
    this.holdButton.classList.remove('is-window', 'is-held', 'is-perfect', 'is-fail');
    this.timing.classList.remove('is-live', 'is-window', 'is-quick');
    this.shell.classList.remove('is-fallen');
    this.passiveState.textContent = 'PASIF';
    this.passiveState.classList.remove('is-angry');
    this.filmer.classList.remove('is-prep', 'is-rec', 'is-cool', 'is-caught');
    this.filmer.classList.add('is-idle');
    this.filmerState.textContent = 'C · DIAM';
    this.filmerHint.textContent = 'Ponsel di saku. Belum merekam.';
    this.filmerMeter.style.width = '0%';
    this.hideViral();
    this.callbacks.onMove(0, 0);
  }

  private showResult(result: ArenaBraceResult): void {
    this.status.textContent = RESULT_TEXT[result];
    if (result === 'perfect') {
      this.holdButton.classList.add('is-perfect');
      window.setTimeout(() => this.holdButton.classList.remove('is-perfect'), 700);
    } else if (result === 'early' || result === 'late') {
      this.holdButton.classList.add('is-fail');
      window.setTimeout(() => this.holdButton.classList.remove('is-fail'), 700);
    }
    if (result === 'interrupt' || result === 'miss') {
      this.holdButton.classList.add('is-perfect');
      window.setTimeout(() => this.holdButton.classList.remove('is-perfect'), 550);
    }
  }

  private showViral(): void {
    this.viralShown = true;
    this.viral.hidden = false;
    this.viral.classList.add('is-visible');
    this.viralScroll.scrollTop = 0;
    this.applyViralFrame();
    this.viralRetry.focus();
  }

  setViralFrame(frame: string | null): void {
    this.viralFrame = frame;
    this.applyViralFrame();
  }

  setZoom(value: number, min: number, max: number): void {
    this.zoomValue.textContent = `${value.toFixed(1)}×`;
    this.zoomOut.disabled = value <= min + 0.001;
    this.zoomIn.disabled = value >= max - 0.001;
  }

  private applyViralFrame(): void {
    if (this.viralFrame) {
      this.viralImage.src = this.viralFrame;
      this.viralImage.hidden = false;
      this.viralFallback.hidden = true;
    } else {
      this.viralImage.hidden = true;
      this.viralImage.removeAttribute('src');
      this.viralFallback.hidden = false;
    }
  }

  private hideViral(): void {
    this.viral.hidden = true;
    this.viral.classList.remove('is-visible');
    this.viralShown = false;
    this.viralFrame = null;
    this.viralScroll.scrollTop = 0;
    this.viralImage.hidden = true;
    this.viralImage.removeAttribute('src');
    this.viralFallback.hidden = false;
  }

  private passenger(state: ArenaState, behavior: 'passive' | 'aggressive'): ArenaPassenger | null {
    return state.passengers.find((q) => q.behavior === behavior) ?? null;
  }

  private bindStick(): void {
    const begin = (event: PointerEvent): void => {
      if (this.stickPointer !== null) return;
      this.stickPointer = event.pointerId;
      this.stick.setPointerCapture(event.pointerId);
      this.updateStick(event);
    };
    const move = (event: PointerEvent): void => {
      if (event.pointerId !== this.stickPointer) return;
      this.updateStick(event);
    };
    const end = (event: PointerEvent): void => {
      if (event.pointerId !== this.stickPointer) return;
      this.stickPointer = null;
      this.stickX = 0;
      this.stickZ = 0;
      this.knob.style.transform = 'translate(0px, 0px)';
      this.callbacks.onMove(0, 0);
    };
    this.stick.addEventListener('pointerdown', begin);
    this.stick.addEventListener('pointermove', move);
    this.stick.addEventListener('pointerup', end);
    this.stick.addEventListener('pointercancel', end);
    this.stick.addEventListener('lostpointercapture', end);
  }

  private updateStick(event: PointerEvent): void {
    const rect = this.stick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const max = rect.width * 0.33;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    const scale = distance > max ? max / distance : 1;
    const x = dx * scale;
    const y = dy * scale;
    this.knob.style.transform = `translate(${x}px, ${y}px)`;
    this.stickX = x / max;
    this.stickZ = y / max;
    this.callbacks.onMove(this.stickX, this.stickZ);
  }

  private bindButtons(): void {
    const setPush = (held: boolean, event: PointerEvent): void => {
      event.preventDefault();
      if (held) {
        if (this.pushPointer !== null) return;
        this.pushPointer = event.pointerId;
        this.pushButton.setPointerCapture(event.pointerId);
      } else {
        if (this.pushPointer !== null && event.pointerId !== this.pushPointer) return;
        this.pushPointer = null;
      }
      this.pushButton.classList.toggle('is-held', held);
      this.callbacks.onPush(held);
    };
    this.pushButton.addEventListener('pointerdown', (event) => setPush(true, event));
    this.pushButton.addEventListener('pointerup', (event) => setPush(false, event));
    this.pushButton.addEventListener('pointercancel', (event) => setPush(false, event));
    this.pushButton.addEventListener('lostpointercapture', (event) => setPush(false, event));

    const setHold = (held: boolean, event: PointerEvent): void => {
      event.preventDefault();
      if (held) {
        if (this.holdPointer !== null) return;
        this.holdPointer = event.pointerId;
        this.holdButton.setPointerCapture(event.pointerId);
      } else {
        if (this.holdPointer !== null && event.pointerId !== this.holdPointer) return;
        this.holdPointer = null;
      }
      this.holdButton.classList.toggle('is-held', held);
      this.callbacks.onHold(held);
    };
    this.holdButton.addEventListener('pointerdown', (event) => setHold(true, event));
    this.holdButton.addEventListener('pointerup', (event) => setHold(false, event));
    this.holdButton.addEventListener('pointercancel', (event) => setHold(false, event));
    this.holdButton.addEventListener('lostpointercapture', (event) => setHold(false, event));

    this.resetButton.addEventListener('click', () => {
      this.callbacks.onReset();
      this.reset();
    });

    this.zoomOut.addEventListener('click', () => this.callbacks.onZoom(-0.2));
    this.zoomIn.addEventListener('click', () => this.callbacks.onZoom(0.2));

    this.viralRetry.addEventListener('click', () => {
      this.callbacks.onReset();
    });
  }

  private query(selector: string): HTMLElement {
    const element = this.root.querySelector(selector);
    if (!(element instanceof HTMLElement)) throw new Error(`Arena HUD missing ${selector}`);
    return element;
  }

  private queryImage(selector: string): HTMLImageElement {
    const element = this.root.querySelector(selector);
    if (!(element instanceof HTMLImageElement)) throw new Error(`Arena HUD missing ${selector}`);
    return element;
  }

  private queryButton(selector: string): HTMLButtonElement {
    const element = this.root.querySelector(selector);
    if (!(element instanceof HTMLButtonElement)) throw new Error(`Arena HUD missing ${selector}`);
    return element;
  }
}
