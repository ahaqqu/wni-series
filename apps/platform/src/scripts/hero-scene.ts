import * as THREE from 'three';

export type SceneQuality = 'low' | 'high';

type Vec2 = { x: number; y: number };

const COLORS = {
  asphalt: 0x111a22,
  asphaltLight: 0x1b2a34,
  sidewalk: 0x1a2832,
  concrete: 0x33434c,
  white: 0xf4ebdd,
  sodium: 0xffb347,
  sodiumHot: 0xff7a45,
  krl: 0xe33a4e,
  teal: 0x2a9d8f,
  tealBright: 0x64d8c6,
  rain: 0x9fd8ff,
  window: 0xffd08a,
  windowCool: 0xb9e5ff,
};

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function damp(current: number, target: number, lambda: number, dt: number): number {
  return THREE.MathUtils.damp(current, target, lambda, dt);
}

function canvasTexture(
  width: number,
  height: number,
  paint: (ctx: CanvasRenderingContext2D) => void,
  repeat: Vec2 = { x: 1, y: 1 },
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');
  paint(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat.x, repeat.y);
  tex.anisotropy = 4;
  return tex;
}

function windowTexture(seed: number): THREE.CanvasTexture {
  const rng = mulberry32(seed);
  return canvasTexture(128, 256, (ctx) => {
    ctx.fillStyle = '#152833';
    ctx.fillRect(0, 0, 128, 256);
    for (let y = 10; y < 246; y += 18) {
      for (let x = 8; x < 120; x += 16) {
        if (rng() > 0.56) {
          const warm = rng() > 0.18;
          ctx.fillStyle = warm
            ? `rgba(255, ${180 + Math.floor(rng() * 55)}, ${90 + Math.floor(rng() * 45)}, ${0.32 + rng() * 0.55})`
            : `rgba(170, 224, 255, ${0.25 + rng() * 0.45})`;
          ctx.fillRect(x, y, 7, 5);
        }
      }
    }
  });
}

function makeTextTexture(text: string, color = '#f4ebdd'): THREE.CanvasTexture {
  return canvasTexture(512, 128, (ctx) => {
    ctx.fillStyle = '#08131c';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = 'rgba(244,235,221,0.16)';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, 504, 120);
    ctx.fillStyle = color;
    ctx.font = '600 48px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 66);
  });
}

function addGlow(scene: THREE.Object3D, position: THREE.Vector3, color: number, size = 1.6): void {
  const map = canvasTexture(64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,220,160,0.8)');
    g.addColorStop(1, 'rgba(255,180,90,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });
  const material = new THREE.SpriteMaterial({
    map,
    color,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.setScalar(size);
  scene.add(sprite);
}

function makeCar(color: number, brake = true): THREE.Group {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.5,
    metalness: 0.22,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x8bb8c8,
    roughness: 0.18,
    metalness: 0.55,
    transparent: true,
    opacity: 0.72,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 3.5), bodyMat);
  body.position.y = 0.46;
  group.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.44, 1.55), glassMat);
  cabin.position.set(0, 0.91, -0.1);
  group.add(cabin);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x05090c, roughness: 0.8 });
  const wheelGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.18, 10);
  for (const [x, z] of [
    [-0.82, 1.1],
    [0.82, 1.1],
    [-0.82, -1.1],
    [0.82, -1.1],
  ] as const) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.28, z);
    group.add(wheel);
  }
  if (brake) {
    const brakeMat = new THREE.MeshBasicMaterial({ color: 0xff3a2e });
    for (const x of [-0.58, 0.58] as const) {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.06), brakeMat);
      lamp.position.set(x, 0.55, 1.78);
      group.add(lamp);
    }
  }
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.12),
    new THREE.MeshBasicMaterial({ color: 0xd8e6ec }),
  );
  plate.position.set(0, 0.34, 1.79);
  group.add(plate);
  const reflection = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 5.5),
    new THREE.MeshBasicMaterial({
      color: 0xff3a2e,
      transparent: true,
      opacity: 0.11,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  reflection.rotation.x = -Math.PI / 2;
  reflection.position.set(0, 0.028, 4.3);
  group.add(reflection);
  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfff3d1 });
  for (const x of [-0.58, 0.58] as const) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.05), headlightMat);
    lamp.position.set(x, 0.55, -1.78);
    group.add(lamp);
  }
  return group;
}

function makeAngkot(): THREE.Group {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x86c7d8, roughness: 0.45 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.35, 4.1), bodyMat);
  body.position.y = 0.92;
  group.add(body);
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(1.82, 0.18, 3.95),
    new THREE.MeshStandardMaterial({ color: 0xe9f2f2, roughness: 0.5 }),
  );
  roof.position.y = 1.64;
  group.add(roof);
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x173947,
    roughness: 0.2,
    metalness: 0.4,
    transparent: true,
    opacity: 0.86,
  });
  for (const x of [-0.96, 0.96] as const) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 2.5), windowMat);
    win.position.set(x, 1.23, -0.1);
    group.add(win);
  }
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(1.94, 0.18, 0.5),
    new THREE.MeshBasicMaterial({ color: COLORS.teal }),
  );
  stripe.position.set(0, 0.72, 1.6);
  group.add(stripe);
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(0.75, 1),
    new THREE.MeshBasicMaterial({ color: 0x122b35, transparent: true, opacity: 0.7 }),
  );
  door.position.set(0.96, 0.95, -0.2);
  door.rotation.y = Math.PI / 2;
  group.add(door);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x05090c, roughness: 0.8 });
  const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 10);
  for (const [x, z] of [
    [-0.9, 1.25],
    [0.9, 1.25],
    [-0.9, -1.25],
    [0.9, -1.25],
  ] as const) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.3, z);
    group.add(wheel);
  }
  return group;
}

