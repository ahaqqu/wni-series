import * as THREE from 'three';
import { createPassengerMesh } from '../entities/meshes';
import { createInteriorCoach, createPlatformScene } from '../entities/krlInterior';
import type { ModeContext, ModeUpdateResult } from './MotorcycleMode';
import { clamp, lerp } from '../utils/math';
import {
  getRoute,
  currentStationName,
  nextStationName,
  stationsRemaining,
  LINE_META,
  type KrlStation,
} from './krlRoute';

interface CrowdMember {
  mesh: THREE.Group;
  x: number;
  z: number;
  vx: number;
  vz: number;
}

export interface KrlMapState {
  route: KrlStation[];
  progress: number;
  current: string;
  next: string;
  remaining: number;
  lineLabel: string;
  lineColor: string;
  phase: 'board' | 'ride';
  doorTimer: number;
  stationBanner: string;
}

/**
 * KRL mode:
 *  1) Platform boarding (real station feel, door timer)
 *  2) Interior coach ride — camera INSIDE the train, live map along real stations
 */
export class KrlMode {
  readonly player: THREE.Group;
  private phase: 'board' | 'ride' = 'board';
  private x = 0;
  private z = 0;
  private inertia = 0;
  private inertiaDir = 1;
  private inertiaTimer = 2.8;
  private doorTimer = 14;
  private crowd: CrowdMember[] = [];
  private coach!: THREE.Group;
  private platform!: THREE.Group;
  private trainShell!: THREE.Group;
  private oxygen = 100;
  private dignity = 100;
  private routeProgress = 0;
  private stationBanner = '';
  private bannerTimer = 0;
  private lastStation = '';
  private readonly route: KrlStation[];
  private interiorCam = true;

  constructor(private readonly ctx: ModeContext) {
    this.route = getRoute(ctx.isFull);
    this.player = createPassengerMesh(ctx.mats, 0xff6b35, 0x1b2735);
    this.player.position.set(0, 0, 4);
    this.player.scale.setScalar(1.05);
    ctx.scene.add(this.player);
    this.buildWorld();
  }

  private buildWorld(): void {
    const { mats, scene } = this.ctx;

    const built = createPlatformScene(mats);
    this.platform = built.platform;
    this.trainShell = built.trainShell;
    scene.add(this.platform);
    scene.add(this.trainShell);

    // interior coach — hidden until boarding completes
    this.coach = createInteriorCoach(mats, 14);
    this.coach.visible = false;
    this.coach.position.set(0, 0, 0);
    scene.add(this.coach);

    // platform crowd
    for (let i = 0; i < 26; i += 1) {
      const shirt = [0x2c3e50, 0x1ec8a5, 0xff6b35, 0xf4d35e, 0xe63946, 0x9b59b6, 0x3498db][i % 7];
      const mesh = createPassengerMesh(mats, shirt, 0x222222);
      const x = (Math.random() - 0.5) * 10;
      const z = -20 + Math.random() * 28;
      mesh.position.set(x, 0, z);
      mesh.rotation.y = Math.random() * Math.PI * 2;
      scene.add(mesh);
      this.crowd.push({ mesh, x, z, vx: (Math.random() - 0.5) * 0.35, vz: (Math.random() - 0.5) * 0.35 });
    }

    this.stationBanner = this.route[0]?.name ?? 'Stasiun';
  }

  reset(): void {
    this.phase = 'board';
    this.interiorCam = true;
    this.x = 0;
    this.z = 4;
    this.doorTimer = 14;
    this.oxygen = 100;
    this.dignity = 100;
    this.routeProgress = 0;
    this.player.position.set(0, 0, 4);
    this.coach.visible = false;
    this.trainShell.visible = true;
    this.platform.visible = true;
  }

  getMapState(): KrlMapState {
    const line = this.route[0]?.line ?? 'green';
    return {
      route: this.route,
      progress: this.routeProgress,
      current: currentStationName(this.route, this.routeProgress),
      next: nextStationName(this.route, this.routeProgress),
      remaining: stationsRemaining(this.route, this.routeProgress),
      lineLabel: LINE_META[line].label,
      lineColor: LINE_META[line].color,
      phase: this.phase,
      doorTimer: Math.max(0, this.doorTimer),
      stationBanner: this.stationBanner,
    };
  }

  update(delta: number): ModeUpdateResult {
    const { input } = this.ctx;
    const steer = input.state.steerX;
    const brace = input.state.brake && input.state.pointerDown;

    this.bannerTimer = Math.max(0, this.bannerTimer - delta);

    if (this.phase === 'board') {
      return this.updateBoarding(delta, steer, brace);
    }
    return this.updateRide(delta, steer, brace);
  }

