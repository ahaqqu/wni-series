import * as THREE from 'three';
import type { MaterialKit } from './materials';

/**
 * Layered Jakarta street kit:
 * play corridor · near props (speed) · mid (readability) · far (depth)
 */
export class JakartaWorld {
  readonly root = new THREE.Group();
  private segments: THREE.Group[] = [];
  private totalLength = 0;
  private readonly mats: MaterialKit;
  private readonly rng: () => number;
  private readonly segmentLength = 70;
  // shared geometries to keep draw-call / memory budget honest
  private readonly geo = {
    win: new THREE.BoxGeometry(1, 1.6, 0.12),
    building: new THREE.BoxGeometry(1, 1, 1),
    pole: new THREE.CylinderGeometry(0.11, 0.15, 6.2, 7),
    trunk: new THREE.CylinderGeometry(0.2, 0.3, 2.8, 7),
    leaf: new THREE.IcosahedronGeometry(1.7, 1),
    post: new THREE.BoxGeometry(0.18, 0.75, 0.18),
    rail: new THREE.BoxGeometry(0.12, 0.22, 60),
    cone: new THREE.ConeGeometry(0.32, 0.85, 10),
    puddle: new THREE.CircleGeometry(1.8, 20),
  };

  constructor(mats: MaterialKit, rng: () => number) {
    this.mats = mats;
    this.rng = rng;
    this.root.name = 'JakartaWorld';
    this.buildRoadBase();
    for (let i = 0; i < 5; i += 1) this.spawnSegment();
  }

  private buildRoadBase(): void {
    // asphalt plane
    const road = new THREE.Mesh(new THREE.PlaneGeometry(20, 420), this.mats.get('asphalt'));
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -140);
    road.receiveShadow = true;
    this.root.add(road);

