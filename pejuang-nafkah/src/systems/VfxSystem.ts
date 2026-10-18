import * as THREE from 'three';

/** Pooled event VFX: boost trail, impact ring, collect burst, speed lines. */
export class VfxSystem {
  readonly root = new THREE.Group();
  private readonly rings: THREE.Mesh[] = [];
  private readonly sparks: THREE.Points[] = [];
  private readonly speedLines: THREE.LineSegments;
  private ringPool = 0;
  private sparkPool = 0;
  private flash: THREE.Mesh;
  private flashOpacity = 0;

  constructor(scene: THREE.Scene) {
    // impact rings
    const ringGeo = new THREE.RingGeometry(0.2, 0.55, 24);
    for (let i = 0; i < 12; i += 1) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xff6b35,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const m = new THREE.Mesh(ringGeo, mat);
      m.rotation.x = -Math.PI / 2;
      m.visible = false;
      this.rings.push(m);
      this.root.add(m);
    }

    // spark bursts
    for (let i = 0; i < 8; i += 1) {
      const count = 24;
      const pos = new Float32Array(count * 3);
      const vel = new Float32Array(count * 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color: 0xffc857,
        size: 0.18,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const pts = new THREE.Points(geo, mat);
      pts.visible = false;
      pts.userData = { vel, life: 0 };
      this.sparks.push(pts);
      this.root.add(pts);
    }

    // speed lines (camera-facing dashes)
    const lineCount = 40;
    const linePos = new Float32Array(lineCount * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    this.speedLines = new THREE.LineSegments(
      lineGeo,
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.speedLines.frustumCulled = false;
    this.root.add(this.speedLines);

    // damage flash quad
    this.flash = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 4),
      new THREE.MeshBasicMaterial({
        color: 0xe63946,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
      }),
    );
    this.flash.position.z = -2;
    this.flash.renderOrder = 999;
    scene.add(this.flash);
    scene.add(this.root);
  }

  impactRing(x: number, y: number, z: number, color = 0xff6b35, scale = 1): void {
    const m = this.rings[this.ringPool % this.rings.length];
    this.ringPool += 1;
    m.visible = true;
    m.position.set(x, y + 0.15, z);
    m.scale.setScalar(0.3 * scale);
    (m.material as THREE.MeshBasicMaterial).color.setHex(color);
    (m.material as THREE.MeshBasicMaterial).opacity = 0.95;
    m.userData.life = 0.45;
    m.userData.scaleTo = 2.8 * scale;
  }

  sparkBurst(x: number, y: number, z: number, color = 0xffc857): void {
    const pts = this.sparks[this.sparkPool % this.sparks.length];
    this.sparkPool += 1;
    pts.visible = true;
    pts.position.set(x, y, z);
    const pos = pts.geometry.getAttribute('position') as THREE.BufferAttribute;
    const vel = pts.userData.vel as Float32Array;
    for (let i = 0; i < pos.count; i += 1) {
      pos.setXYZ(i, 0, 0, 0);
      vel[i * 3] = (Math.random() - 0.5) * 8;
      vel[i * 3 + 1] = Math.random() * 6;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    pos.needsUpdate = true;
    (pts.material as THREE.PointsMaterial).color.setHex(color);
    (pts.material as THREE.PointsMaterial).opacity = 1;
    pts.userData.life = 0.55;
  }

  damageFlash(strength = 0.55): void {
    this.flashOpacity = Math.min(0.7, strength);
    (this.flash.material as THREE.MeshBasicMaterial).opacity = this.flashOpacity;
  }

  setSpeedLines(intensity: number): void {
    const mat = this.speedLines.material as THREE.LineBasicMaterial;
    mat.opacity = intensity * 0.35;
    const pos = this.speedLines.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < 40; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (3.5 + Math.random() * 5);
      const y = Math.random() * 3;
      const z = -2 - Math.random() * 18;
      const len = 1.2 + intensity * 2.5;
      arr[i * 6] = x;
      arr[i * 6 + 1] = y;
      arr[i * 6 + 2] = z;
      arr[i * 6 + 3] = x;
      arr[i * 6 + 4] = y;
      arr[i * 6 + 5] = z - len;
    }
    pos.needsUpdate = true;
  }

  update(delta: number, camera: THREE.Camera): void {
    // rings
    for (const m of this.rings) {
      if (!m.visible) continue;
      const life = (m.userData.life as number) - delta;
      m.userData.life = life;
      const t = 1 - Math.max(0, life) / 0.45;
      const target = (m.userData.scaleTo as number) ?? 2;
      m.scale.setScalar(0.3 + t * target);
      (m.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.95 * (1 - t));
      if (life <= 0) m.visible = false;
    }

    // sparks
    for (const pts of this.sparks) {
      if (!pts.visible) continue;
      const life = (pts.userData.life as number) - delta;
      pts.userData.life = life;
      const pos = pts.geometry.getAttribute('position') as THREE.BufferAttribute;
      const vel = pts.userData.vel as Float32Array;
      for (let i = 0; i < pos.count; i += 1) {
        vel[i * 3 + 1] -= 12 * delta;
        pos.setXYZ(
          i,
          pos.getX(i) + vel[i * 3] * delta,
          pos.getY(i) + vel[i * 3 + 1] * delta,
          pos.getZ(i) + vel[i * 3 + 2] * delta,
        );
      }
      pos.needsUpdate = true;
      (pts.material as THREE.PointsMaterial).opacity = Math.max(0, life / 0.55);
      if (life <= 0) pts.visible = false;
    }

    // flash follows camera
    this.flash.position.copy(camera.position);
    this.flash.quaternion.copy(camera.quaternion);
    this.flash.translateZ(-2.2);
    if (this.flashOpacity > 0) {
      this.flashOpacity = Math.max(0, this.flashOpacity - delta * 2.2);
      (this.flash.material as THREE.MeshBasicMaterial).opacity = this.flashOpacity * 0.55;
    }

    // speed lines follow camera
    this.speedLines.position.copy(camera.position);
    this.speedLines.quaternion.copy(camera.quaternion);
  }

  dispose(): void {
    this.root.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Points || o instanceof THREE.LineSegments) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
    });
  }
}
