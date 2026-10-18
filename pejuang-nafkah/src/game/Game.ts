import * as THREE from 'three';
import { Renderer } from '../core/Renderer';
import { Loop } from '../core/Loop';
import { InputController } from '../core/InputController';
import { createMaterialKit } from '../world/materials';
import { JakartaWorld } from '../world/JakartaWorld';
import { SkySystem } from '../world/SkySystem';
import { TrafficSystem } from '../systems/TrafficSystem';
import { WeatherSystem } from '../systems/WeatherSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { AudioSystem } from '../systems/AudioSystem';
import { CameraRig } from '../systems/CameraRig';
import { VfxSystem } from '../systems/VfxSystem';
import { MotorcycleMode, type ModeContext, type ModeUpdateResult } from './MotorcycleMode';
import { KrlMode } from './KrlMode';
import { TweenManager, ShakeRig, formatClock, formatDuration, clamp } from '../utils/math';
import { createSeededRandom } from '../utils/random';

export type GamePhase = 'landing' | 'playing' | 'paused' | 'result';

export interface GameHooks {
  onHud?: (data: HudSnapshot) => void;
  onBanner?: (text: string, kind: 'good' | 'bad' | 'info') => void;
  onResult?: (result: { win: boolean; reason: string; gaji: number; distanceM: number; timeSec: number }) => void;
  onPhase?: (phase: GamePhase) => void;
}

export interface HudSnapshot {
  clock: string;
  gaji: number;
  health: number;
  sanity: number;
  boost: number;
  progress: number;
  zone: string;
  distanceKm: string;
  route: string;
  time: string;
  mode: 'motor' | 'krl';
  krl?: {
    current: string;
    next: string;
    remaining: number;
    lineLabel: string;
    lineColor: string;
    phase: 'board' | 'ride';
    doorTimer: number;
    stationBanner: string;
    progress: number;
    stops: { name: string; mapX: number; mapY: number; t: number; line: string }[];
  };
}

export class Game {
  readonly renderer: Renderer;
  readonly score = new ScoreSystem();
  readonly audio = new AudioSystem();
  readonly input: InputController;
  readonly tweens = new TweenManager();
  readonly shake = new ShakeRig();

  private loop: Loop;
  private mats = createMaterialKit();
  private world: JakartaWorld;
  private sky = new SkySystem();
  private traffic: TrafficSystem;
  private weather = new WeatherSystem();
  private vfx: VfxSystem;
  private cameraRig: CameraRig;
  private mode?: MotorcycleMode | KrlMode;
  private modeType: 'motor' | 'krl' = 'motor';
  private phase: GamePhase = 'landing';
  private hooks: GameHooks = {};
  private sun!: THREE.DirectionalLight;
  private fill!: THREE.DirectionalLight;
  private rim!: THREE.DirectionalLight;
  private readonly rng = createSeededRandom(42);

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.cameraRig = new CameraRig(this.renderer.camera);
    this.input = new InputController(canvas);
    this.traffic = new TrafficSystem(this.mats);
    this.world = new JakartaWorld(this.mats, this.rng);
    this.vfx = new VfxSystem(this.renderer.scene);

    this.setupLights();
    this.weather.attach(this.renderer.scene);
    this.renderer.scene.add(this.world.root);
    this.renderer.scene.add(this.traffic.root);
    this.renderer.scene.add(this.sky.root);