    // sidewalk curbs
    for (const x of [-11.2, 11.2]) {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.28, 420), this.mats.get('concrete', 0x8a929c));
      curb.position.set(x, 0.14, -140);
      curb.receiveShadow = true;
      this.root.add(curb);
      const walk = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.2, 420), this.mats.get('sidewalk', 0xa8b0b8));
      walk.position.set(x + Math.sign(x) * 2.4, 0.12, -140);
      walk.receiveShadow = true;
      this.root.add(walk);
    }

    // lane markings — dashed white + yellow center
    const white = this.mats.get('paper', 0xf2ead0);
    const yellow = this.mats.get('accent', 0xf0c040);
    for (let z = 10; z > -400; z -= 7) {
      for (const x of [-3.4, 3.4]) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 3.4), white);
        m.position.set(x, 0.025, z);
        this.root.add(m);
      }
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 3.6), yellow);
      c.position.set(0, 0.025, z);
      this.root.add(c);
    }

    // edge lines
    for (const x of [-6.2, 6.2]) {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 420), white);
      edge.position.set(x, 0.022, -140);
      this.root.add(edge);
    }
  }

  private spawnSegment(): void {
    const baseZ = 10 - this.totalLength;
    const seg = new THREE.Group();
    seg.position.z = baseZ;

    // --- mid: buildings with window grids ---
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i += 1) {
        const w = 8 + this.rng() * 12;
        const h = 12 + this.rng() * 36;
        const d = 10 + this.rng() * 14;
        const x = side * (18 + this.rng() * 16);
        const z = -8 - i * 16;
        const tone = this.rng();
        const role = tone > 0.55 ? 'buildingA' : 'buildingB';
        const color =
          role === 'buildingA'
            ? [0x2f3d4f, 0x3a4a60, 0x44556c, 0x2a3544][Math.floor(this.rng() * 4)]
            : [0x5a4636, 0x6b5240, 0x4a3c30, 0x6e5844][Math.floor(this.rng() * 4)];
        const b = new THREE.Mesh(this.geo.building, this.mats.get(role, color));
        b.scale.set(w, h, d);
        b.position.set(x, h / 2, z);
        b.castShadow = true;
        b.receiveShadow = true;
        seg.add(b);

        // single tall glass strip per face (cheap window read)
        const win = new THREE.Mesh(this.geo.win, this.mats.get('glass', 0x6ec8e8));
        win.scale.set(w * 0.78, h * 0.62, 1);
        win.position.set(x - side * (w / 2 + 0.04), h * 0.55, z);
        win.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        seg.add(win);

        // rooftop unit
        if (this.rng() > 0.5) {
          const ac = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 2.2), this.mats.get('metal', 0x8a939e));
          ac.position.set(x + (this.rng() - 0.5) * 3, h + 0.6, z + (this.rng() - 0.5) * 3);
          seg.add(ac);
        }
        // antenna
        if (h > 28 && this.rng() > 0.6) {
          const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 6, 6), this.mats.get('metal'));
          ant.position.set(x, h + 3, z);
          seg.add(ant);
          const light = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), this.mats.get('taillight'));
          light.position.set(x, h + 6, z);
          seg.add(light);
        }
      }
    }

    // --- near: street furniture ---
    for (let i = 0; i < 4; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const z = -8 - i * 16;

      const trunk = new THREE.Mesh(this.geo.trunk, this.mats.get('buildingB', 0x5c4030));
      trunk.position.set(side * 10.4, 1.5, z);
      trunk.castShadow = true;
      seg.add(trunk);
      const leaf = new THREE.Mesh(this.geo.leaf, this.mats.get('foliage', 0x2f9a52));
      leaf.position.set(side * 10.4, 3.7, z);
      leaf.castShadow = true;
      seg.add(leaf);

      const pole = new THREE.Mesh(this.geo.pole, this.mats.get('metal', 0x707a86));
      pole.position.set(side * 12.3, 3.1, z + 8);
      seg.add(pole);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.12, 0.3), this.mats.get('headlight', 0xffe6b0));
      lamp.position.set(side * 11.55, 6.05, z + 8);
      seg.add(lamp);
    }

    // billboards
    if (this.rng() > 0.45) {
      const side = this.rng() > 0.5 ? 1 : -1;
      const board = new THREE.Group();
      const panel = new THREE.Mesh(new THREE.BoxGeometry(7, 3.4, 0.25), this.mats.get('paper', 0xf0e6d0));
      panel.position.y = 6.5;
      board.add(panel);
      const face = new THREE.Mesh(new THREE.BoxGeometry(6.5, 2.9, 0.08), this.mats.get('accent', 0xff6b35));
      face.position.set(0, 6.5, 0.18);
      board.add(face);
      const pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 6.5, 8), this.mats.get('metal'));
      pole1.position.set(-2.2, 3.2, 0);
      board.add(pole1);
      const pole2 = pole1.clone();
      pole2.position.x = 2.2;
      board.add(pole2);
      board.position.set(side * 15, 0, -22);
      board.rotation.y = side > 0 ? -0.35 : 0.35;
      seg.add(board);
    }

    // guardrail — long strips instead of many posts
    for (const x of [-7.2, 7.2]) {
      const rail = new THREE.Mesh(this.geo.rail, this.mats.get('metal', 0xb0b8c0));
      rail.position.set(x, 0.75, -30);
      seg.add(rail);
      for (let i = 0; i < 4; i += 1) {
        const post = new THREE.Mesh(this.geo.post, this.mats.get('metal', 0x9aa3ad));
        post.position.set(x, 0.45, -8 - i * 15);
        seg.add(post);
      }
    }

    // pothole / puddle hazard markers
    if (this.rng() > 0.5) {
      const px = (this.rng() - 0.5) * 8;
      const pz = -12 - this.rng() * 35;
      const puddle = new THREE.Mesh(new THREE.CircleGeometry(1.6 + this.rng() * 1.2, 20), this.mats.get('glass', 0x3d6a9a));
      puddle.rotation.x = -Math.PI / 2;
      puddle.position.set(px, 0.04, pz);
      puddle.scale.set(1, 0.7, 1);
      seg.add(puddle);
      // splash ring
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.85, 24), this.mats.get('paper', 0x88c0e0));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(px, 0.045, pz);
      seg.add(ring);
    }

    // construction cone cluster (hazard family)
    if (this.rng() > 0.62) {
      const cx = (this.rng() - 0.5) * 7;
      for (let i = 0; i < 3; i += 1) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.85, 10), this.mats.get('accent', 0xff6b35));
        cone.position.set(cx + (i - 1) * 1.1, 0.42, -28 - this.rng() * 8);
        cone.castShadow = true;
        seg.add(cone);
        const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 12), this.mats.get('paper', 0xffffff));
        stripe.position.copy(cone.position);
        stripe.position.y = 0.45;
        stripe.rotation.x = Math.PI / 2;
        seg.add(stripe);
      }
    }

    this.root.add(seg);
    this.segments.push(seg);
    this.totalLength += this.segmentLength;
  }

  update(playerZ: number): void {
    while (this.totalLength + playerZ < 180) this.spawnSegment();
    for (let i = this.segments.length - 1; i >= 0; i -= 1) {
      const seg = this.segments[i];
      if (seg.position.z > playerZ + 55) {
        this.root.remove(seg);
        // shared geometries are owned by this.geo — do not dispose per segment
        this.segments.splice(i, 1);
      }
    }
  }

  dispose(): void {
    for (const g of Object.values(this.geo)) g.dispose();
    this.root.clear();
  }
}
