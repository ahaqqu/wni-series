import * as THREE from 'three';
import type { MaterialKit } from '../world/materials';

export type VehicleKind = 'bike' | 'car' | 'angkot' | 'bus' | 'taxi' | 'truck' | 'scooter';

function box(
  parent: THREE.Object3D,
  mats: MaterialKit,
  role: Parameters<MaterialKit['get']>[0],
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  color?: number,
  rot?: [number, number, number],
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats.get(role, color));
  mesh.position.set(x, y, z);
  if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cyl(
  parent: THREE.Object3D,
  mats: MaterialKit,
  role: Parameters<MaterialKit['get']>[0],
  r: number,
  h: number,
  x: number,
  y: number,
  z: number,
  color?: number,
  axis: 'x' | 'y' | 'z' = 'x',
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 14), mats.get(role, color));
  mesh.position.set(x, y, z);
  if (axis === 'x') mesh.rotation.z = Math.PI / 2;
  if (axis === 'z') mesh.rotation.x = Math.PI / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function sphere(
  parent: THREE.Object3D,
  mats: MaterialKit,
  role: Parameters<MaterialKit['get']>[0],
  r: number,
  x: number,
  y: number,
  z: number,
  color?: number,
  scale?: [number, number, number],
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mats.get(role, color));
  mesh.position.set(x, y, z);
  if (scale) mesh.scale.set(...scale);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Authored motorcycle + rider — silhouette-first, layered. */
export function createHeroBike(mats: MaterialKit, livery = 0xff6b35): THREE.Group {
  const g = new THREE.Group();
  g.name = 'heroBike';

  // chassis / body
  box(g, mats, 'vehiclePaint', 0.42, 0.22, 1.15, 0, 0.62, 0.05, livery);
  box(g, mats, 'vehiclePaint', 0.38, 0.18, 0.55, 0, 0.72, -0.28, livery);
  // tank
  const tank = sphere(g, mats, 'vehiclePaint', 0.28, 0, 0.82, -0.05, livery, [1, 0.7, 1.4]);
  tank.name = 'tank';
  // seat
  box(g, mats, 'vehicleDark', 0.32, 0.12, 0.55, 0, 0.86, -0.38, 0x1a1d22);
  // front fairing / cowl
  box(g, mats, 'vehiclePaint', 0.36, 0.28, 0.22, 0, 0.88, 0.55, livery, [0.35, 0, 0]);
  // headlight
  sphere(g, mats, 'headlight', 0.12, 0, 0.95, 0.62);
  // forks
  cyl(g, mats, 'metal', 0.04, 0.7, -0.1, 0.72, 0.52, 0xb8c0c8, 'y');
  cyl(g, mats, 'metal', 0.04, 0.7, 0.1, 0.72, 0.52, 0xb8c0c8, 'y');
  // handlebar
  cyl(g, mats, 'metal', 0.03, 0.72, 0, 1.05, 0.55, 0x222831, 'x');
  box(g, mats, 'vehicleDark', 0.1, 0.1, 0.12, -0.32, 1.05, 0.55);
  box(g, mats, 'vehicleDark', 0.1, 0.1, 0.12, 0.32, 1.05, 0.55);
  // mirrors
  box(g, mats, 'metal', 0.12, 0.08, 0.04, -0.38, 1.2, 0.5);
  box(g, mats, 'metal', 0.12, 0.08, 0.04, 0.38, 1.2, 0.5);
  // exhaust
  cyl(g, mats, 'metal', 0.07, 0.55, 0.18, 0.48, -0.45, 0xd0d6de, 'z');
  cyl(g, mats, 'vehicleDark', 0.08, 0.12, 0.18, 0.48, -0.75);
  // taillight
  box(g, mats, 'taillight', 0.18, 0.08, 0.06, 0, 0.78, -0.72);
  // wheels
  const wheelGeo = new THREE.TorusGeometry(0.32, 0.1, 10, 22);
  const wheelMat = mats.get('vehicleDark', 0x111418);
  for (const [x, z] of [
    [0, 0.62],
    [0, -0.58],
  ] as const) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.position.set(x, 0.32, z);
    w.rotation.y = Math.PI / 2;
    w.castShadow = true;
    g.add(w);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 14), mats.get('metal'));
    rim.position.set(x, 0.32, z);
    rim.rotation.z = Math.PI / 2;
    g.add(rim);
    // brake disc
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 12), mats.get('metal', 0x888888));
    disc.position.set(x + 0.06, 0.32, z);
    disc.rotation.z = Math.PI / 2;
    g.add(disc);
  }

  // rider
  const rider = new THREE.Group();
  rider.name = 'rider';
  // pelvis / torso
  box(rider, mats, 'fabric', 0.34, 0.42, 0.28, 0, 1.12, -0.12, livery);
  box(rider, mats, 'fabric', 0.3, 0.28, 0.24, 0, 1.38, -0.18, livery, [0.25, 0, 0]);
  // helmet
  sphere(rider, mats, 'vehiclePaint', 0.19, 0, 1.62, -0.22, 0x1ec8a5);
  // visor
  const visor = box(rider, mats, 'glass', 0.28, 0.12, 0.08, 0, 1.6, -0.36, 0x78d0e8);
  visor.rotation.x = 0.35;
  // arms
  box(rider, mats, 'fabric', 0.12, 0.12, 0.42, -0.24, 1.22, 0.18, livery, [0.6, 0, 0.35]);
  box(rider, mats, 'fabric', 0.12, 0.12, 0.42, 0.24, 1.22, 0.18, livery, [0.6, 0, -0.35]);
  // gloves
  sphere(rider, mats, 'vehicleDark', 0.08, -0.3, 1.08, 0.48);
  sphere(rider, mats, 'vehicleDark', 0.08, 0.3, 1.08, 0.48);
  // legs
  box(rider, mats, 'fabric', 0.14, 0.35, 0.16, -0.16, 0.85, -0.05, 0x1b2735);
  box(rider, mats, 'fabric', 0.14, 0.35, 0.16, 0.16, 0.85, -0.05, 0x1b2735);
  box(rider, mats, 'vehicleDark', 0.12, 0.1, 0.22, -0.16, 0.62, 0.08);
  box(rider, mats, 'vehicleDark', 0.12, 0.1, 0.22, 0.16, 0.62, 0.08);
  g.add(rider);

  return g;
}

