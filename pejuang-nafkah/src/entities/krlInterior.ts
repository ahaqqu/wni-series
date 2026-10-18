import * as THREE from 'three';
import type { MaterialKit } from '../world/materials';

/**
 * Authored KRL interior coach — seats, poles, hanging straps, doors, windows,
 * route strip. Camera rides inside this during the ride phase.
 */
export function createInteriorCoach(mats: MaterialKit, length = 14): THREE.Group {
  const g = new THREE.Group();
  g.name = 'krlInteriorCoach';

  const W = 3.0;
  const H = 2.55;
  const L = length;

  // floor (anti-slip grey)
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.08, L), mats.get('concrete', 0x5a626c));
  floor.position.y = 0.04;
  floor.receiveShadow = true;
  g.add(floor);

  // ceiling
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(W, 0.08, L), mats.get('paper', 0xe8eef2));
  ceil.position.y = H;
  g.add(ceil);

  // side walls
  for (const x of [-W / 2, W / 2]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.08, H, L), mats.get('vehiclePaint', 0xd0d6dc));
    wall.position.set(x, H / 2, 0);
    wall.receiveShadow = true;
    g.add(wall);
  }

  // end walls
  for (const z of [-L / 2, L / 2]) {
    const end = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.08), mats.get('vehiclePaint', 0xc8ced4));
    end.position.set(0, H / 2, z);
    g.add(end);
    // inter-car door hint
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.9, 0.06), mats.get('metal', 0x8a939c));
    door.position.set(0, 1.05, z + (z > 0 ? -0.08 : 0.08));
    g.add(door);
  }

  // windows — long glass with frames
  const glass = mats.get('glass', 0x7ec8e8);
  for (const x of [-W / 2 - 0.02, W / 2 + 0.02]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.05, L * 0.78), glass);
    win.position.set(x, 1.45, 0);
    g.add(win);
    // window pillars
    for (let i = -2; i <= 2; i += 1) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.12), mats.get('vehicleDark', 0x2a3038));
      pillar.position.set(x, 1.45, i * (L * 0.16));
      g.add(pillar);
    }
  }

  // seats — 2+2 along the coach
  const seatMat = mats.get('fabric', 0x1e5f8c);
  const seatBack = mats.get('fabric', 0x174a70);
  for (let i = -3; i <= 3; i += 1) {
    const z = i * 1.7;
    for (const x of [-1.05, -0.55, 0.55, 1.05]) {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.48), seatMat);
      base.position.set(x, 0.52, z);
      base.castShadow = true;
      g.add(base);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.1), seatBack);
      back.position.set(x, 0.85, z - 0.22);
      g.add(back);
    }
  }

  // grab poles (stanchions)
  const poleMat = mats.get('metal', 0xc0c8d0);
  for (let i = -3; i <= 3; i += 1) {
    for (const x of [-0.85, 0, 0.85]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, H, 10), poleMat);
      pole.position.set(x, H / 2, i * 1.7 + 0.85);
      g.add(pole);
    }
  }

  // horizontal handrails
  for (const x of [-0.85, 0, 0.85]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, L * 0.85, 8), poleMat);
    rail.position.set(x, 2.15, 0);
    rail.rotation.x = Math.PI / 2;
    g.add(rail);
  }

  // hanging straps (tsuriwa)
  const strapMat = mats.get('fabric', 0xf0f4f8);
  for (let i = -4; i <= 4; i += 1) {
    for (const x of [-0.55, 0.55]) {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.04), strapMat);
      strap.position.set(x, 1.95, i * 1.4);
      g.add(strap);
    }
  }

  // passenger doors (sliding) on both sides
  const doorMat = mats.get('metal', 0x9aa4ae);
  for (const x of [-W / 2 - 0.03, W / 2 + 0.03]) {
    for (const z of [-2.2, 2.2]) {
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.0, 1.25), doorMat);
      door.position.set(x, 1.1, z);
      door.name = `coachDoor_${x > 0 ? 'r' : 'l'}_${z > 0 ? 'f' : 'b'}`;
      g.add(door);
      const doorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.85, 0.95), glass);
      doorGlass.position.set(x + (x > 0 ? 0.02 : -0.02), 1.35, z);
      g.add(doorGlass);
    }
  }

  // floor route strip (diegetic map hint)
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, L * 0.8), mats.get('teal', 0x1ec8a5));
  strip.position.set(0, 0.09, 0);
  g.add(strip);

  // LED info bar above doors
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 2.2), mats.get('headlight', 0xffb347));
  led.position.set(0, 2.35, -4);
  g.add(led);
  const led2 = led.clone();
  led2.position.z = 4;
  g.add(led2);

  // poles near doors (priority spots)
  for (const z of [-2.2, 2.2]) {
    for (const x of [-0.55, 0.55]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, H, 10), mats.get('accent', 0xff6b35));
      p.position.set(x, H / 2, z);
      g.add(p);
    }
  }

  return g;
}

/** Exterior platform + train shell used only during boarding. */
export function createPlatformScene(mats: MaterialKit): {
  platform: THREE.Group;
  trainShell: THREE.Group;
} {
  const platform = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.BoxGeometry(16, 0.35, 48), mats.get('concrete', 0x8a929c));
  floor.position.set(0, 0, -10);
  floor.receiveShadow = true;
  platform.add(floor);

  const yellow = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 48), mats.get('accent', 0xf0c040));
  yellow.position.set(-5.4, 0.2, -10);
  platform.add(yellow);

  for (const x of [-8.2, 8.2]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.7, 3.8, 48), mats.get('buildingA', 0x3d4a5c));
    wall.position.set(x, 1.9, -10);
    platform.add(wall);
  }

  for (let i = 0; i < 7; i += 1) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 4.6, 10), mats.get('metal', 0x9aa3ad));
    p.position.set(i % 2 ? -6.4 : 6.4, 2.3, -26 + i * 7);
    platform.add(p);
  }
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(16, 0.18, 48), mats.get('metal', 0x707a86));
  canopy.position.set(0, 4.7, -10);
  platform.add(canopy);

  // station name board
  const board = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.85, 0.14), mats.get('paper', 0xf5f0e6));
  board.position.set(0, 3.5, -18);
  platform.add(board);
  const face = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.55, 0.05), mats.get('teal', 0x1ec8a5));
  face.position.set(0, 3.5, -17.88);
  platform.add(face);

  const trainShell = new THREE.Group();
  for (let i = 0; i < 2; i += 1) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.15, 15.5), mats.get('vehiclePaint', 0xc5cdd6));
    body.position.set(-8.4, 2.15, -6 + i * 16);
    body.castShadow = true;
    trainShell.add(body);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.24, 0.32, 15.52), mats.get('teal', 0x1ec8a5));
    stripe.position.set(-8.4, 1.85, -6 + i * 16);
    trainShell.add(stripe);
    const win = new THREE.Mesh(new THREE.BoxGeometry(3.22, 1.1, 12), mats.get('glass', 0x6ec8e8));
    win.position.set(-8.4, 2.65, -6 + i * 16);
    trainShell.add(win);
  }

  return { platform, trainShell };
}