function makeOjol(): THREE.Group {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x10232b, roughness: 0.5 });
  const bike = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 1.5), frameMat);
  bike.position.y = 0.5;
  group.add(bike);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x05090c, roughness: 0.85 });
  const wheelGeo = new THREE.TorusGeometry(0.27, 0.06, 6, 12);
  for (const z of [-0.62, 0.62] as const) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(0, 0.3, z);
    group.add(wheel);
  }
  const jacket = new THREE.MeshStandardMaterial({ color: 0x1c8c5f, roughness: 0.65 });
  const rider = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.55, 3, 6), jacket);
  rider.position.set(0, 1.1, 0.05);
  group.add(rider);
  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xe0e7e5, roughness: 0.4 }),
  );
  helmet.position.set(0, 1.54, 0.02);
  group.add(helmet);
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.5, 0.55),
    new THREE.MeshStandardMaterial({ color: 0x2b9d6d, roughness: 0.7 }),
  );
  box.position.set(0, 1.02, -0.52);
  group.add(box);
  return group;
}

function makeBus(): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.45, 2.5, 9.2),
    new THREE.MeshStandardMaterial({ color: 0xdcebed, roughness: 0.38 }),
  );
  body.position.y = 1.5;
  group.add(body);
  const band = new THREE.Mesh(
    new THREE.BoxGeometry(2.48, 0.38, 9.24),
    new THREE.MeshBasicMaterial({ color: COLORS.teal }),
  );
  band.position.y = 1.05;
  group.add(band);
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x102c39,
    roughness: 0.18,
    metalness: 0.5,
    transparent: true,
    opacity: 0.9,
  });
  for (const x of [-1.25, 1.25] as const) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.8, 7.8), windowMat);
    win.position.set(x, 2.2, 0);
    group.add(win);
  }
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x05090c, roughness: 0.8 });
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.24, 10);
  for (const [x, z] of [
    [-1.1, 2.8],
    [1.1, 2.8],
    [-1.1, -2.8],
    [1.1, -2.8],
  ] as const) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.44, z);
    group.add(wheel);
  }
  return group;
}

function makePerson(color: number, seated = false): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.22, seated ? 0.38 : 0.62, 3, 6),
    new THREE.MeshStandardMaterial({ color, roughness: 0.7 }),
  );
  body.position.y = seated ? 0.78 : 1.1;
  group.add(body);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 7, 6),
    new THREE.MeshStandardMaterial({ color: 0xd7ae8a, roughness: 0.75 }),
  );
  head.position.y = seated ? 1.22 : 1.68;
  group.add(head);
  return group;
}

