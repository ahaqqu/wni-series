import * as THREE from 'three';
import { createBikePlayer, createGajiToken } from '../entities/meshes';
import type { InputController } from '../core/InputController';
import type { ScoreSystem } from '../systems/ScoreSystem';
import type { TrafficSystem } from '../systems/TrafficSystem';
import type { WeatherSystem } from '../systems/WeatherSystem';
import type { AudioSystem } from '../systems/AudioSystem';
import type { CameraRig } from '../systems/CameraRig';
import type { VfxSystem } from '../systems/VfxSystem';
import { clamp, lerp } from '../utils/math';
import type { ShakeRig } from '../utils/math';

export interface ModeContext {
  mats: import('../world/materials').MaterialKit;
  scene: THREE.Scene;
  input: InputController;
  score: ScoreSystem;
  traffic: TrafficSystem;
  weather: WeatherSystem;
  audio: AudioSystem;
  cameraRig: CameraRig;
  vfx: VfxSystem;
  shake: ShakeRig;
  hitstop: (ms: number) => void;
  isFull: boolean;
}

export interface ModeUpdateResult {
  finished: boolean;
  failed: boolean;
  failReason?: string;
  win?: boolean;
}

interface Token {
  mesh: THREE.Group;
  x: number;
  z: number;
  taken: boolean;
  spin: number;
}

export class MotorcycleMode {
  readonly player: THREE.Group;
  private speed = 16;
  private maxSpeed = 36;
  private x = 0;
  private z = 0;
  private lean = 0;
  private invuln = 0;
  private grip = 1;
  private boostPunch = 0;
  private tokens: Token[] = [];
  private tokenTimer = 0;
  private trail: THREE.Points;
  private trailPositions: Float32Array;
  private trailIndex = 0;
  private readonly trailCount = 100;

