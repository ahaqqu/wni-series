import * as THREE from 'three';

export type WeatherState = 'clear' | 'humid' | 'rain';

export class WeatherSystem {
  state: WeatherState = 'clear';
  intensity = 0; // 0..1
  private rain?: THREE.Points;
  private rainVel: Float32Array = new Float32Array(0);
  private targetIntensity = 0;
  private scene?: THREE.Scene;
  private clock = 0;
  private nextSwitch = 25;

  attach(scene: THREE.Scene): void {
    this.scene = scene;
    const count = 1200;
    const positions = new Float32Array(count * 3);
    this.rainVel = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 28;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80 - 20;
      this.rainVel[i] = 18 + Math.random() * 16;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xb8d4ff,
      size: 0.12,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.rain = new THREE.Points(geo, mat);
    this.rain.frustumCulled = false;
    scene.add(this.rain);
  }

  update(delta: number, playerZ: number): void {
    this.clock += delta;
    if (this.clock > this.nextSwitch) {
      this.clock = 0;
      this.nextSwitch = 22 + Math.random() * 28;
      const roll = Math.random();
      if (roll < 0.35) {
        this.state = 'clear';
        this.targetIntensity = 0;
      } else if (roll < 0.65) {
        this.state = 'humid';
        this.targetIntensity = 0.15;
      } else {
        this.state = 'rain';
        this.targetIntensity = 0.75 + Math.random() * 0.25;
      }
      if (this.scene) {
        const fog = this.scene.fog as THREE.Fog;
        const sky = this.state === 'rain' ? 0x6b7c8c : this.state === 'humid' ? 0x9bb0c2 : 0x9bb7d4;
        this.scene.background = new THREE.Color(sky);
        if (fog) fog.color.setHex(sky);
      }
    }

    this.intensity += (this.targetIntensity - this.intensity) * Math.min(1, delta * 0.6);

    if (!this.rain) return;
    const mat = this.rain.material as THREE.PointsMaterial;
    mat.opacity = this.intensity * 0.75;
    mat.size = 0.1 + this.intensity * 0.12;

    const pos = this.rain.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < this.rainVel.length; i += 1) {
      arr[i * 3 + 1] -= this.rainVel[i] * delta * (0.4 + this.intensity);
      arr[i * 3 + 2] += 8 * delta;
      if (arr[i * 3 + 1] < 0) {
        arr[i * 3 + 1] = 24 + Math.random() * 6;
        arr[i * 3] = (Math.random() - 0.5) * 60;
        arr[i * 3 + 2] = playerZ - 30 + Math.random() * 70;
      }
    }
    pos.needsUpdate = true;
    this.rain.position.z = playerZ * 0.15;
  }

  gripScale(): number {
    // rain reduces grip
    return 1 - this.intensity * 0.28;
  }

  crowdBoost(): number {
    return 1 + this.intensity * 0.35;
  }

  dispose(): void {
    if (this.rain && this.scene) {
      this.scene.remove(this.rain);
      this.rain.geometry.dispose();
      (this.rain.material as THREE.Material).dispose();
    }
  }
}