export function createVehicleMesh(mats: MaterialKit, opts: { kind: VehicleKind; paint?: number }): THREE.Group {
  const g = new THREE.Group();
  const paint = opts.paint ?? 0xd8dde3;

  switch (opts.kind) {
    case 'bike':
    case 'scooter': {
      box(g, mats, 'vehiclePaint', 0.4, 0.22, 1.05, 0, 0.55, 0, paint);
      sphere(g, mats, 'vehiclePaint', 0.22, 0, 0.72, -0.1, paint, [1, 0.65, 1.3]);
      box(g, mats, 'fabric', 0.28, 0.1, 0.4, 0, 0.78, -0.35, 0x222);
      box(g, mats, 'metal', 0.5, 0.06, 0.1, 0, 0.95, 0.42);
      sphere(g, mats, 'headlight', 0.09, 0, 0.82, 0.5);
      box(g, mats, 'taillight', 0.12, 0.06, 0.05, 0, 0.62, -0.55);
      cyl(g, mats, 'vehicleDark', 0.2, 0.1, 0, 0.28, 0.42);
      cyl(g, mats, 'vehicleDark', 0.2, 0.1, 0, 0.28, -0.4);
      // rider silhouette
      sphere(g, mats, 'skin', 0.13, 0, 1.15, -0.1);
      sphere(g, mats, 'vehiclePaint', 0.15, 0, 1.22, -0.1, 0x222, [1, 1, 1.1]);
      box(g, mats, 'fabric', 0.26, 0.32, 0.22, 0, 0.95, -0.12, paint);
      break;
    }
    case 'car':
    case 'taxi': {
      // lower body with tapered nose
      box(g, mats, 'vehiclePaint', 1.72, 0.5, 3.5, 0, 0.52, 0, paint);
      box(g, mats, 'vehiclePaint', 1.6, 0.22, 1.1, 0, 0.42, 1.35, paint, [0.15, 0, 0]);
      // cabin
      box(g, mats, 'vehiclePaint', 1.52, 0.52, 1.85, 0, 1.02, -0.12, paint);
      // glass
      box(g, mats, 'glass', 1.42, 0.42, 1.55, 0, 1.05, -0.1);
      box(g, mats, 'glass', 1.35, 0.28, 0.08, 0, 1.05, 0.82, 0x9ad8f0);
      // pillars
      box(g, mats, 'vehicleDark', 0.08, 0.5, 0.1, -0.72, 1.05, 0.75);
      box(g, mats, 'vehicleDark', 0.08, 0.5, 0.1, 0.72, 1.05, 0.75);
      // lights
      box(g, mats, 'headlight', 0.38, 0.14, 0.08, -0.5, 0.58, 1.72);
      box(g, mats, 'headlight', 0.38, 0.14, 0.08, 0.5, 0.58, 1.72);
      box(g, mats, 'taillight', 0.42, 0.16, 0.08, -0.5, 0.62, -1.72);
      box(g, mats, 'taillight', 0.42, 0.16, 0.08, 0.5, 0.62, -1.72);
      // grille + bumper
      box(g, mats, 'vehicleDark', 1.5, 0.18, 0.12, 0, 0.38, 1.78);
      box(g, mats, 'vehicleDark', 1.55, 0.16, 0.1, 0, 0.36, -1.75);
      // wheels
      for (const [x, z] of [
        [-0.88, 1.1],
        [0.88, 1.1],
        [-0.88, -1.15],
        [0.88, -1.15],
      ] as const) {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16), mats.get('vehicleDark', 0x12151a));
        w.position.set(x, 0.32, z);
        w.rotation.z = Math.PI / 2;
        w.castShadow = true;
        g.add(w);
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.24, 12), mats.get('metal'));
        hub.position.copy(w.position);
        hub.rotation.copy(w.rotation);
        g.add(hub);
      }
      if (opts.kind === 'taxi') {
        box(g, mats, 'accent', 0.72, 0.18, 0.38, 0, 1.38, -0.1, 0xf4d35e);
        box(g, mats, 'paper', 0.9, 0.28, 0.06, 0, 0.95, 0.88);
      }
      // side mirrors
      box(g, mats, 'vehicleDark', 0.14, 0.1, 0.08, -0.95, 1.05, 0.55);
      box(g, mats, 'vehicleDark', 0.14, 0.1, 0.08, 0.95, 1.05, 0.55);
      break;
    }
    case 'angkot': {
      box(g, mats, 'vehiclePaint', 1.9, 1.15, 4.0, 0, 1.0, 0, paint);
      box(g, mats, 'vehiclePaint', 1.85, 0.55, 1.2, 0, 1.75, 1.2, paint);
      box(g, mats, 'glass', 1.72, 0.55, 2.4, 0, 1.35, 0.15);
      box(g, mats, 'glass', 1.7, 0.45, 0.1, 0, 1.45, 1.95);
      // stripe / roof rack
      box(g, mats, 'teal', 1.95, 0.16, 3.2, 0, 1.95, 0);
      box(g, mats, 'metal', 1.7, 0.08, 2.8, 0, 2.15, 0);
      // door opening hint
      box(g, mats, 'vehicleDark', 0.08, 1.0, 1.1, -0.98, 1.05, -0.3);
      // lights
      box(g, mats, 'headlight', 0.32, 0.18, 0.08, -0.55, 0.72, 2.05);
      box(g, mats, 'headlight', 0.32, 0.18, 0.08, 0.55, 0.72, 2.05);
      box(g, mats, 'taillight', 0.3, 0.18, 0.08, -0.55, 0.78, -2.05);
      box(g, mats, 'taillight', 0.3, 0.18, 0.08, 0.55, 0.78, -2.05);
      // bumper
      box(g, mats, 'metal', 1.95, 0.18, 0.14, 0, 0.42, 2.08);
      box(g, mats, 'metal', 1.95, 0.18, 0.14, 0, 0.42, -2.08);
      for (const [x, z] of [
        [-0.95, 1.25],
        [0.95, 1.25],
        [-0.95, -1.3],
        [0.95, -1.3],
      ] as const) {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 16), mats.get('vehicleDark', 0x12151a));
        w.position.set(x, 0.36, z);
        w.rotation.z = Math.PI / 2;
        w.castShadow = true;
        g.add(w);
      }
      // route sign
      box(g, mats, 'paper', 1.2, 0.28, 0.06, 0, 1.95, 1.85);
      break;
    }
    case 'bus': {
      // TransJakarta-inspired
      box(g, mats, 'vehiclePaint', 2.55, 1.7, 10.2, 0, 1.7, 0, paint ?? 0x1ec8a5);
      box(g, mats, 'vehiclePaint', 2.5, 0.7, 8.5, 0, 2.75, 0, 0xf5f0e6);
      // windows
      box(g, mats, 'glass', 2.58, 0.95, 7.2, 0, 2.25, -0.3);
      box(g, mats, 'glass', 2.4, 0.7, 0.1, 0, 2.1, 5.05);
      // doors
      box(g, mats, 'glass', 0.08, 1.4, 1.2, -1.3, 1.6, 1.8);
      box(g, mats, 'glass', 0.08, 1.4, 1.2, -1.3, 1.6, -1.8);
      // stripe
      box(g, mats, 'accent', 2.6, 0.28, 9.5, 0, 1.15, 0, 0xff6b35);
      // roof
      box(g, mats, 'metal', 2.3, 0.12, 9.5, 0, 3.2, 0);
      // lights
      box(g, mats, 'headlight', 0.55, 0.22, 0.1, -0.75, 1.0, 5.15);
      box(g, mats, 'headlight', 0.55, 0.22, 0.1, 0.75, 1.0, 5.15);
      box(g, mats, 'taillight', 0.5, 0.22, 0.1, -0.75, 1.15, -5.15);
      box(g, mats, 'taillight', 0.5, 0.22, 0.1, 0.75, 1.15, -5.15);
      // bumper + skirt
      box(g, mats, 'vehicleDark', 2.6, 0.35, 0.25, 0, 0.55, 5.15);
      box(g, mats, 'vehicleDark', 2.6, 0.35, 0.25, 0, 0.55, -5.15);
      for (const z of [-3.6, -1.2, 1.2, 3.6]) {
        for (const x of [-1.18, 1.18]) {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.28, 16), mats.get('vehicleDark', 0x12151a));
          w.position.set(x, 0.42, z);
          w.rotation.z = Math.PI / 2;
          w.castShadow = true;
          g.add(w);
        }
      }
      // destination board
      box(g, mats, 'paper', 1.8, 0.35, 0.08, 0, 3.05, 5.05);
      break;
    }
    case 'truck': {
      box(g, mats, 'vehiclePaint', 2.35, 1.15, 4.6, 0, 1.05, -1.0, paint);
      box(g, mats, 'vehiclePaint', 2.2, 1.55, 3.4, 0, 1.85, 1.35, 0x8b949e);
      box(g, mats, 'glass', 2.05, 0.55, 1.35, 0, 1.75, -1.35);
      box(g, mats, 'headlight', 0.4, 0.18, 0.1, -0.65, 0.95, 2.45);
      box(g, mats, 'headlight', 0.4, 0.18, 0.1, 0.65, 0.95, 2.45);
      box(g, mats, 'taillight', 0.35, 0.18, 0.1, -0.65, 1.0, -2.45);
      box(g, mats, 'taillight', 0.35, 0.18, 0.1, 0.65, 1.0, -2.45);
      box(g, mats, 'metal', 2.4, 0.22, 0.15, 0, 0.55, 2.5);
      // cargo panels
      for (let i = 0; i < 3; i += 1) {
        box(g, mats, 'vehicleDark', 2.25, 0.08, 0.1, 0, 1.2 + i * 0.55, 3.05);
      }
      for (const [x, z] of [
        [-1.1, 1.4],
        [1.1, 1.4],
        [-1.1, -1.4],
        [1.1, -1.4],
      ] as const) {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.26, 16), mats.get('vehicleDark', 0x12151a));
        w.position.set(x, 0.4, z);
        w.rotation.z = Math.PI / 2;
        w.castShadow = true;
        g.add(w);
      }
      break;
    }
    default:
      box(g, mats, 'vehiclePaint', 1.5, 0.8, 3, 0, 0.6, 0, paint);
  }

  return g;
}