  constructor(private readonly ctx: ModeContext) {
    this.player = createBikePlayer(ctx.mats, 0xff6b35);
    this.player.position.set(0, 0, 0);
    ctx.scene.add(this.player);

    this.trailPositions = new Float32Array(this.trailCount * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xff6b35,
      size: 0.28,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.trail = new THREE.Points(geo, mat);
    this.trail.frustumCulled = false;
    ctx.scene.add(this.trail);

    this.seedTokens();
  }

  private seedTokens(): void {
    for (let i = 0; i < 8; i += 1) {
      this.spawnToken(-25 - i * 28);
    }
  }

  private spawnToken(z: number): void {
    const mesh = createGajiToken(this.ctx.mats);
    const x = (Math.random() - 0.5) * 8;
    mesh.position.set(x, 0.7, z);
    this.ctx.scene.add(mesh);
    this.tokens.push({ mesh, x, z, taken: false, spin: Math.random() * Math.PI * 2 });
  }

  reset(): void {
    this.x = 0;
    this.z = 0;
    this.speed = 16;
    this.invuln = 0;
    this.boostPunch = 0;
    this.player.position.set(0, 0, 0);
    this.player.rotation.set(0, 0, 0);
    for (const t of this.tokens) this.ctx.scene.remove(t.mesh);
    this.tokens = [];
    this.seedTokens();
  }

  update(delta: number): ModeUpdateResult {
    const { input, score, traffic, weather, audio, cameraRig, vfx, shake, hitstop, isFull } = this.ctx;

    this.grip = weather.gripScale();
    const steer = input.state.steerX;
    const brake = input.state.brake && input.state.pointerDown;

    // responsive steering with lean
    const steerSpeed = 13.5 * this.grip;
    this.x = clamp(this.x + steer * steerSpeed * delta, -6.4, 6.4);
    this.lean = lerp(this.lean, steer, clamp(delta * 8, 0, 1));

    // speed: brake, boost, base
    const boost = score.boost / 100;
    this.boostPunch = lerp(this.boostPunch, boost, clamp(delta * 5, 0, 1));
    const top = (isFull ? this.maxSpeed : 26) * (1 + boost * 0.42) * (1 - weather.intensity * 0.12);
    const targetSpeed = brake ? 7.5 : top;
    this.speed = lerp(this.speed, targetSpeed, clamp(delta * 3.2, 0, 1));

    // forward into the city (−Z)
    this.z -= this.speed * delta;

    // player transform + lean
    this.player.position.set(this.x, 0, this.z);
    this.player.rotation.z = -this.lean * 0.42;
    this.player.rotation.y = -this.lean * 0.28;
    this.player.rotation.x = brake ? 0.08 : -0.02;

    // trail
    this.trailPositions[this.trailIndex * 3] = this.x;
    this.trailPositions[this.trailIndex * 3 + 1] = 0.35;
    this.trailPositions[this.trailIndex * 3 + 2] = this.z + 0.9;
    this.trailIndex = (this.trailIndex + 1) % this.trailCount;
    (this.trail.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.trail.material as THREE.PointsMaterial).opacity = 0.18 + boost * 0.55;
    (this.trail.material as THREE.PointsMaterial).color.setHex(boost > 0.4 ? 0xffc857 : 0xff6b35);

    // speed lines
    vfx.setSpeedLines(clamp((this.speed - 16) / 22 + boost * 0.5, 0, 1));

    score.tickTravel(delta, this.speed);
    audio.setEngineLoad(brake ? 0.2 : 0.45 + this.speed / 55 + boost * 0.35);

    // traffic density ramps with progress
    const progress = clamp(-this.z / (isFull ? 2200 : 520), 0, 1);
    const density = clamp(0.28 + progress * 0.55 + weather.intensity * 0.18, 0.22, 0.98);
    traffic.update(delta, this.z, density, isFull ? 1 : 0.9);

    // tokens
    this.tokenTimer -= delta;
    if (this.tokenTimer <= 0) {
      this.tokenTimer = 1.6 + Math.random() * 2.2;
      this.spawnToken(this.z - 40 - Math.random() * 30);
    }
    for (let i = this.tokens.length - 1; i >= 0; i -= 1) {
      const t = this.tokens[i];
      if (t.taken) continue;
      t.spin += delta * 3.2;
      t.mesh.rotation.y = t.spin;
      t.mesh.position.y = 0.7 + Math.sin(t.spin) * 0.12;
      // magnet-ish collect
      const dx = t.x - this.x;
      const dz = t.z - this.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 2.2) {
        t.taken = true;
        this.ctx.scene.remove(t.mesh);
        score.addGaji(40, 'Gaji token');
        score.boost = Math.min(100, score.boost + 12);
        vfx.sparkBurst(t.x, 0.8, t.z, 0xffc857);
        vfx.impactRing(t.x, 0.1, t.z, 0xffc857, 0.8);
        audio.nearMiss();
        this.tokens.splice(i, 1);
      } else if (t.z > this.z + 20) {
        this.ctx.scene.remove(t.mesh);
        this.tokens.splice(i, 1);
      }
    }

    if (this.invuln > 0) this.invuln -= delta;

    const { hit, near } = traffic.checkCollision(this.x, this.z, 0.62, 1.15);
    if (near) {
      score.addNearMiss();
      audio.nearMiss();
      vfx.impactRing(near.x, 0.2, near.z, 0x1ec8a5, 1.1);
      vfx.sparkBurst((this.x + near.x) / 2, 0.8, (this.z + near.z) / 2, 0x1ec8a5);
    }
    if (hit && this.invuln <= 0) {
      this.invuln = 1.15;
      const dmg = hit.kind === 'bus' ? 38 : hit.kind === 'truck' ? 32 : 18;
      score.damage(dmg, 'Nabrak kendaraan!');
      audio.crash();
      hitstop(120);
      shake.addTrauma(0.55);
      vfx.damageFlash(0.65);
      vfx.sparkBurst(this.x, 0.7, this.z + 0.5, 0xff6b35);
      vfx.impactRing(this.x, 0.15, this.z, 0xe63946, 1.6);
      this.x += (this.x > hit.x ? 1 : -1) * 1.6;
      this.speed *= 0.42;
      if (score.health <= 0) {
        return { finished: true, failed: true, failReason: 'Health habis — commute berakhir di jalan.' };
      }
    }

    // finish
    const finishZ = isFull ? -2200 : -520;
    if (this.z <= finishZ) {
      score.arrivalBonus(420 + score.timeSec * 1.55);
      vfx.impactRing(0, 0.2, this.z, 0x1ec8a5, 2.4);
      return { finished: true, failed: false, win: true };
    }

    cameraRig.follow(this.player, delta, this.speed / 40, this.boostPunch);
    return { finished: false, failed: false };
  }

  getPosition(): THREE.Vector3 {
    return this.player.position;
  }

  dispose(): void {
    this.ctx.scene.remove(this.player);
    this.ctx.scene.remove(this.trail);
    for (const t of this.tokens) this.ctx.scene.remove(t.mesh);
    this.trail.geometry.dispose();
    (this.trail.material as THREE.Material).dispose();
  }
}
