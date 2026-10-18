import * as THREE from 'three';
import { clamp, lerp } from '../utils/math';

export class CameraRig {
  private readonly offset = new THREE.Vector3(0, 4.35, 7.2);
  private readonly lookOffset = new THREE.Vector3(0, 1.15, -11);
  private fovBase = 64;
  private fovPunch = 0;
  private desired = new THREE.Vector3();
  private lookAt = new THREE.Vector3();
  private bank = 0;

  constructor(private readonly camera: THREE.PerspectiveCamera) {}

  follow(target: THREE.Object3D, delta: number, speed01: number, boost: number): void {
    // lateral lag makes weaving feel punchy
    const lateral = target.position.x * 0.55;
    this.desired.set(
      lateral,
      this.offset.y + target.position.y * 0.1 + speed01 * 0.35,
      target.position.z + this.offset.z,
    );
    this.camera.position.lerp(this.desired, clamp(delta * 6.2, 0, 1));

    this.lookAt.set(
      target.position.x * 0.78,
      target.position.y + this.lookOffset.y,
      target.position.z + this.lookOffset.z,
    );
    this.camera.lookAt(this.lookAt);

    // subtle bank with steer
    this.bank = lerp(this.bank, -target.rotation.z * 0.35, clamp(delta * 5, 0, 1));
    this.camera.rotation.z += this.bank;

    this.fovPunch = lerp(this.fovPunch, boost * 14 + speed01 * 6, clamp(delta * 5, 0, 1));
    this.camera.fov = this.fovBase + this.fovPunch;
    this.camera.updateProjectionMatrix();
  }

  setOverview(height: number, z: number, lookZ: number): void {
    this.camera.position.set(0, height, z);
    this.camera.lookAt(0, 1.5, lookZ);
    this.camera.fov = 55;
    this.camera.updateProjectionMatrix();
  }

  /** Snap camera inside the KRL coach. */
  setInterior(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
    this.camera.lookAt(x * 0.3, 1.25, z - 6);
    this.camera.fov = 68;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Interior follow: sit slightly behind/above the player, looking down the coach.
   * inertia tilts the view so gas/brake reads as physical force.
   */
  followInterior(target: THREE.Object3D, delta: number, inertia: number, routeT: number): void {
    const behind = 2.6;
    const height = 1.62;
    this.desired.set(
      target.position.x * 0.55,
      height + Math.sin(routeT * Math.PI * 2) * 0.02,
      target.position.z + behind,
    );
    this.camera.position.lerp(this.desired, clamp(delta * 4.5, 0, 1));

    this.lookAt.set(
      target.position.x * 0.35,
      1.22,
      target.position.z - 5.5,
    );
    this.camera.lookAt(this.lookAt);
    this.camera.rotation.z += -inertia * 0.12;
    this.camera.fov = lerp(this.camera.fov, 68 + Math.abs(inertia) * 4, clamp(delta * 4, 0, 1));
    this.camera.updateProjectionMatrix();
  }

  cinematicOrbit(elapsed: number, radius = 16, height = 6): void {
    const x = Math.sin(elapsed * 0.11) * radius;
    const z = Math.cos(elapsed * 0.11) * radius - 6;
    this.camera.position.set(x, height + Math.sin(elapsed * 0.18) * 1.1, z);
    this.camera.lookAt(0, 1.4, -8);
    this.camera.fov = 52;
    this.camera.updateProjectionMatrix();
  }
}