export function initStreetScene(canvas: HTMLCanvasElement): () => void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const quality: SceneQuality = window.innerWidth < 720 ? 'low' : 'high';
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: quality === 'high',
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'high' ? 1.8 : 1.3));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x112c3a, quality === 'high' ? 0.0105 : 0.0135);
  const camera = new THREE.PerspectiveCamera(51, 1, 0.1, 320);
  const cameraBase = new THREE.Vector3(4.15, 2.35, 8.9);
  camera.position.copy(cameraBase);
  camera.lookAt(2.1, 1.55, -30);
  const warmFill = new THREE.PointLight(0xffa85c, 14, 34, 2);
  warmFill.position.set(4, 3.2, 3);
  scene.add(warmFill);

  const rng = mulberry32(45);
  let lastTime = performance.now();
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let raf = 0;
  let running = true;
  let visible = true;
  let elapsed = 0;
  let trafficLightTimer = 0;
  let trafficState = 0;
  const trafficLamps: THREE.Mesh[] = [];
  const vehicles: { group: THREE.Group; speed: number; lane: number; z: number }[] = [];
  const train = new THREE.Group();
  const rainPositions: Float32Array[] = [];

  const disposeList: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposeList.push(item);
    return item;
  };

  const ambient = new THREE.HemisphereLight(0xa8d8e8, 0x25170d, 2.05);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffc88c, 3.0);
  key.position.set(18, 26, 12);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x5fb4cf, 0.45);
  fill.position.set(-20, 10, -30);
  scene.add(fill);

  // Dawn backdrop is provided by the page CSS; keep the canvas transparent.

  // Road + sidewalks.
  const roadMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x1a2831,
      roughness: 0.82,
      metalness: 0.015,
    }),
  );
  const road = new THREE.Mesh(track(new THREE.PlaneGeometry(24, 230)), roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0, -96);
  scene.add(road);

  const sidewalkMat = track(new THREE.MeshStandardMaterial({ color: 0x243640, roughness: 0.82 }));
  for (const x of [-15.2, 15.2] as const) {
    const walk = new THREE.Mesh(track(new THREE.BoxGeometry(7.2, 0.22, 230)), sidewalkMat);
    walk.position.set(x, 0.11, -96);
    scene.add(walk);
  }
  const curbMat = track(new THREE.MeshStandardMaterial({ color: 0x2b3a42, roughness: 0.9 }));
  for (const x of [-11.45, 11.45] as const) {
    const curb = new THREE.Mesh(track(new THREE.BoxGeometry(0.3, 0.24, 230)), curbMat);
    curb.position.set(x, 0.12, -96);
    scene.add(curb);
  }

  // A few subtle wet patches, not a neon river.
  const wetMat = track(
    new THREE.MeshBasicMaterial({
      color: 0x2c6272,
      transparent: true,
      opacity: 0.055,
      depthWrite: false,
    }),
  );
  for (const [x, z, r] of [
    [7.2, -14, 3.1],
    [-5.8, -44, 2.4],
    [9.4, -58, 2.8],
  ] as const) {
    const wet = new THREE.Mesh(track(new THREE.CircleGeometry(r, 20)), wetMat);
    wet.rotation.x = -Math.PI / 2;
    wet.scale.y = 0.3;
    wet.position.set(x, 0.014, z);
    scene.add(wet);
  }

  // Lane dashes, instanced.
  const dashGeo = track(new THREE.PlaneGeometry(0.13, 2.6));
  const dashMat = track(
    new THREE.MeshBasicMaterial({ color: 0xd9e4df, transparent: true, opacity: 0.72 }),
  );
  const dashCount = quality === 'high' ? 150 : 90;
  const dashes = new THREE.InstancedMesh(dashGeo, dashMat, dashCount);
  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  let dashIndex = 0;
  for (const x of [1.2, 5.4, 9.5, -6.4, -10.2] as const) {
    for (let z = 8; z > -210; z -= 7.5) {
      if (dashIndex >= dashCount) break;
      matrix.compose(new THREE.Vector3(x, 0.02, z), quat, new THREE.Vector3(1, 1, 1));
      dashes.setMatrixAt(dashIndex, matrix);
      dashIndex += 1;
    }
  }
  dashes.count = dashIndex;
  scene.add(dashes);

  // Busway median barrier.
  const barrierMat = track(new THREE.MeshStandardMaterial({ color: 0x6c7a7e, roughness: 0.9 }));
  const barrierGeo = track(new THREE.BoxGeometry(0.56, 0.55, 3.1));
  for (let z = 6; z > -210; z -= 4.2) {
    const block = new THREE.Mesh(barrierGeo, barrierMat);
    block.position.set(-2.3, 0.29, z);
    scene.add(block);
  }
  const buswayLine = new THREE.Mesh(
    track(new THREE.PlaneGeometry(2.6, 224)),
    track(new THREE.MeshBasicMaterial({ color: 0x113a43, transparent: true, opacity: 0.16 })),
  );
  buswayLine.rotation.x = -Math.PI / 2;
  buswayLine.position.set(-4.35, 0.015, -96);
  // buswayLine disabled for visual test
  // scene.add(buswayLine);

  // Intersection and yellow box.
  const yellowMat = track(
    new THREE.MeshBasicMaterial({ color: 0xd2a82e, transparent: true, opacity: 0.8 }),
  );
  for (let i = 0; i < 7; i += 1) {
    const line = new THREE.Mesh(track(new THREE.PlaneGeometry(22, 0.16)), yellowMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, 0.025, -31 + i * 0.8);
    scene.add(line);
  }

  // Crosswalk and lane arrows.
  const crossMat = track(
    new THREE.MeshBasicMaterial({ color: 0xd9e4df, transparent: true, opacity: 0.55 }),
  );
  for (let i = 0; i < 9; i += 1) {
    const stripe = new THREE.Mesh(track(new THREE.PlaneGeometry(1.3, 0.7)), crossMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(-9 + i * 2.2, 0.026, -33.8);
    scene.add(stripe);
  }
  const arrowMat = track(
    new THREE.MeshBasicMaterial({ color: 0xd9e4df, transparent: true, opacity: 0.6 }),
  );
  for (const x of [3.2, 7.1] as const) {
    for (const z of [-4, -48] as const) {
      const shaft = new THREE.Mesh(track(new THREE.PlaneGeometry(0.18, 2.2)), arrowMat);
      shaft.rotation.x = -Math.PI / 2;
      shaft.position.set(x, 0.027, z);
      scene.add(shaft);
      const headA = new THREE.Mesh(track(new THREE.PlaneGeometry(0.18, 0.8)), arrowMat);
      headA.rotation.x = -Math.PI / 2;
      headA.rotation.z = 0.55;
      headA.position.set(x - 0.22, 0.027, z - 1.35);
      scene.add(headA);
      const headB = headA.clone();
      headB.rotation.z = -0.55;
      headB.position.x = x + 0.22;
      scene.add(headB);
    }
  }

  // Buildings, shared window materials.
  const windowMats = [windowTexture(11), windowTexture(29), windowTexture(73)].map((tex) =>
    track(
      new THREE.MeshStandardMaterial({
        map: tex,
        emissiveMap: tex,
        emissive: 0xffffff,
        emissiveIntensity: 0.95,
        color: 0x4a6470,
        roughness: 0.72,
        metalness: 0.08,
      }),
    ),
  );
  const buildingGeoCache = new Map<string, THREE.BoxGeometry>();
  const makeBuilding = (x: number, z: number, w: number, h: number, d: number, index: number) => {
    const key = `${w.toFixed(1)}-${h.toFixed(1)}-${d.toFixed(1)}`;
    let geo = buildingGeoCache.get(key);
    if (!geo) {
      geo = track(new THREE.BoxGeometry(w, h, d));
      buildingGeoCache.set(key, geo);
    }
    const mat = windowMats[index % windowMats.length];
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, h / 2, z);
    scene.add(mesh);
    if (h > 22) {
      const antenna = new THREE.Mesh(
        track(new THREE.CylinderGeometry(0.05, 0.05, 4, 4)),
        track(new THREE.MeshBasicMaterial({ color: 0x7f98a3 })),
      );
      antenna.position.set(x, h + 2, z);
      scene.add(antenna);
      const beacon = new THREE.Mesh(
        track(new THREE.SphereGeometry(0.12, 6, 4)),
        track(new THREE.MeshBasicMaterial({ color: 0xff4b3f })),
      );
      beacon.position.set(x, h + 4.1, z);
      scene.add(beacon);
    }
  };

  const buildingCount = quality === 'high' ? 18 : 11;
  for (let i = 0; i < buildingCount; i += 1) {
    const side = i % 2 === 0 ? 1 : -1;
    const w = 4 + rng() * 7;
    const d = 4 + rng() * 8;
    const h = 9 + rng() * (i % 3 === 0 ? 38 : 22);
    const x = side * (20 + rng() * 8);
    const z = -8 - i * 13 - rng() * 6;
    makeBuilding(x, z, w, h, d, i);
  }

  // Distant skyline.
  const skylineMat = track(
    new THREE.MeshBasicMaterial({ color: 0x102b38, transparent: true, opacity: 0.9 }),
  );
  for (let i = 0; i < 18; i += 1) {
    const w = 5 + rng() * 9;
    const h = 12 + rng() * 44;
    const box = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, 3)), skylineMat);
    box.position.set(-70 + i * 8.5, h / 2, -205 + rng() * 10);
    scene.add(box);
  }

  // Streetlights and sodium glows.
  const poleMat = track(new THREE.MeshStandardMaterial({ color: 0x3e4e55, roughness: 0.8 }));
  const bulbMat = track(new THREE.MeshBasicMaterial({ color: 0xffc16b }));
  for (let i = 0; i < (quality === 'high' ? 9 : 6); i += 1) {
    const z = -8 - i * 24;
    for (const side of [-1, 1] as const) {
      const x = side * 12.2;
      const pole = new THREE.Mesh(track(new THREE.CylinderGeometry(0.08, 0.11, 6.2, 6)), poleMat);
      pole.position.set(x, 3.1, z);
      scene.add(pole);
      const arm = new THREE.Mesh(track(new THREE.BoxGeometry(2.2, 0.08, 0.08)), poleMat);
      arm.position.set(x - side * 1.05, 6.1, z);
      scene.add(arm);
      const bulb = new THREE.Mesh(track(new THREE.SphereGeometry(0.12, 6, 5)), bulbMat);
      bulb.position.set(x - side * 2.05, 6.03, z);
      scene.add(bulb);
    }
  }

  // Traffic light.
  const trafficGroup = new THREE.Group();
  const trafficPole = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.09, 0.11, 5.4, 6)),
    poleMat,
  );
  trafficPole.position.set(0, 2.7, 0);
  trafficGroup.add(trafficPole);
  const trafficHead = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.55, 0.35, 1.45)),
    track(new THREE.MeshStandardMaterial({ color: 0x1a242a, roughness: 0.7 })),
  );
  trafficHead.position.set(0, 4.9, -0.55);
  trafficGroup.add(trafficHead);
  const lampColors = [0xff3a2e, 0xf2c14e, 0x64d8a6];
  for (let i = 0; i < 3; i += 1) {
    const lamp = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.13, 8, 6)),
      track(new THREE.MeshBasicMaterial({ color: lampColors[i] })),
    );
    lamp.position.set(0, 4.9, 0.05 - i * 0.28);
    lamp.visible = i === 0;
    trafficLamps.push(lamp);
    trafficGroup.add(lamp);
  }
  trafficGroup.position.set(10.9, 0, -19);
  trafficGroup.scale.setScalar(1.25);
  scene.add(trafficGroup);

  // Vehicles.
  const carColors = [0x9aaab2, 0x2c3b43, 0xba4a42, 0x5b6e76, 0xd5d9d7, 0x35505a];
  const carCount = quality === 'high' ? 9 : 5;
  for (let i = 0; i < carCount; i += 1) {
    const car = makeCar(carColors[i % carColors.length], true);
    const lane = i % 3 === 0 ? 3.2 : i % 3 === 1 ? 7.1 : 9.7;
    const z = -10 - i * 12 - rng() * 5;
    car.position.set(lane, 0, z);
    car.rotation.y = Math.PI;
    scene.add(car);
    vehicles.push({ group: car, speed: 0.4 + rng() * 0.7, lane, z });
  }
  const angkot = makeAngkot();
  angkot.position.set(9.9, 0, -17);
  angkot.rotation.y = Math.PI;
  scene.add(angkot);
  const ojol = makeOjol();
  ojol.position.set(6.3, 0, -9);
  ojol.rotation.y = Math.PI;
  scene.add(ojol);
  const bus = makeBus();
  bus.position.set(-4.35, 0, -26);
  bus.rotation.y = Math.PI;
  scene.add(bus);

  // KRL is represented in its own mode scene; keep the road composition clean.

  // Vegetation silhouettes on sidewalk edge.
  const treeMat = track(new THREE.MeshStandardMaterial({ color: 0x0d2b25, roughness: 0.95 }));
  for (let i = 0; i < (quality === 'high' ? 16 : 8); i += 1) {
    const side = i % 2 === 0 ? 1 : -1;
    const tree = new THREE.Mesh(
      track(new THREE.ConeGeometry(1 + rng(), 4 + rng() * 3, 7)),
      treeMat,
    );
    tree.position.set(side * (13.5 + rng() * 2), 2.5, -4 - i * 13);
    scene.add(tree);
  }

  // Rain lines.
  const rainCount = quality === 'high' ? 850 : 360;
  const rainGeo = track(new THREE.BufferGeometry());
  const positions = new Float32Array(rainCount * 6);
  for (let i = 0; i < rainCount; i += 1) {
    const x = (rng() - 0.5) * 30;
    const y = rng() * 16;
    const z = 8 - rng() * 100;
    positions[i * 6] = x;
    positions[i * 6 + 1] = y;
    positions[i * 6 + 2] = z;
    positions[i * 6 + 3] = x - 0.05;
    positions[i * 6 + 4] = y - 0.65;
    positions[i * 6 + 5] = z + 0.04;
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const rainMat = track(
    new THREE.LineBasicMaterial({
      color: COLORS.rain,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    }),
  );
  const rain = new THREE.LineSegments(rainGeo, rainMat);
  scene.add(rain);
  rainPositions.push(positions);

  // Puddle highlights.
  const puddleMat = track(
    new THREE.MeshBasicMaterial({
      color: 0x2b6a7d,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    }),
  );
  for (let i = 0; i < (quality === 'high' ? 7 : 4); i += 1) {
    const puddle = new THREE.Mesh(track(new THREE.CircleGeometry(1 + rng() * 2.6, 24)), puddleMat);
    puddle.rotation.x = -Math.PI / 2;
    puddle.scale.y = 0.35 + rng() * 0.35;
    puddle.position.set(-6 + rng() * 16, 0.018, -8 - rng() * 35);
    scene.add(puddle);
  }

  // Subtle foreground handlebar/visor edge.
  const barMat = track(
    new THREE.MeshStandardMaterial({ color: 0x0b151b, roughness: 0.4, metalness: 0.5 }),
  );
  const leftBar = new THREE.Mesh(track(new THREE.CylinderGeometry(0.035, 0.045, 1.6, 6)), barMat);
  leftBar.rotation.z = Math.PI / 2;
  leftBar.rotation.y = 0.2;
  leftBar.position.set(-0.95, 0.84, 7.8);
  scene.add(leftBar);
  const rightBar = leftBar.clone();
  rightBar.position.x = 0.95;
  rightBar.rotation.y = -0.2;
  scene.add(rightBar);
  const mirrorStem = new THREE.Mesh(track(new THREE.CylinderGeometry(0.025, 0.03, 0.7, 5)), barMat);
  mirrorStem.position.set(1.38, 1.08, 7.85);
  mirrorStem.rotation.z = -0.25;
  scene.add(mirrorStem);
  const mirror = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.34, 0.2, 0.04)),
    track(new THREE.MeshStandardMaterial({ color: 0x213944, roughness: 0.2, metalness: 0.8 })),
  );
  mirror.position.set(1.5, 1.4, 7.85);
  mirror.rotation.y = 0.16;
  scene.add(mirror);

  // Resize.
  const resize = () => {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  // Input parallax.
  const onPointerMove = (event: PointerEvent) => {
    pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  const updateRain = (dt: number) => {
    const arr = rainPositions[0];
    if (!arr) return;
    for (let i = 0; i < rainCount; i += 1) {
      const fall = 15 * dt;
      arr[i * 6 + 1] -= fall;
      arr[i * 6 + 4] -= fall;
      if (arr[i * 6 + 1] < 0) {
        const x = (rng() - 0.5) * 30;
        const z = 8 - rng() * 100;
        arr[i * 6] = x;
        arr[i * 6 + 1] = 16;
        arr[i * 6 + 2] = z;
        arr[i * 6 + 3] = x - 0.05;
        arr[i * 6 + 4] = 15.35;
        arr[i * 6 + 5] = z + 0.04;
      }
    }
    rainGeo.attributes.position!.needsUpdate = true;
  };

  const updateTrafficLight = (dt: number) => {
    trafficLightTimer += dt;
    const cycle = trafficState === 0 ? 4.5 : trafficState === 1 ? 1.5 : 4.5;
    if (trafficLightTimer > cycle) {
      trafficLightTimer = 0;
      trafficState = (trafficState + 1) % 3;
      trafficLamps.forEach((lamp, i) => {
        lamp.visible = i === trafficState;
      });
    }
  };

  const frame = (now = performance.now()) => {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    elapsed += dt;
    if (reduced) {
      renderer.render(scene, camera);
      return;
    }
    pointer.x = damp(pointer.x, pointer.tx, 3.2, dt);
    pointer.y = damp(pointer.y, pointer.ty, 3.2, dt);
    camera.position.x = cameraBase.x + pointer.x * 0.55;
    camera.position.y = cameraBase.y - pointer.y * 0.16 + Math.sin(elapsed * 0.45) * 0.035;
    camera.position.z = cameraBase.z + Math.sin(elapsed * 0.17) * 0.12;
    camera.lookAt(1.4 + pointer.x * 0.3, 1.15 + pointer.y * 0.1, -30);

    updateTrafficLight(dt);
    updateRain(dt);
    for (const v of vehicles) {
      v.z += v.speed * dt;
      if (v.z > 10) v.z = -110;
      v.group.position.z = v.z;
    }
    train.position.x = Math.sin(elapsed * 0.045) * 26;
    ojol.position.z = -36 + Math.sin(elapsed * 0.8) * 1.2;
    ojol.rotation.z = Math.sin(elapsed * 1.1) * 0.03;
    angkot.rotation.z = Math.sin(elapsed * 0.7) * 0.006;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (running) return;
    running = true;
    lastTime = performance.now();
    frame(lastTime);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };
  const onVisibility = () => {
    if (document.hidden || !visible) stop();
    else start();
  };
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (visible && !document.hidden) start();
      else stop();
    },
    { threshold: 0.02 },
  );
  io.observe(canvas);
  document.addEventListener('visibilitychange', onVisibility);

  // First frame.
  renderer.render(scene, camera);
  if (!reduced) {
    running = false;
    start();
  }
  canvas.dataset.ready = 'true';

  return () => {
    stop();
    io.disconnect();
    resizeObserver.disconnect();
    window.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('visibilitychange', onVisibility);
    for (const item of disposeList) item.dispose();
    renderer.dispose();
  };
}

