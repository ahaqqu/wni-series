import * as THREE from 'three';
import type { MaterialKit } from '../world/materials';
import { createVehicleMesh } from '../entities/meshes';

export type TrafficKind = 'car' | 'angkot' | 'bus' | 'taxi' | 'truck' | 'bike';

export interface TrafficUnit {
  mesh: THREE.Group;
  kind: TrafficKind;
  lane: number;
  speed: number;
  x: number;
  z: number;
  halfW: number;
  halfL: number;
  nearMissed: boolean;
  blinker: number; // -1, 0, 1 — emak turn intent
  blinkerTimer: number;
}

const LANE_X = [-4.8, -1.6, 1.6, 4.8];

export class TrafficSystem {
  readonly root = new THREE.Group();
  units: TrafficUnit[] = [];
  private spawnTimer = 0;
  private mats: MaterialKit;
  private playerZ = 0;

  constructor(mats: MaterialKit) {
    this.mats = mats;
    this.root.name = 'Traffic';
  }

  reset(): void {
    for (const u of this.units) {
      this.root.remove(u.mesh);
      u.mesh.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
    }
    this.units = [];
    this.spawnTimer = 0;
    this.playerZ = 0;
    // seed nearby traffic so the first frame already reads as rush hour
    for (let i = 0; i < 10; i += 1) {
      this.spawnOne(-18 - i * 9);
    }
  }

  private spawnOne(forcedZ?: number): void {
    const roll = Math.random();
    let kind: TrafficKind = 'car';
    if (roll > 0.82) kind = 'bus';
    else if (roll > 0.68) kind = 'angkot';
    else if (roll > 0.55) kind = 'taxi';
    else if (roll > 0.48) kind = 'truck';
    else if (roll > 0.4) kind = 'bike';

    const lane = Math.floor(Math.random() * LANE_X.length);
    const paint = [0xd9dde3, 0x2c3e50, 0xe74c3c, 0xf1c40f, 0x27ae60, 0x8e44ad][Math.floor(Math.random() * 6)];
    const mesh = createVehicleMesh(this.mats, {
      kind: kind === 'bike' ? 'bike' : kind === 'bus' ? 'bus' : kind === 'angkot' ? 'angkot' : kind === 'truck' ? 'truck' : kind === 'taxi' ? 'taxi' : 'car',
      paint,
    });
    mesh.position.set(LANE_X[lane], 0, forcedZ ?? (this.playerZ - 90 - Math.random() * 30));
    this.root.add(mesh);

    const halfW = kind === 'bus' ? 1.5 : kind === 'bike' ? 0.45 : 1.05;
    const halfL = kind === 'bus' ? 5.2 : kind === 'bike' ? 0.8 : kind === 'truck' ? 2.8 : kind === 'angkot' ? 2.2 : 1.9;

    this.units.push({
      mesh,
      kind,
      lane,
      speed: kind === 'bus' ? 6 + Math.random() * 3 : kind === 'bike' ? 12 + Math.random() * 5 : 8 + Math.random() * 6,
      x: LANE_X[lane],
      z: mesh.position.z,
      halfW,
      halfL,
      nearMissed: false,
      blinker: Math.random() > 0.82 ? (Math.random() > 0.5 ? 1 : -1) : 0,
      blinkerTimer: 1 + Math.random() * 2,
    });
  }

  update(delta: number, playerZ: number, density: number, speedScale: number): void {
    this.playerZ = playerZ;
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      const n = density > 0.7 ? 2 : 1;
      for (let i = 0; i < n; i += 1) this.spawnOne();
      this.spawnTimer = 0.55 - density * 0.28;
    }

    for (let i = this.units.length - 1; i >= 0; i -= 1) {
      const u = this.units[i];
      u.speed = Math.max(4, u.speed);
      u.z += u.speed * delta * speedScale;
      // emak sudden turn
      if (u.blinker !== 0) {
        u.blinkerTimer -= delta;
        if (u.blinkerTimer <= 0) {
          u.x += u.blinker * 1.6 * delta * 14;
          u.x = Math.max(-6, Math.min(6, u.x));
          u.mesh.rotation.y = u.blinker * 0.25;
        }
      }
      u.mesh.position.set(u.x, 0, u.z);
      if (u.z > playerZ + 35) {
        this.root.remove(u.mesh);
        u.mesh.traverse((o) => {
          if (o instanceof THREE.Mesh) o.geometry.dispose();
        });
        this.units.splice(i, 1);
      }
    }
  }

  /** Returns hit unit or null; also flags near misses. */
  checkCollision(
    playerX: number,
    playerZ: number,
    playerHalfW: number,
    playerHalfL: number,
  ): { hit: TrafficUnit | null; near: TrafficUnit | null } {
    let hit: TrafficUnit | null = null;
    let near: TrafficUnit | null = null;
    for (const u of this.units) {
      const dx = Math.abs(u.x - playerX);
      const dz = Math.abs(u.z - playerZ);
      const overlapX = dx < u.halfW + playerHalfW;
      const overlapZ = dz < u.halfL + playerHalfL;
      if (overlapX && overlapZ) {
        hit = u;
        break;
      }
      if (!u.nearMissed && dz < u.halfL + playerHalfL + 1.2 && dx < u.halfW + playerHalfW + 0.9 && dx > u.halfW + playerHalfW * 0.2) {
        u.nearMissed = true;
        near = u;
      }
    }
    return { hit, near };
  }

  dispose(): void {
    this.reset();
  }
}
