import { RUN } from '../sim/constants';
import { zoneName } from '../sim/simulation';
import { carLabel, spotLabel } from '../sim/score';
import type { Phase, SeatChoice, SimState } from '../sim/types';
import { updateNoticeText, updateNoticeTone } from '../sim/simulation';

export interface HudCallbacks {
  onStart: () => void;
  onRetry: () => void;
  onHold: (holding: boolean) => void;
  onZone: (delta: number) => void;
  onZoneTo: (zone: number) => void;
  onCoffee: () => void;
  onSeat: (choice: SeatChoice) => void;
}

const CLOCK_BASE = 6 * 3600 + 12 * 60;

function formatClock(seconds: number): string {
  const total = Math.floor(CLOCK_BASE + seconds) % (24 * 3600);
  const hours = Math.floor(total / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((total % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(total % 60)
    .toString()
    .padStart(2, '0');
  return `${hours}:${minutes}:${secs}`;
}

function formatCountdown(seconds: number): string {
  const clamped = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(clamped / 60)
    .toString()
    .padStart(2, '0');
  const secs = (clamped % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
}

function formatRupiah(value: number): string {
  return `Rp ${Math.max(0, Math.round(value)).toLocaleString('id-ID')}`;
}

function actionFor(state: SimState): {
  label: string;
  sub: string;
  canHold: boolean;
  danger: boolean;
  protect: boolean;
  charge: boolean;
} {
  const phase = state.phase;
  if (phase === 'gate') {
    return {
      label: 'TAHAN',
      sub: 'Potong antrean · lepas buat antre',
      canHold: true,
      danger: false,
      protect: false,
      charge: false,
    };
  }
  if (phase === 'platform') {
    return {
      label: 'TAHAN',
      sub: state.crowdPulse > 0.35 ? 'Lawan arus · lepas = mundur' : 'Jaga posisi · lepas = mundur',
      canHold: true,
      danger: false,
      protect: false,
      charge: false,
    };
  }
  if (phase === 'alight') {
    return {
      label: 'TAHAN',
      sub: 'Jangan dorong yang turun',
      canHold: true,
      danger: true,
      protect: false,
      charge: false,
    };
  }
  if (phase === 'board') {
    if (!state.player.canBoard) {
      return {
        label: 'TUNGGU',
        sub: 'Posisi tidak dapat · kereta berikutnya',
        canHold: false,
        danger: true,
        protect: false,
        charge: false,
      };
    }
    if (state.player.zone < state.frontZone) {
      return {
        label: 'GESER',
        sub: `Tidak ada pintu · ke zona ${zoneName(state.frontZone)}`,
        canHold: false,
        danger: true,
        protect: false,
        charge: false,
      };
    }
    if (state.protectWindow > 0 && !state.protectUsed) {
      return {
        label: 'LINDUNGI',
        sub: 'Tahan lalu lepas untuk kasih ruang',
        canHold: true,
        danger: false,
        protect: true,
        charge: false,
      };
    }
    if (state.cameraWarning > 0.04) {
      return {
        label: 'LEPAS',
        sub: 'Kamera merekam · lepas sekarang',
        canHold: true,
        danger: true,
        protect: false,
        charge: false,
      };
    }
    if (state.player.charge >= 0.99) {
      return {
        label: 'HENTAK',
        sub: 'Lepas untuk dorong',
        canHold: true,
        danger: false,
        protect: false,
        charge: true,
      };
    }
    return {
      label: state.player.holding ? 'TAHAN' : 'DORONG',
      sub:
        state.player.charge > 0.05
          ? `Isi ${Math.round(state.player.charge * 100)}% · lepas penuh = HENTAK`
          : 'Tahan · lepas penuh = HENTAK',
      canHold: true,
      danger: false,
      protect: false,
      charge: true,
    };
  }
  if (phase === 'arrival') {
    return {
      label: 'GESER',
      sub:
        state.player.zone < state.frontZone
          ? `Pintu di zona ${zoneName(state.frontZone)} · geser`
          : 'Tunggu pintu dibuka',
      canHold: false,
      danger: state.player.zone < state.frontZone,
      protect: false,
      charge: false,
    };
  }
  if (phase === 'concourse') {
    return {
      label: 'JALAN',
      sub: state.coffee.available ? 'Kopi opsional di kiri' : 'Menuju peron',
      canHold: false,
      danger: false,
      protect: false,
      charge: false,
    };
  }
  if (phase === 'approach') {
    return {
      label: 'JALAN',
      sub: 'Menuju gerbang',
      canHold: false,
      danger: false,
      protect: false,
      charge: false,
    };
  }
  return {
    label: 'SIAP',
    sub: 'Tunggu aba-aba',
    canHold: false,
    danger: false,
    protect: false,
    charge: false,
  };
}

export class Hud {
  private readonly root: HTMLElement;

  private readonly callbacks: HudCallbacks;

  private readonly clockEl: HTMLElement;

  private readonly trainEl: HTMLElement;

  private readonly moneyEl: HTMLElement;

  private readonly zoneStrip: HTMLElement;

  private readonly chips: HTMLButtonElement[];

  private readonly noticeEl: HTMLElement;

  private readonly noticeTextEl: HTMLElement;

  private readonly bubbleEl: HTMLElement;

  private readonly bubbleEyebrow: HTMLElement;

  private readonly bubbleBig: HTMLElement;

  private readonly bubbleSmall: HTMLElement;

  private readonly cameraVignette: HTMLElement;

  private readonly cameraBadge: HTMLElement;

  private readonly energyMeter: HTMLElement;

  private readonly energyFill: HTMLElement;

  private readonly energyValue: HTMLElement;

  private readonly gengsiMeter: HTMLElement;

  private readonly gengsiFill: HTMLElement;

  private readonly gengsiValue: HTMLElement;

  private readonly claimMeter: HTMLElement;

  private readonly claimFill: HTMLElement;

  private readonly claimState: HTMLElement;

  private readonly claimSafe: HTMLElement;

  private readonly claimCaptionLeft: HTMLElement;

  private readonly claimCaptionRight: HTMLElement;

  private readonly action: HTMLButtonElement;

  private readonly actionVerb: HTMLElement;

  private readonly actionSub: HTMLElement;

  private readonly zoneLeft: HTMLButtonElement;

  private readonly zoneRight: HTMLButtonElement;

  private readonly coffee: HTMLButtonElement;

  private readonly startOverlay: HTMLElement;

  private readonly startButton: HTMLButtonElement;

  private readonly resultOverlay: HTMLElement;

  private readonly resultBody: HTMLElement;

  private readonly retryButton: HTMLButtonElement;

  private readonly seatSheet: HTMLElement;

  private readonly seatTimerBar: HTMLElement;

  private readonly toast: HTMLElement;

  private readonly debugEl: HTMLElement;

  private readonly app: HTMLElement;

  private holdActive = false;

  private pointerId: number | null = null;

  private pointerStartX = 0;

  private lastResultKey = '';

  private viralRevealAt: number | null = null;

  private lastPhase: Phase | null = null;

  constructor(root: HTMLElement, callbacks: HudCallbacks) {
    this.root = root;
    this.callbacks = callbacks;
    this.app = document.getElementById('app') ?? document.body;
    this.root.innerHTML = this.template();

    this.clockEl = this.query('clock');
    this.trainEl = this.query('train');
    this.moneyEl = this.query('money');
    this.zoneStrip = this.query('zones');
    this.chips = [0, 1, 2].map((index) => this.query<HTMLButtonElement>(`zone-${index}`));
    this.noticeEl = this.query('notice');
    this.noticeTextEl = this.query('notice-text');
    this.bubbleEl = this.query('bubble');
    this.bubbleEyebrow = this.query('bubble-eyebrow');
    this.bubbleBig = this.query('bubble-big');
    this.bubbleSmall = this.query('bubble-small');
    this.cameraVignette = this.query('camera-vignette');
    this.cameraBadge = this.query('camera-badge');
    this.energyMeter = this.query('energy-meter');
    this.energyFill = this.query('energy-fill');
    this.energyValue = this.query('energy-value');
    this.gengsiMeter = this.query('gengsi-meter');
    this.gengsiFill = this.query('gengsi-fill');
    this.gengsiValue = this.query('gengsi-value');
    this.claimMeter = this.query('claim');
    this.claimFill = this.query('claim-fill');
    this.claimState = this.query('claim-state');
    this.claimSafe = this.query('claim-safe');
    const claimCaptions = this.claimMeter.querySelectorAll<HTMLElement>('.claim-caption span');
    this.claimCaptionLeft = claimCaptions[0] ?? this.claimMeter;
    this.claimCaptionRight = claimCaptions[1] ?? this.claimMeter;
    this.action = this.query<HTMLButtonElement>('action');
    this.actionVerb = this.query('action-verb');
    this.actionSub = this.query('action-sub');
    this.zoneLeft = this.query<HTMLButtonElement>('zone-left');
    this.zoneRight = this.query<HTMLButtonElement>('zone-right');
    this.coffee = this.query<HTMLButtonElement>('coffee');
    this.startOverlay = this.query('start-overlay');
    this.startButton = this.query<HTMLButtonElement>('start');
    this.resultOverlay = this.query('result-overlay');
    this.resultBody = this.query('result-body');
    this.retryButton = this.query<HTMLButtonElement>('retry');
    this.seatSheet = this.query('seat-sheet');
    this.seatTimerBar = this.query('seat-timer');
    this.toast = this.query('viral-toast');
    this.debugEl = this.query('debug');

    this.bindControls();
    this.releaseHold();
  }

  update(state: SimState, now: number, fps: number, drawCalls: number): void {
    const phase = state.phase;
    if (this.lastPhase !== phase) {
      if (phase === 'result' || phase === 'inside' || phase === 'ready') this.releaseHold();
      this.lastPhase = phase;
    }

    this.updateTopbar(state);
    this.updateZones(state);
    this.updateMeters(state);
    this.updateClaim(state);
    this.updateAction(state);
    this.updateBubble(state);
    this.updateNotice(state);
    this.updateCameraWarning(state);
    this.updateOverlays(state, now);
    this.updateDebug(state, fps, drawCalls);
    this.root.classList.toggle('is-result', phase === 'result');
    this.root.classList.toggle('is-seat', phase === 'inside');

    if (this.action.disabled && this.holdActive) this.releaseHold();
  }

  reset(): void {
    this.releaseHold();
    this.lastResultKey = '';
    this.viralRevealAt = null;
    this.lastPhase = null;
    this.app.classList.remove('is-viral');
    this.toast.classList.remove('is-visible');
    this.resultOverlay.classList.remove('is-visible');
    this.seatSheet.classList.remove('is-visible');
    this.startOverlay.classList.remove('is-visible');
    this.cameraVignette.classList.remove('is-visible');
    this.cameraBadge.classList.remove('is-visible');
    this.noticeEl.classList.remove('is-visible');
    this.bubbleEl.classList.remove('is-visible');
  }

  setDebug(visible: boolean): void {
    this.app.classList.toggle('is-debug', visible);
  }

  private template(): string {
    return `
      <div class="topbar">
        <div class="pill"><span class="k">JAM</span><span class="v" id="clock">06:12:00</span></div>
        <div class="pill train"><span class="k">KERETA</span><span class="v" id="train">—</span></div>
        <div class="pill"><span class="k">RUPIAH</span><span class="v" id="money">Rp 15.000</span></div>
      </div>
      <div class="zone-strip" id="zones" aria-label="Zona pintu">
        <span class="zone-label">ZONA</span>
        <button class="zchip" id="zone-0" data-zone="0" disabled>A</button>
        <button class="zchip" id="zone-1" data-zone="1" disabled>B</button>
        <button class="zchip" id="zone-2" data-zone="2" disabled>C</button>
      </div>
      <div class="mid">
        <div class="notice" id="notice" role="status" aria-live="polite"><span id="notice-text"></span></div>
        <div class="bubble" id="bubble">
          <span class="eyebrow" id="bubble-eyebrow"></span>
          <span class="big" id="bubble-big"></span>
          <span class="small" id="bubble-small"></span>
        </div>
      </div>
      <div class="camera-warning-vignette" id="camera-vignette"></div>
      <div class="camera-badge" id="camera-badge" role="status" aria-live="assertive">
        <span class="phone">●</span> MEREKAM · LEPAS / GESER
      </div>
      <div class="bottom">
        <div class="meters">
          <div class="meter" id="energy-meter">
            <div class="row"><span class="name">ENERGI</span><span class="value" id="energy-value">100</span></div>
            <div class="track"><div class="fill" id="energy-fill"></div></div>
          </div>
          <div class="meter gengsi" id="gengsi-meter">
            <div class="row"><span class="name">GENGSI</span><span class="value" id="gengsi-value">100</span></div>
            <div class="track"><div class="fill" id="gengsi-fill"></div></div>
          </div>
        </div>
        <div class="claim-meter" id="claim">
          <div class="claim-row">
            <span class="name">POSISI</span>
            <span class="claim-state" id="claim-state">AMAN</span>
          </div>
          <div class="claim-track">
            <div class="claim-fill" id="claim-fill"></div>
            <div class="claim-safe" id="claim-safe"></div>
            <div class="claim-line"></div>
          </div>
          <div class="claim-caption"><span>BELAKANG</span><span>GARIS KUNING</span></div>
        </div>
        <div class="action-row">
          <button class="coffee" id="coffee">KOPI SUBUH · Rp 10.000</button>
          <button class="zone-btn" id="zone-left" aria-label="Zona sebelumnya" disabled>‹</button>
          <button class="action is-disabled" id="action" aria-label="Tahan" aria-pressed="false" disabled>
            <span class="action-inner">
              <span class="verb" id="action-verb">SIAP</span>
              <span class="sub" id="action-sub">Tunggu aba-aba</span>
            </span>
            <span class="charge-ring" aria-hidden="true"></span>
          </button>
          <button class="zone-btn" id="zone-right" aria-label="Zona berikutnya" disabled>›</button>
        </div>
      </div>

      <div class="overlay is-visible" id="start-overlay">
        <div class="card" role="dialog" aria-modal="true" aria-labelledby="start-title">
          <span class="stamp">Draft 0 · Prototipe</span>
          <h1 id="start-title">PEJUANG<br><span class="thin">NAFKAH</span></h1>
          <p class="lede"><strong>Rebutan Pintu.</strong> Jurangmangu, 06:12. Satu kereta, satu pintu depan, dan orang yang tidak bisa menunggu.</p>
          <div class="rule"><b>1</b><span><strong>Tahan</strong> untuk lawan dorongan. Lepas berarti mundur. Isi penuh lalu lepas = <strong>HENTAK</strong>.</span></div>
          <div class="rule"><b>2</b><span>Pintu depan cuma <strong>perkiraan</strong>. Geser zona saat kereta datang; jangan ketinggalan.</span></div>
          <div class="rule"><b>3</b><span>Jangan serobot ibu hamil atau anak. Kamera bisa merekam. <strong>Gengsi 0 = pulang.</strong></span></div>
          <p class="fine">Lokasi nyata: Jurangmangu, Tangerang Selatan. Tata letak peron disederhanakan; papan pintu adalah perkiraan. Tarif dan harga kopi adalah nilai prototipe. Bukan produk resmi operator.</p>
          <div class="actions">
            <button class="primary" id="start">MULAI DARI PINTU SELATAN</button>
          </div>
          <p class="fine">Satu tangan: tahan tombol, geser kiri/kanan untuk pindah zona. Keyboard: Space tahan, A/D zona, C kopi, 1/2 duduk/berdiri.</p>
          <p class="fine"><a href="./">Buka arena uji dorong &amp; tahan →</a></p>
        </div>
      </div>

      <div class="overlay" id="result-overlay">
        <div class="card" role="dialog" aria-modal="true" aria-labelledby="result-title">
          <div id="result-body"></div>
          <div class="actions">
            <button class="primary" id="retry">COBA LAGI</button>
          </div>
          <p class="fine">Draft 0 · skor bukan final. Jalankan ulang dengan seed yang sama untuk mengulang situasi.</p>
        </div>
      </div>

      <div class="seat-sheet" id="seat-sheet">
        <span class="eyebrow">Kamu masuk pertama</span>
        <h2>Duduk atau berdiri?</h2>
        <p>Kursi dekat pintu menyimpan energi untuk tahap berikutnya. Berdiri di pintu lebih cepat turun, tapi capek.</p>
        <div class="seat-actions">
          <button id="seat-choice">DUDUK<small>+20 energi · posisi kursi</small></button>
          <button id="stand-choice">BERDIRI<small>di pintu / tiang</small></button>
        </div>
        <div class="timer-line"><i id="seat-timer"></i></div>
      </div>

      <div class="toast-viral" id="viral-toast" role="alert">
        <span class="phone-icon">▣</span>
        <strong>Seseorang merekam.</strong>
        <span>Video itu naik. Tidak ada yang tertawa. Gengsi 0.</span>
      </div>
      <pre id="debug"></pre>
    `;
  }

  private bindControls(): void {
    this.startButton.addEventListener('click', () => this.callbacks.onStart());
    this.retryButton.addEventListener('click', () => this.callbacks.onRetry());

    this.action.addEventListener('pointerdown', (event) => {
      if (this.action.disabled) return;
      event.preventDefault();
      this.pointerId = event.pointerId;
      this.pointerStartX = event.clientX;
      this.holdActive = true;
      this.action.setPointerCapture(event.pointerId);
      this.action.classList.add('is-held');
      this.action.setAttribute('aria-pressed', 'true');
      this.callbacks.onHold(true);
    });

    this.action.addEventListener('pointermove', (event) => {
      if (!this.holdActive || event.pointerId !== this.pointerId) return;
      const delta = event.clientX - this.pointerStartX;
      if (Math.abs(delta) > 38) {
        this.callbacks.onZone(delta > 0 ? 1 : -1);
        this.pointerStartX = event.clientX;
      }
    });

    const stop = (event?: PointerEvent) => {
      if (event && this.pointerId !== null && event.pointerId !== this.pointerId) return;
      this.releaseHold();
    };
    this.action.addEventListener('pointerup', stop);
    this.action.addEventListener('pointercancel', stop);
    this.action.addEventListener('lostpointercapture', () => this.releaseHold());
    this.action.addEventListener('click', (event) => event.preventDefault());

    this.zoneLeft.addEventListener('click', () => this.callbacks.onZone(-1));
    this.zoneRight.addEventListener('click', () => this.callbacks.onZone(1));
    this.coffee.addEventListener('click', () => this.callbacks.onCoffee());
    this.chips.forEach((chip, index) => {
      chip.addEventListener('click', () => this.callbacks.onZoneTo(index));
    });
    const seatButton = this.query<HTMLButtonElement>('seat-choice');
    const standButton = this.query<HTMLButtonElement>('stand-choice');
    seatButton.addEventListener('click', () => this.callbacks.onSeat('seat'));
    standButton.addEventListener('click', () => this.callbacks.onSeat('stand'));
  }

  private releaseHold(): void {
    if (!this.holdActive) {
      this.action.classList.remove('is-held');
      this.action.setAttribute('aria-pressed', 'false');
      return;
    }
    this.holdActive = false;
    this.pointerId = null;
    this.action.classList.remove('is-held');
    this.action.setAttribute('aria-pressed', 'false');
    this.callbacks.onHold(false);
  }

  private updateTopbar(state: SimState): void {
    this.clockEl.textContent = formatClock(state.elapsed);
    this.moneyEl.textContent = formatRupiah(state.player.rupiah);
    let train = '—';
    if (state.phase === 'platform' && state.nextTrainTime > 0) {
      train = formatCountdown(state.nextTrainTime - state.elapsed);
    } else if (state.phase === 'arrival') {
      train = 'TIBA';
    } else if (state.phase === 'alight' || state.phase === 'board') {
      train = 'PINTU';
    } else if (state.phase === 'inside') {
      train = 'NAIK';
    } else if (state.phase === 'result' && state.result?.success) {
      train = 'SAMPAI';
    } else if (state.phase === 'missed') {
      train = '—';
    }
    this.trainEl.textContent = train;
    this.trainEl.classList.toggle('is-urgent', state.phase === 'platform' && state.nextTrainTime - state.elapsed < 20);
  }

  private updateZones(state: SimState): void {
    const visible =
      state.phase === 'platform' ||
      state.phase === 'arrival' ||
      state.phase === 'alight' ||
      state.phase === 'board';
    this.zoneStrip.classList.toggle('is-visible', visible);
    const interactive =
      state.phase === 'platform' || state.phase === 'arrival' || state.phase === 'board';
    this.chips.forEach((chip, index) => {
      chip.disabled = !interactive;
      chip.classList.toggle('is-current', state.player.zone === index);
      chip.classList.toggle('is-estimate', !state.trainRevealed && state.estimate === index);
      chip.classList.toggle('is-actual', state.trainRevealed && state.frontZone === index);
    });
    this.zoneLeft.disabled = !interactive || state.player.zone <= 0;
    this.zoneRight.disabled = !interactive || state.player.zone >= 2;
  }

  private updateMeters(state: SimState): void {
    const energy = Math.max(0, Math.min(RUN.maxEnergy, state.player.energy));
    const energyPercent = (energy / RUN.maxEnergy) * 100;
    this.energyFill.style.width = `${energyPercent}%`;
    this.energyValue.textContent = `${Math.round(energy)}`;
    this.energyMeter.classList.toggle('is-low', energy < 30);

    const gengsi = Math.max(0, Math.min(RUN.maxGengsi, state.player.gengsi));
    this.gengsiFill.style.width = `${(gengsi / RUN.maxGengsi) * 100}%`;
    this.gengsiValue.textContent = `${Math.round(gengsi)}`;
    this.gengsiMeter.classList.toggle('is-low', gengsi < 30);
  }

  private updateClaim(state: SimState): void {
    const visible =
      state.phase === 'platform' ||
      state.phase === 'arrival' ||
      state.phase === 'alight' ||
      state.phase === 'board';
    this.claimMeter.classList.toggle('is-visible', visible);
    if (!visible) return;

    const boarding = state.phase === 'board';
    const value = boarding ? state.player.boardProgress : state.player.claim;
    const percent = Math.max(0, Math.min(1, value)) * 100;
    this.claimFill.style.width = `${percent}%`;
    this.claimSafe.style.display = boarding ? 'none' : 'block';
    this.claimCaptionLeft.textContent = boarding ? 'DORONG' : 'BELAKANG';
    this.claimCaptionRight.textContent = boarding ? 'PINTU' : 'GARIS KUNING';

    let text = 'AMAN';
    if (boarding) {
      text = `${Math.round(percent)}% MASUK`;
    } else if (state.player.claim >= 0.9) {
      text = 'DI GARIS';
    } else if (state.player.claim < RUN.claimSafeMin) {
      text = 'TERDESAK';
    } else if (state.crowdPulse > 0.35) {
      text = 'ARUS';
    }
    this.claimState.textContent = text;
    this.claimMeter.classList.toggle('is-low', !boarding && state.player.claim < RUN.claimSafeMin);
    this.claimMeter.classList.toggle('is-pulse', !boarding && state.crowdPulse > 0.35);
  }

  private updateAction(state: SimState): void {
    const config = actionFor(state);
    const disabled = !config.canHold || state.phase === 'inside' || state.phase === 'result' || state.phase === 'ready';
    this.action.disabled = disabled;
    this.action.classList.toggle('is-disabled', disabled);
    this.action.classList.toggle('is-danger', config.danger && !disabled);
    this.action.classList.toggle('is-protect', config.protect && !disabled);
    this.action.classList.toggle('can-charge', config.charge && !disabled);
    this.action.style.setProperty('--charge', `${Math.round(state.player.charge * 100) / 100}`);
    this.actionVerb.textContent = config.label;
    this.actionSub.textContent = config.sub;
    this.action.setAttribute('aria-label', `${config.label}. ${config.sub}`);
    this.action.classList.toggle('is-held', this.holdActive && !disabled);

    const showCoffee =
      state.phase === 'concourse' &&
      state.coffee.available &&
      !state.coffee.bought &&
      state.player.rupiah >= RUN.coffeeCost;
    this.coffee.classList.toggle('is-visible', showCoffee);
  }

  private updateBubble(state: SimState): void {
    let eyebrow = '';
    let big = '';
    let small = '';
    if (state.phase === 'gate') {
      eyebrow = 'ANTREAN GATE';
      big = 'TAHAN UNTUK NYEROBOT';
      small = 'Hemat waktu · gengsi turun';
    } else if (state.phase === 'concourse') {
      eyebrow = 'KOPI SUBUH';
      big = 'OPSIONAL';
      small = 'Energi +40 · waktu -18 dtk';
    } else if (state.phase === 'platform') {
      eyebrow = state.crowdPulse > 0.35 ? 'ARUS KERUMUNAN' : 'PERON 1';
      big = state.crowdPulse > 0.35 ? 'TAHAN' : 'JAGA POSISI';
      small = 'Lepas = mundur · garis kuning di depan';
    } else if (state.phase === 'arrival') {
      if (state.player.zone < state.frontZone) {
        eyebrow = 'PINTU DEPAN';
        big = `ZONA ${zoneName(state.frontZone)}`;
        small = 'Geser ke kanan · pintu tidak di sini';
      } else {
        eyebrow = 'KERETA TIBA';
        big = 'BIAR TURUN DULU';
        small = 'Jangan dorong arus keluar';
      }
    } else if (state.phase === 'alight') {
      eyebrow = 'ALIRAN TURUN';
      big = 'BIAR DULU';
      small = 'Dorong sekarang = gengsi -8';
    } else if (state.phase === 'board') {
      if (!state.player.canBoard) {
        eyebrow = 'TERTINGGAL';
        big = 'TUNGGU KERETA';
        small = 'Peron akan makin padat';
      } else if (state.player.zone < state.frontZone) {
        eyebrow = 'TIDAK ADA PINTU';
        big = `GESER KE ZONA ${zoneName(state.frontZone)}`;
        small = 'Masih sempat · lepas tombol dulu';
      } else if (state.protectWindow > 0 && !state.protectUsed) {
        eyebrow = 'ADA YANG MAU NYEROBOT';
        big = 'LEPAS UNTUK LINDUNGI';
        small = 'Gengsi +12 · energi -24';
      } else if (state.cameraWarning > 0.04) {
        eyebrow = 'KAMERA';
        big = 'LEPAS / GESER';
        small = 'Jangan sampai viral';
      } else if (state.player.charge >= 0.99) {
        eyebrow = 'PENUH';
        big = 'LEPAS = HENTAK';
        small = 'Dorongan besar · energi -24';
      } else {
        eyebrow = 'PINTU DEPAN';
        big = 'TAHAN UNTUK DORONG';
        small = 'Isi penuh lalu lepas = HENTAK';
      }
    }
    const visible = eyebrow !== '';
    this.bubbleEl.classList.toggle('is-visible', visible);
    if (!visible) return;
    this.bubbleEyebrow.textContent = eyebrow;
    this.bubbleBig.textContent = big;
    this.bubbleSmall.textContent = small;
  }

  private updateNotice(state: SimState): void {
    const text = state.phase === 'result' || state.phase === 'inside' ? null : updateNoticeText(state);
    const tone = updateNoticeTone(state);
    this.noticeEl.classList.toggle('is-visible', Boolean(text));
    this.noticeEl.classList.toggle('tone-warn', tone === 'warn');
    this.noticeEl.classList.toggle('tone-good', tone === 'good');
    if (text) this.noticeTextEl.textContent = text;
  }

  private updateCameraWarning(state: SimState): void {
    const warning = state.phase === 'board' ? state.cameraWarning : 0;
    const visible = warning > 0.02 && state.phase !== 'result';
    this.cameraVignette.classList.toggle('is-visible', visible);
    this.cameraBadge.classList.toggle('is-visible', visible);
    this.cameraVignette.style.opacity = visible ? `${0.25 + Math.min(0.75, warning) * 0.75}` : '0';
  }

  private updateOverlays(state: SimState, now: number): void {
    const startVisible = state.phase === 'ready';
    this.startOverlay.classList.toggle('is-visible', startVisible);
    if (startVisible) {
      this.resultOverlay.classList.remove('is-visible');
      this.seatSheet.classList.remove('is-visible');
      this.toast.classList.remove('is-visible');
      return;
    }

    if (state.phase === 'result' && state.result) {
      const key = [
        state.result.success,
        state.result.failReason,
        state.result.score,
        state.result.carRank,
        state.result.rank,
        state.result.spot,
        Math.round(state.result.elapsed),
      ].join('|');
      if (key !== this.lastResultKey) {
        this.lastResultKey = key;
        this.resultBody.innerHTML = this.resultMarkup(state);
        this.app.classList.toggle('is-viral', state.result.failReason === 'viral');
        if (state.result.failReason === 'viral') {
          this.viralRevealAt = now + 1.6;
          this.toast.classList.add('is-visible');
          this.resultOverlay.classList.remove('is-visible');
        } else {
          this.viralRevealAt = null;
          this.toast.classList.remove('is-visible');
          this.resultOverlay.classList.add('is-visible');
        }
        this.seatSheet.classList.remove('is-visible');
        this.retryButton.focus({ preventScroll: true });
      }
      if (this.viralRevealAt !== null) {
        if (now >= this.viralRevealAt) {
          this.viralRevealAt = null;
          this.toast.classList.remove('is-visible');
          this.resultOverlay.classList.add('is-visible');
        } else {
          this.resultOverlay.classList.remove('is-visible');
        }
      }
      return;
    }

    this.resultOverlay.classList.remove('is-visible');
    this.lastResultKey = '';
    this.viralRevealAt = null;
    this.toast.classList.remove('is-visible');
    this.app.classList.remove('is-viral');

    const seatVisible =
      state.phase === 'inside' &&
      state.seatChoice &&
      state.seatAvailable &&
      state.player.spot === null;
    this.seatSheet.classList.toggle('is-visible', seatVisible);
    if (seatVisible) {
      const left = Math.max(0, Math.min(1, state.seatTimer / RUN.insideChoice));
      this.seatTimerBar.style.width = `${left * 100}%`;
      this.seatTimerBar.style.background = left < 0.3 ? 'var(--sambal)' : 'var(--amber)';
    }
  }

  private resultMarkup(state: SimState): string {
    const result = state.result;
    if (!result) return '';
    const viral = result.failReason === 'viral';
    const title = result.success
      ? 'MASUK'
      : viral
        ? 'VIRAL'
        : result.failReason === 'gengsi'
          ? 'GENGSI HABIS'
          : 'KETINGGALAN';
    const sub = result.success
      ? `Kamu masuk kereta. ${result.message}`
      : result.message;
    const score = result.success
      ? `<div class="score-big">${result.score}<small>SKOR</small></div>`
      : `<div class="score-big">—<small>SKOR</small></div>`;

    const viralFrame = viral
      ? `<div class="viral-frame" aria-hidden="true">
          <div class="viral-video">
            <span class="rec">MEREKAM · 00:12</span>
            <div class="freeze"></div>
            <div class="caption">Video dari belakang. Wajah tidak terlihat. Tidak ada yang tertawa.</div>
          </div>
        </div>`
      : '';

    const rows = result.success
      ? `<div class="brow"><span>Posisi</span><b>+${result.positionScore}</b></div>
         <div class="brow"><span>Gerbong</span><b>${carLabel(result.carRank)}</b></div>
         <div class="brow"><span>Urutan</span><b>#${result.rank}</b></div>
         <div class="brow"><span>Tempat</span><b>${spotLabel(result.spot)}</b></div>
         <div class="brow"><span>Gengsi</span><b>${Math.round(result.gengsi)} · +${result.gengsiScore}</b></div>`
      : `<div class="brow"><span>Gerbong</span><b>Tidak masuk</b></div>
         <div class="brow"><span>Urutan</span><b>—</b></div>
         <div class="brow"><span>Tempat</span><b>—</b></div>
         <div class="brow"><span>Gengsi</span><b>${Math.round(result.gengsi)}</b></div>`;

    return `
      <div class="result-head">
        <div>
          <span class="stamp">${result.success ? 'Posisi tercatat' : 'Draft 0 · gagal'}</span>
          <h2 class="result-title ${result.success ? '' : 'is-fail'}" id="result-title">${title}</h2>
          <p class="result-sub">${sub}</p>
        </div>
        ${score}
      </div>
      ${viralFrame}
      <div class="breakdown">${rows}</div>
      <p class="result-note ${result.success ? '' : 'warn'}">${
        result.success
          ? 'Posisi ini disimpan untuk tahap berikutnya. Kursi dekat pintu bukan sekadar cepat turun—energi dan pilihanmu ikut terbawa.'
          : viral
            ? 'Tidak ada reward. Tidak ada close-up korban. Hanya konsekuensi sosial yang tenang.'
            : result.failReason === 'gengsi'
              ? 'Gengsi bisa habis dari keputusan kecil. Coba lagi, jangan serobot yang lemah.'
              : 'Dua gelombang. Kalau kereta pertama lewat, masih ada satu kesempatan—tapi peron makin padat.'
      }</p>
      <p class="fine">Waktu tercatat ${formatClock(result.elapsed)} · energi ${Math.round(result.energy)} · lokasi Jurangmangu (perkiraan).</p>
    `;
  }

  private updateDebug(state: SimState, fps: number, drawCalls: number): void {
    if (!this.app.classList.contains('is-debug')) return;
    this.debugEl.textContent = [
      `phase ${state.phase}  t ${state.elapsed.toFixed(1)}`,
      `claim ${state.player.claim.toFixed(2)}  board ${state.player.boardProgress.toFixed(2)}  charge ${state.player.charge.toFixed(2)}`,
      `energy ${state.player.energy.toFixed(1)}  gengsi ${state.player.gengsi.toFixed(1)}  rp ${state.player.rupiah}`,
      `zone ${state.player.zone}  estimate ${state.estimate}  actual ${state.frontZone}  wave ${state.wave}`,
      `camera ${state.cameraWarning.toFixed(2)}  protect ${state.protectWindow.toFixed(2)}  fps ${fps.toFixed(0)}  draws ${drawCalls}`,
      `seed ${state.seed}`,
    ].join('\n');
  }

  private query<T extends HTMLElement = HTMLElement>(id: string): T {
    const element = this.root.querySelector<T>(`#${id}`);
    if (!element) throw new Error(`Missing HUD element #${id}`);
    return element;
  }
}