export function initKrlScene(canvas: HTMLCanvasElement): () => void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x102a37, 0.018);
  const camera = new THREE.PerspectiveCamera(54, 1, 0.1, 120);
  camera.position.set(5.4, 1.72, 10.5);
  camera.lookAt(-1.6, 1.55, -13);

  const rng = mulberry32(18);
  let lastTime = performance.now();
  let raf = 0;
  let elapsed = 0;

  scene.add(new THREE.HemisphereLight(0xa7d9e8, 0x20140d, 1.6));
  const warm = new THREE.DirectionalLight(0xffc78f, 2.4);
  warm.position.set(10, 9, 8);
  scene.add(warm);
  const cool = new THREE.DirectionalLight(0x63b6cc, 1.2);
  cool.position.set(-8, 5, -8);
  scene.add(cool);

  const platformMat = new THREE.MeshStandardMaterial({ color: 0x34464d, roughness: 0.78 });
  const platform = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.34, 44), platformMat);
  platform.position.set(4.6, -0.17, -10);
  scene.add(platform);

  // Platform tiles.
  const tileTex = canvasTexture(
    256,
    256,
    (ctx) => {
      ctx.fillStyle = '#394b51';
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = 'rgba(8,18,24,0.4)';
      ctx.lineWidth = 2;
      for (let i = 0; i <= 256; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 256);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(256, i);
        ctx.stroke();
      }
    },
    { x: 2, y: 8 },
  );
  const tileMat = new THREE.MeshStandardMaterial({ map: tileTex, color: 0xffffff, roughness: 0.8 });
  const tileFloor = new THREE.Mesh(new THREE.PlaneGeometry(10.8, 42), tileMat);
  tileFloor.rotation.x = -Math.PI / 2;
  tileFloor.position.set(4.6, 0.01, -10);
  scene.add(tileFloor);

  // Yellow safety line and tactile strip.
  const yellowMat = new THREE.MeshBasicMaterial({ color: 0xf2c14e });
  const safety = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 42), yellowMat);
  safety.position.set(0.25, 0.02, -10);
  scene.add(safety);
  const tactileTex = canvasTexture(
    32,
    256,
    (ctx) => {
      ctx.fillStyle = '#cfa93e';
      ctx.fillRect(0, 0, 32, 256);
      ctx.fillStyle = 'rgba(50,35,8,0.28)';
      for (let y = 4; y < 256; y += 12) {
        for (let x = 4; x < 32; x += 10) ctx.fillRect(x, y, 4, 4);
      }
    },
    { x: 1, y: 8 },
  );
  const tactile = new THREE.Mesh(
    new THREE.PlaneGeometry(0.65, 42),
    new THREE.MeshBasicMaterial({ map: tactileTex, color: 0xffffff }),
  );
  tactile.rotation.x = -Math.PI / 2;
  tactile.position.set(-0.32, 0.022, -10);
  scene.add(tactile);

  // Track bed and rails.
  const trackMat = new THREE.MeshStandardMaterial({ color: 0x19252b, roughness: 0.92 });
  const bed = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.3, 60), trackMat);
  bed.position.set(-4.2, -0.32, -14);
  scene.add(bed);
  const railMat = new THREE.MeshStandardMaterial({
    color: 0x8a969a,
    roughness: 0.35,
    metalness: 0.7,
  });
  for (const x of [-5.9, -2.5] as const) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 60), railMat);
    rail.position.set(x, -0.1, -14);
    scene.add(rail);
  }

  // Train: 205-inspired stainless body with original red/yellow marks.
  const train = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xbfd0d2,
    roughness: 0.36,
    metalness: 0.55,
  });
  const stripeRed = new THREE.MeshBasicMaterial({ color: 0xd7263d });
  const stripeYellow = new THREE.MeshBasicMaterial({ color: 0xf2c14e });
  const glassMat = new THREE.MeshBasicMaterial({
    color: 0x112d3a,
    transparent: true,
    opacity: 0.92,
  });
  const litMat = new THREE.MeshBasicMaterial({ color: 0xffd79b });
  for (let car = 0; car < 3; car += 1) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.7, 2.35, 9.6), bodyMat);
    body.position.set(0, 1.28, -car * 9.9);
    train.add(body);
    const red = new THREE.Mesh(new THREE.BoxGeometry(2.72, 0.16, 9.62), stripeRed);
    red.position.set(0, 0.42, -car * 9.9);
    train.add(red);
    const yellow = new THREE.Mesh(new THREE.BoxGeometry(2.72, 0.08, 9.62), stripeYellow);
    yellow.position.set(0, 0.24, -car * 9.9);
    train.add(yellow);
    for (let w = 0; w < 4; w += 1) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.7, 1.35), glassMat);
      win.position.set(1.36, 1.8, -3.3 + w * 2.15 - car * 9.9);
      train.add(win);
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.55), litMat);
      glow.rotation.y = Math.PI / 2;
      glow.position.set(1.37, 1.8, -3.3 + w * 2.15 - car * 9.9);
      train.add(glow);
    }
    for (const doorZ of [-2.5, 2.7]) {
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.75, 1.35), glassMat);
      door.position.set(1.36, 1.15, doorZ - car * 9.9);
      train.add(door);
      const doorLight = new THREE.Mesh(
        new THREE.PlaneGeometry(1.1, 1.6),
        new THREE.MeshBasicMaterial({ color: 0xffe1ac, transparent: true, opacity: 0.35 }),
      );
      doorLight.rotation.y = Math.PI / 2;
      doorLight.position.set(1.37, 1.15, doorZ - car * 9.9);
      train.add(doorLight);
    }
    for (const [x, z] of [
      [-1.25, 2.9],
      [1.25, 2.9],
      [-1.25, -2.9],
      [1.25, -2.9],
    ] as const) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.34, 0.2, 10),
        new THREE.MeshStandardMaterial({ color: 0x070b0d, roughness: 0.9 }),
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.18, z - car * 9.9);
      train.add(wheel);
    }
  }
  // Cab face at the near end.
  const cab = new THREE.Group();
  const cabBody = new THREE.Mesh(new THREE.BoxGeometry(2.7, 2.35, 0.5), bodyMat);
  cab.add(cabBody);
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.75, 0.04), glassMat);
  windshield.position.set(0, 0.45, 0.28);
  cab.add(windshield);
  for (const x of [-0.7, 0.7] as const) {
    const headlight = new THREE.Mesh(
      new THREE.CircleGeometry(0.16, 12),
      new THREE.MeshBasicMaterial({ color: 0xfff2cf }),
    );
    headlight.position.set(x, -0.25, 0.3);
    cab.add(headlight);
  }
  cab.position.set(0, 1.28, 4.9);
  train.add(cab);
  train.position.set(-3.5, 0, -5);
  scene.add(train);
  addGlow(scene, new THREE.Vector3(-2.9, 1.15, 0.4), 0xffe4b3, 4.5);

  // Canopy, columns, light strips.
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x53656b, roughness: 0.8 });
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(12, 0.3, 46), canopyMat);
  canopy.position.set(4.4, 4.7, -10);
  scene.add(canopy);
  const columnMat = new THREE.MeshStandardMaterial({ color: 0x62757b, roughness: 0.72 });
  for (let z = 8; z > -34; z -= 8) {
    for (const x of [8.7, 0.1] as const) {
      const column = new THREE.Mesh(new THREE.BoxGeometry(0.32, 4.7, 0.4), columnMat);
      column.position.set(x, 2.35, z);
      scene.add(column);
    }
  }
  for (const x of [1.4, 5.8] as const) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.04, 38),
      new THREE.MeshBasicMaterial({ color: 0xffe2b6 }),
    );
    strip.position.set(x, 4.5, -10);
    scene.add(strip);
    addGlow(scene, new THREE.Vector3(x, 4.4, -6), 0xffd79b, 2.0);
  }

  // Station name board and direction sign.
  const boardTex = makeTextTexture('JURANGMANGU', '#f4ebdd');
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(3.3, 0.82),
    new THREE.MeshBasicMaterial({ map: boardTex }),
  );
  board.position.set(2.5, 3.25, -7.5);
  board.rotation.y = -0.16;
  scene.add(board);
  const codeTex = makeTextTexture('R05 · BINTARO', '#ffb347');
  const codeBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.62),
    new THREE.MeshBasicMaterial({ map: codeTex }),
  );
  codeBoard.position.set(5.5, 3.1, -13.5);
  codeBoard.rotation.y = -0.16;
  scene.add(codeBoard);
  const arrowTex = makeTextTexture('TANAH ABANG →', '#64d8c6');
  const arrow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 0.52),
    new THREE.MeshBasicMaterial({ map: arrowTex }),
  );
  arrow.position.set(3.8, 2.2, -18);
  arrow.rotation.y = -0.16;
  scene.add(arrow);

  // Bench, bin, and a small kiosk.
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x7b5a3d, roughness: 0.8 });
  const bench = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 0.65), benchMat);
  seat.position.y = 0.55;
  bench.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.55, 0.1), benchMat);
  back.position.set(0, 0.85, -0.26);
  bench.add(back);
  bench.position.set(6.8, 0, -20);
  scene.add(bench);

  // People: varied silhouettes, some umbrellas, all away from the lens.
  const coatColors = [0x2b3d47, 0x5e4a39, 0x2f4b40, 0x4b3540, 0x243650, 0x6d5b47, 0x3d3e44];
  const people: { group: THREE.Group; phase: number; standing: boolean }[] = [];
  const placements: Array<[number, number, boolean]> = [
    [3.2, -14, true],
    [4.4, -16, true],
    [5.6, -18, false],
    [2.4, -19, true],
    [6.3, -22, true],
    [4.2, -24, true],
    [7.2, -25, false],
    [3.4, -27, true],
    [5.4, -29, true],
    [2.6, -31, true],
    [6.6, -33, true],
    [4.6, -35, false],
  ];
  for (let i = 0; i < placements.length; i += 1) {
    const [x, z, standing] = placements[i]!;
    const person = makePerson(coatColors[i % coatColors.length], !standing);
    person.position.set(x, 0, z);
    person.rotation.y = -0.2 + rng() * 0.5;
    scene.add(person);
    people.push({ group: person, phase: rng() * Math.PI * 2, standing });
    if (i % 3 === 0) {
      const umbrella = new THREE.Mesh(
        new THREE.ConeGeometry(0.75, 0.35, 10),
        new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? 0x1c3644 : 0x6b2f35,
          roughness: 0.7,
        }),
      );
      umbrella.position.set(x, 2.0, z);
      scene.add(umbrella);
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 1.1, 4),
        new THREE.MeshBasicMaterial({ color: 0x2b3438 }),
      );
      handle.position.set(x, 1.4, z);
      scene.add(handle);
    }
    if (i % 4 === 1) {
      const bag = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.45, 0.18),
        new THREE.MeshStandardMaterial({ color: 0x1b2429, roughness: 0.6 }),
      );
      bag.position.set(x + 0.28, 0.7, z);
      scene.add(bag);
    }
  }

  // Background city and track lights.
  const bgMat = new THREE.MeshStandardMaterial({ color: 0x122a36, roughness: 0.8 });
  for (let i = 0; i < 16; i += 1) {
    const w = 6 + rng() * 8;
    const h = 10 + rng() * 30;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 4), bgMat);
    b.position.set(-38 + i * 5.3, h / 2, -58 - rng() * 10);
    scene.add(b);
    for (let j = 0; j < 5; j += 1) {
      const win = new THREE.Mesh(
        new THREE.PlaneGeometry(0.28, 0.2),
        new THREE.MeshBasicMaterial({ color: rng() > 0.3 ? 0xffcf87 : 0x9bd9ef }),
      );
      win.position.set(b.position.x - w / 2 + 1 + rng() * (w - 2), 2 + rng() * (h - 3), -55.9);
      scene.add(win);
    }
  }
  addGlow(scene, new THREE.Vector3(-3, 1.8, -38), 0xffd79b, 8);

  // Rain and wet platform reflections.
  const rainCount = 700;
  const rainGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(rainCount * 6);
  for (let i = 0; i < rainCount; i += 1) {
    const x = -8 + rng() * 18;
    const y = rng() * 15;
    const z = 10 - rng() * 55;
    positions[i * 6] = x;
    positions[i * 6 + 1] = y;
    positions[i * 6 + 2] = z;
    positions[i * 6 + 3] = x - 0.04;
    positions[i * 6 + 4] = y - 0.55;
    positions[i * 6 + 5] = z + 0.02;
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const rain = new THREE.LineSegments(
    rainGeo,
    new THREE.LineBasicMaterial({
      color: 0xa8dcff,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    }),
  );
  scene.add(rain);
  const puddleMat = new THREE.MeshBasicMaterial({
    color: 0x2c6272,
    transparent: true,
    opacity: 0.09,
    depthWrite: false,
  });
  for (let i = 0; i < 5; i += 1) {
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.7 + rng() * 1.4, 18), puddleMat);
    puddle.rotation.x = -Math.PI / 2;
    puddle.scale.y = 0.3;
    puddle.position.set(1 + rng() * 7, 0.023, 4 - rng() * 22);
    scene.add(puddle);
  }

  const resize = () => {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  const updateRain = (dt: number) => {
    for (let i = 0; i < rainCount; i += 1) {
      positions[i * 6 + 1] -= 13 * dt;
      positions[i * 6 + 4] -= 13 * dt;
      if (positions[i * 6 + 1] < 0) {
        positions[i * 6 + 1] = 15;
        positions[i * 6 + 4] = 14.45;
      }
    }
    rainGeo.attributes.position!.needsUpdate = true;
  };

  const frame = (now = performance.now()) => {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    elapsed += dt;
    if (!reduced) {
      camera.position.x = 5.4 + Math.sin(elapsed * 0.33) * 0.12;
      camera.position.y = 1.72 + Math.sin(elapsed * 0.7) * 0.018;
      camera.lookAt(-1.6 + Math.sin(elapsed * 0.2) * 0.08, 1.55, -13);
      for (const p of people) {
        p.group.rotation.z = Math.sin(elapsed * 0.7 + p.phase) * 0.01;
        p.group.position.y = Math.sin(elapsed * 0.6 + p.phase) * 0.006;
      }
      train.position.y = Math.sin(elapsed * 0.55) * 0.008;
      updateRain(dt);
    }
    renderer.render(scene, camera);
    if (!reduced) raf = requestAnimationFrame(frame);
  };
  renderer.render(scene, camera);
  if (!reduced) frame();
  canvas.dataset.ready = 'true';

  return () => {
    cancelAnimationFrame(raf);
    observer.disconnect();
    renderer.dispose();
  };
}