export function createTrainCarriage(mats: MaterialKit, paint = 0xc5cdd6): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.15, 3.1, 16), mats.get('vehiclePaint', paint));
  body.position.y = 2.15;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // teal stripe
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.18, 0.32, 16.02), mats.get('teal'));
  stripe.position.y = 1.85;
  g.add(stripe);

  // windows + frames
  for (let i = -6.2; i <= 6.2; i += 1.7) {
    for (const x of [-1.59, 1.59]) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.25, 1.35), mats.get('vehicleDark'));
      frame.position.set(x, 2.65, i);
      g.add(frame);
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.05, 1.15), mats.get('glass'));
      w.position.set(x + (x > 0 ? 0.01 : -0.01), 2.65, i);
      g.add(w);
    }
  }

  // doors
  for (const z of [-4.5, 0, 4.5]) {
    for (const x of [-1.6, 1.6]) {
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.1, 1.3), mats.get('metal'));
      door.position.set(x, 1.55, z);
      g.add(door);
    }
  }

  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.18, 15.5), mats.get('metal'));
  roof.position.y = 3.75;
  g.add(roof);

  // pantograph / AC
  const ac = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 3.2), mats.get('metal', 0x9aa3ad));
  ac.position.y = 3.95;
  g.add(ac);

  for (const z of [-5.5, 5.5]) {
    const bogie = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.55, 2.4), mats.get('vehicleDark'));
    bogie.position.set(0, 0.55, z);
    g.add(bogie);
    for (const x of [-1.1, 1.1]) {
      for (const dz of [-0.7, 0.7]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.22, 14), mats.get('vehicleDark'));
        wheel.position.set(x, 0.42, z + dz);
        wheel.rotation.z = Math.PI / 2;
        g.add(wheel);
      }
    }
  }

  return g;
}