  private updateBoarding(delta: number, steer: number, brace: boolean): ModeUpdateResult {
    const { score, cameraRig, shake, hitstop } = this.ctx;

    this.doorTimer -= delta;
    this.x = clamp(this.x + steer * 7.2 * delta, -5.2, 5.2);
    this.z = clamp(this.z + (brace ? -2.5 : -0.6) * delta * (0.55 + Math.abs(steer)), -6, 8);
    this.player.position.set(this.x, 0, this.z);
    this.player.rotation.y = lerp(this.player.rotation.y, -steer * 0.5, delta * 6);

    let crush = 0;
    for (const c of this.crowd) {
      const dx = c.x - this.x;
      const dz = c.z - this.z;
      if (Math.hypot(dx, dz) < 1.2) crush += 1;
      c.vx += (-6.8 - c.x) * 0.02 * delta * 8;
      c.vz += (-1.5 - c.z) * 0.015 * delta * 6;
      c.vx = lerp(c.vx, 0, delta * 0.5);
      c.vz = lerp(c.vz, 0, delta * 0.5);
      c.x = clamp(c.x + c.vx * delta * 6, -5.5, 5.5);
      c.z = clamp(c.z + c.vz * delta * 6, -22, 10);
      c.mesh.position.set(c.x, 0, c.z);
    }

    if (crush > 0) {
      score.drainSanity(delta * crush * 2.2);
      this.oxygen = Math.max(0, this.oxygen - delta * crush * 3.5);
      if (Math.random() < 0.03) this.ctx.audio.crowd();
    } else {
      this.oxygen = Math.min(100, this.oxygen + delta * 8);
      score.restoreSanity(delta * 2);
    }

    // enter train near door (left side of platform = train)
    if (this.x < -3.4 || this.doorTimer <= 0) {
      if (this.doorTimer <= 0 && this.x > -3.4) {
        score.damage(18, 'Ketinggalan pintu!');
        hitstop(110);
        shake.addTrauma(0.4);
        return {
          finished: true,
          failed: true,
          failReason: `Pintu di ${this.route[0]?.name ?? 'stasiun'} tertutup. Kamu belum naik.`,
        };
      }
      this.enterTrain();
    }

    // exterior chase camera while boarding
    cameraRig.follow(this.player, delta, 0.16, 0);
    score.tickTravel(delta, 1.5);
    return { finished: false, failed: false };
  }

  private enterTrain(): void {
    const { score, audio, vfx, cameraRig } = this.ctx;
    this.phase = 'ride';
    this.interiorCam = true;
    this.trainShell.visible = false;
    this.platform.visible = false;
    this.coach.visible = true;

    // move platform crowd into coach as standing passengers
    for (const c of this.crowd) {
      c.x = (Math.random() - 0.5) * 2.2;
      c.z = (Math.random() - 0.5) * 10;
      c.mesh.position.set(c.x, 0, c.z);
      c.mesh.rotation.y = Math.random() * Math.PI * 2;
    }

    this.x = 0;
    this.z = 0;
    this.player.position.set(0, 0, 0);
    score.addGaji(150, `Naik di ${this.route[0]?.name ?? 'stasiun'}`);
    audio.boost();
    audio.trainBrake();
    vfx.sparkBurst(0, 1, 0, 0x1ec8a5);
    this.stationBanner = `Menuju ${nextStationName(this.route, 0)}`;
    this.bannerTimer = 2.4;
    // snap camera inside immediately
    cameraRig.setInterior(0, 1.55, 3.2);
  }