    this.loop = new Loop((delta, elapsed) => this.frame(delta, elapsed));
    this.cameraRig.setOverview(7.2, 14, -18);
    this.installTestHooks();
  }

  private setupLights(): void {
    const scene = this.renderer.scene;
    this.sun = new THREE.DirectionalLight(0xffe6c0, 2.15);
    this.sun.position.set(-35, 48, 22);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 140;
    this.sun.shadow.camera.left = -36;
    this.sun.shadow.camera.right = 36;
    this.sun.shadow.camera.top = 36;
    this.sun.shadow.camera.bottom = -36;
    this.sun.shadow.bias = -0.0004;
    scene.add(this.sun);
    scene.add(this.sun.target);

    this.fill = new THREE.DirectionalLight(0xa8c8ff, 1.05);
    this.fill.position.set(28, 22, -36);
    scene.add(this.fill);

    this.rim = new THREE.DirectionalLight(0x7af0d8, 0.65);
    this.rim.position.set(18, 10, 30);
    scene.add(this.rim);

    scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x6a5238, 1.15));
    scene.add(new THREE.AmbientLight(0x506888, 0.55));
  }

  setHooks(hooks: GameHooks): void {
    this.hooks = hooks;
    this.score.onBanner((text, kind) => hooks.onBanner?.(text, kind));
  }

  start(): void {
    this.loop.start();
  }

  enterLanding(): void {
    this.phase = 'landing';
    this.hooks.onPhase?.('landing');
    this.input.setActive(false);
    this.mode?.dispose();
    this.mode = undefined;
    this.traffic.reset();
  }

  async startRun(mode: 'motor' | 'krl'): Promise<void> {
    try {
      await this.audio.unlock();
    } catch {
      /* autoplay policy */
    }
    this.audio.uiClick();
    this.audio.startEngine();
    this.modeType = mode;
    this.score.reset(mode);
    this.traffic.reset();
    this.mode?.dispose();

    const ctx: ModeContext = {
      mats: this.mats,
      scene: this.renderer.scene,
      input: this.input,
      score: this.score,
      traffic: this.traffic,
      weather: this.weather,
      audio: this.audio,
      cameraRig: this.cameraRig,
      vfx: this.vfx,
      shake: this.shake,
      hitstop: (ms) => this.loop.hitstop(ms),
      isFull: this.score.unlockedFull,
    };

    this.mode = mode === 'motor' ? new MotorcycleMode(ctx) : new KrlMode(ctx);
    this.phase = 'playing';
    this.hooks.onPhase?.('playing');
    this.input.setActive(true);
  }

  pause(): void {
    if (this.phase !== 'playing') return;
    this.phase = 'paused';
    this.hooks.onPhase?.('paused');
    this.input.setActive(false);
    this.audio.setEngineLoad(0.1);
  }

  resume(): void {
    if (this.phase !== 'paused') return;
    this.phase = 'playing';
    this.hooks.onPhase?.('playing');
    this.input.setActive(true);
  }

  restart(): void {
    void this.startRun(this.modeType);
  }

  async quitToMenu(): Promise<void> {
    this.enterLanding();
    this.audio.stopEngine();
    await Promise.resolve();
  }

  unlockFull(): void {
    this.score.unlockFull();
    this.audio.boost();
  }

  private frame(delta: number, elapsed: number): void {
    this.tweens.update(delta);
    this.input.update(delta);
    this.sky.update(elapsed);
    this.sky.setWeather(this.weather.intensity);

    const playerZ = this.mode?.getPosition().z ?? (this.phase === 'landing' ? -20 : 0);
    this.sky.followPlayer(this.mode?.getPosition().x ?? 0, playerZ);

    if (this.phase === 'landing') {
      this.cameraRig.cinematicOrbit(elapsed, 16, 6.2);
      this.traffic.update(delta, -20, 0.42, 0.28);
      this.world.update(-20);
      this.weather.update(delta, -20);
    } else if (this.phase === 'playing' && this.mode) {
      const result: ModeUpdateResult = this.mode.update(delta);
      const pos = this.mode.getPosition();
      this.world.update(pos.z);
      this.weather.update(delta, pos.z);

      this.sun.position.set(pos.x - 32, 46, pos.z + 20);
      this.sun.target.position.set(pos.x, 0, pos.z - 16);
      this.sun.target.updateMatrixWorld();

      this.pushHud();

      if (result.finished) {
        this.input.setActive(false);
        this.phase = 'result';
        this.hooks.onPhase?.('result');
        this.audio.stopEngine();
        this.hooks.onResult?.({
          win: !result.failed,
          reason: result.win
            ? this.modeType === 'krl'
              ? 'Tiba di Dukuh Atas tepat waktu.'
              : 'Tiba di SCBD. Kantor selamat.'
            : result.failReason ?? 'Run berakhir.',
          gaji: this.score.gaji,
          distanceM: this.score.distanceM,
          timeSec: this.score.timeSec,
        });
      }
    } else {
      this.weather.update(delta * 0.2, playerZ);
    }

    // camera shake after follow
    this.shake.update(delta, this.renderer.camera);
    this.vfx.update(delta, this.renderer.camera);
    this.renderer.render();
  }

  private pushHud(): void {
    const finishZ = this.score.unlockedFull ? -2200 : -520;
    const z = this.mode?.getPosition().z ?? 0;
    const progress = clamp(
      this.modeType === 'motor' ? clamp(z / finishZ, 0, 1) : clamp(this.score.timeSec / 55, 0, 1),
      0,
      1,
    );
    const clockMinutes = 420 + this.score.timeSec * 1.55;
    const zone =
      progress < 0.22 ? 'BSD City' : progress < 0.48 ? 'Bintaro' : progress < 0.72 ? 'Manggarai' : 'Semanggi / SCBD';

    let krl: HudSnapshot['krl'];
    if (this.modeType === 'krl' && this.mode && 'getMapState' in this.mode) {
      const m = (this.mode as KrlMode).getMapState();
      krl = {
        current: m.current,
        next: m.next,
        remaining: m.remaining,
        lineLabel: m.lineLabel,
        lineColor: m.lineColor,
        phase: m.phase,
        doorTimer: m.doorTimer,
        stationBanner: m.stationBanner,
        progress: m.progress,
        stops: m.route.map((s) => ({
          name: s.name,
          mapX: s.mapX,
          mapY: s.mapY,
          t: s.t,
          line: s.line,
        })),
      };
    }

    this.hooks.onHud?.({
      clock: formatClock(clockMinutes),
      gaji: this.score.gaji,
      health: this.score.health,
      sanity: this.score.sanity,
      boost: this.score.boost,
      progress: progress * 100,
      zone: this.modeType === 'krl' ? (krl?.current ?? 'KRL Commuter') : zone,
      distanceKm: `${(this.score.distanceM / 1000).toFixed(1)} km`,
      route:
        this.modeType === 'krl'
          ? `${krl?.current ?? 'Naik'} → ${krl?.next ?? '…'}`
          : this.score.unlockedFull
            ? 'BSD → SCBD'
            : 'BSD Trial',
      time: formatDuration(this.score.timeSec),
      mode: this.modeType,
      krl,
    });
  }

  private installTestHooks(): void {
    const game = this;
    (
      window as unknown as {
        __THREE_GAME_TEST_HOOKS__?: Record<string, unknown>;
        __THREE_GAME_DIAGNOSTICS__?: () => unknown;
      }
    ).__THREE_GAME_TEST_HOOKS__ = {
      seed: 42,
      async setState(payload: string | { state?: string; mode?: 'motor' | 'krl' }) {
        const state = typeof payload === 'string' ? payload : (payload?.state ?? 'unknown');
        const mode = typeof payload === 'string' ? 'motor' : (payload?.mode ?? 'motor');
        if (state === 'landing' || state === 'title') {
          game.enterLanding();
          return { state };
        }
        if (state === 'active-play' || state === 'playing') {
          await game.startRun(mode);
          return { state };
        }
        if (state === 'paused') {
          await game.startRun(mode);
          game.pause();
          return { state };
        }
        throw new Error(`Unknown state: ${state}`);
      },
      setPausedForScreenshot(v: boolean) {
        game.loop.setTimeScale(v ? 0 : 1);
        return { ok: true, paused: v };
      },
      setReducedMotion(v: boolean) {
        game.loop.setTimeScale(v ? 0.2 : 1);
        return { ok: true, reduced: v };
      },
      hideDebugUi() {
        return { ok: true };
      },
    };

    (
      window as unknown as { __THREE_GAME_DIAGNOSTICS__?: () => unknown }
    ).__THREE_GAME_DIAGNOSTICS__ = () => {
      const info = game.renderer.renderer.info;
      return {
        phase: game.phase,
        mode: game.modeType,
        calls: info.render.calls,
        triangles: info.render.triangles,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
        programs: info.programs?.length ?? 0,
        dpr: game.renderer.renderer.getPixelRatio(),
        score: game.score.snapshot(),
      };
    };
  }

  dispose(): void {
    this.loop.dispose();
    this.input.dispose();
    this.mode?.dispose();
    this.traffic.dispose();
    this.world.dispose();
    this.sky.dispose();
    this.weather.dispose();
    this.vfx.dispose();
    this.audio.dispose();
    this.mats.dispose();
    this.renderer.dispose();
  }
}