export function createPassengerMesh(mats: MaterialKit, shirt: number, bag: number): THREE.Group {
  const g = new THREE.Group();
  // legs
  box(g, mats, 'fabric', 0.14, 0.55, 0.16, -0.1, 0.35, 0, 0x1b2735);
  box(g, mats, 'fabric', 0.14, 0.55, 0.16, 0.1, 0.35, 0, 0x1b2735);
  box(g, mats, 'vehicleDark', 0.12, 0.1, 0.22, -0.1, 0.05, 0.06);
  box(g, mats, 'vehicleDark', 0.12, 0.1, 0.22, 0.1, 0.05, 0.06);
  // torso
  box(g, mats, 'fabric', 0.38, 0.55, 0.26, 0, 1.0, 0, shirt);
  // arms
  box(g, mats, 'fabric', 0.11, 0.45, 0.12, -0.26, 1.0, 0, shirt);
  box(g, mats, 'fabric', 0.11, 0.45, 0.12, 0.26, 1.0, 0, shirt);
  // head
  sphere(g, mats, 'skin', 0.16, 0, 1.42, 0);
  sphere(g, mats, 'vehicleDark', 0.16, 0, 1.5, 0, 0x222, [1.05, 0.85, 1.05]);
  // bag
  box(g, mats, 'fabric', 0.26, 0.32, 0.14, 0.3, 0.95, 0.12, bag);
  return g;
}

export function createBikePlayer(mats: MaterialKit, livery = 0xff6b35): THREE.Group {
  return createHeroBike(mats, livery);
}

/** Money / gaji token — authored collectible. */
export function createGajiToken(mats: MaterialKit): THREE.Group {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.1, 10, 24), mats.get('accent', 0xff6b35));
  ring.rotation.x = Math.PI / 2;
  ring.castShadow = true;
  g.add(ring);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.1, 20), mats.get('headlight', 0xffc857));
  core.position.y = 0.02;
  g.add(core);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 16), mats.get('accent', 0xff6b35));
  inner.position.y = 0.04;
  g.add(inner);
  return g;
}