  private updateRide(delta: number, steer: number, brace: boolean): ModeUpdateResult {
    const { score, audio, cameraRig, weather, vfx, shake, hitstop, isFull } = this.ctx;

    // route progress — train moving between real stations
    const speed = isFull ? 0.028 : 0.042;
    this.routeProgress = clamp(this.routeProgress + delta * speed * (1 + score.boost / 220), 0, 1);

    // station arrival banner
    for (const s of this.route) {
      if (this.routeProgress >= s.t && this.lastStation !== s.id) {
        this.lastStation = s.id;
        this.stationBanner = s.note ? `${s.name} · ${s.note}` : s.name;
        this.bannerTimer = 2.2;
        audio.trainBrake();
        score.addGaji(80, `Tiba ${s.name}`);
        vfx.impactRing(this.x, 0.1, this.z, 0x1ec8a5, 1.2);
        // brief crowd surge at stations
        for (const c of this.crowd) {
          c.vx += (Math.random() - 0.5) * 1.2;
          c.vz += (Math.random() - 0.5) * 1.2;
        }
      }
    }

    // inertia / gas-brake events
    this.inertiaTimer -= delta;
    if (this.inertiaTimer <= 0) {
      this.inertiaTimer = 2.8 + Math.random() * 2.6;
      this.inertiaDir = Math.random() > 0.5 ? 1 : -1;
      this.inertia = this.inertiaDir * (0.9 + Math.random() * 1.5) * weather.crowdBoost();
      audio.trainBrake();
      shake.addTrauma(0.1);
    }
    this.inertia = lerp(this.inertia, 0, delta * 0.95);

    let effectiveInertia = this.inertia;
    if (brace) {
      effectiveInertia *= 0.15;
      score.restoreSanity(delta * 1.8);
      this.oxygen = Math.min(100, this.oxygen + delta * 2.2);
    } else {
      this.oxygen = Math.max(0, this.oxygen - delta * 1.1 * weather.crowdBoost());
      score.drainSanity(delta * 1.0);
    }

    // move inside coach (x = lateral aisle, z = along coach)
    this.x = clamp(this.x + effectiveInertia * delta * 4.2 + steer * 1.8 * delta, -1.15, 1.15);
    this.z = clamp(this.z + steer * 0.2 * delta + (brace ? 0.35 : 0.12) * delta, -5.5, 5.5);
    this.player.position.set(this.x, 0, this.z);
    this.player.rotation.z = -effectiveInertia * 0.32;
    this.player.rotation.y = lerp(this.player.rotation.y, steer * 0.4, delta * 5);

    // crowd inside coach
    for (const c of this.crowd) {
      c.vx += effectiveInertia * 0.4 * delta;
      c.vx = lerp(c.vx, 0, delta * 1.2);
      c.vz = lerp(c.vz, 0, delta * 1.2);
      c.x = clamp(c.x + c.vx * delta * 3.5 + steer * 0.02, -1.2, 1.2);
      c.z = clamp(c.z + c.vz * delta * 3, -5.8, 5.8);
      c.mesh.position.set(c.x, 0, c.z);
    }

    // crush / oxygen
    let crush = 0;
    for (const c of this.crowd) {
      if (Math.hypot(c.x - this.x, c.z - this.z) < 1.05) crush += 1;
    }
    if (crush > 1) {
      this.oxygen = Math.max(0, this.oxygen - delta * crush * 2.2);
      score.drainSanity(delta * crush * 1.2);
    }

    if (Math.abs(effectiveInertia) > 1.15 && !brace) {
      this.dignity = Math.max(0, this.dignity - delta * 20);
      score.damage(delta * 14, 'Terjatuh di gerbong!');
      if (Math.random() < 0.12) {
        shake.addTrauma(0.22);
        hitstop(50);
      }
    } else if (brace && Math.abs(this.inertia) > 0.5) {
      score.addGaji(delta * 12, 'Bertahan di rem');
    }

    // handrail / poles
    const nearPole = Math.abs(this.x) < 0.35 || Math.abs(Math.abs(this.x) - 0.85) < 0.25;
    if (nearPole) {
      this.oxygen = Math.min(100, this.oxygen + delta * 9);
      score.restoreSanity(delta * 3);
    }

    score.tickTravel(delta, isFull ? 22 : 16);

    // INTERIOR camera — look down the coach at player + crowd
    if (this.interiorCam) {
      cameraRig.followInterior(
        this.player,
        delta,
        effectiveInertia,
        this.routeProgress,
      );
    } else {
      cameraRig.follow(this.player, delta, 0.2, Math.abs(effectiveInertia) * 0.1);
    }

    if (this.dignity <= 0 || this.oxygen <= 0) {
      return {
        finished: true,
        failed: true,
        failReason:
          this.oxygen <= 0
            ? 'Oksigen habis di kerumunan gerbong.'
            : 'Harga diri hancur — kamu jatuh berulang kali.',
      };
    }

    if (this.routeProgress >= 1) {
      const dest = this.route[this.route.length - 1]?.name ?? 'tujuan';
      score.arrivalBonus(420 + score.timeSec * 1.55);
      score.addGaji(100, `Turun di ${dest}`);
      vfx.impactRing(0, 0.2, this.z, 0xffc857, 2.2);
      return { finished: true, failed: false, win: true };
    }

    return { finished: false, failed: false };
  }

  getPosition(): THREE.Vector3 {
    return this.player.position;
  }

  dispose(): void {
    const { scene } = this.ctx;
    scene.remove(this.player);
    scene.remove(this.coach);
    scene.remove(this.platform);
    scene.remove(this.trainShell);
    for (const c of this.crowd) scene.remove(c.mesh);
    this.crowd = [];
  }
}
