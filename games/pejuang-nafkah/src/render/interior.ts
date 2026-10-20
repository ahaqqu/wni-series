import * as THREE from 'three';
import type { SimState } from '../sim/types';
import { ColoredBucket, glowMaterial, solidMaterial } from './geometry';
import { createPerson } from './people';
import { makeSignMesh } from './textures';

export const INTERIOR_ORIGIN_X = 100;
export const INTERIOR_TARGET = { x: INTERIOR_ORIGIN_X - 0.9, y: 1.2, z: 0.55 };

export class InteriorView {
  readonly group = new THREE.Group();

  private readonly player: ReturnType<typeof createPerson>;

  private readonly seatHighlight: THREE.Mesh;

  private readonly seatHighlightMaterial: THREE.MeshBasicMaterial;

  private readonly lights: THREE.PointLight[] = [];

  constructor() {
    this.group.name = 'train-interior';
    this.group.position.x = INTERIOR_ORIGIN_X;
    this.group.visible = false;

    const solid = new ColoredBucket();
    const glow = new ColoredBucket();

    // Floor, ceiling, far wall, and the low cutaway wall on the camera side.
    solid.box(9.4, 0.2, 3.5, '#3d4346', { y: 0.1 });
    solid.box(9.4, 0.12, 3.5, '#4d5254', { y: 0.22 });
    solid.box(9.4, 0.9, 0.12, '#31424b', { y: 0.65, z: -1.72 });
    solid.box(9.4, 1.9, 0.1, '#22343f', { y: 1.75, z: -1.78 });
    solid.box(9.4, 0.82, 0.12, '#3d484d', { y: 0.61, z: 1.72 });
    solid.box(9.4, 0.1, 0.16, '#d7d0bf', { y: 2.48, z: 1.55 });

    // Window band with frames.
    for (let index = 0; index < 6; index += 1) {
      const x = -3.9 + index * 1.55;
      glow.box(1.28, 1.0, 0.04, '#86b4c6', { x, y: 1.78, z: -1.71 });
      solid.box(0.06, 1.15, 1.12, '#54646a', {
        x: x + 0.68,
        y: 1.78,
        z: -1.68,
        rx: Math.PI / 2,
      });
      solid.box(0.06, 1.15, 1.12, '#54646a', {
        x: x - 0.68,
        y: 1.78,
        z: -1.68,
        rx: Math.PI / 2,
      });
    }
    solid.box(9.4, 0.08, 0.1, '#6f7a7c', { y: 2.35, z: -1.7 });
    solid.box(9.4, 0.08, 0.1, '#6f7a7c', { y: 1.18, z: -1.7 });

    // Longitudinal bench along the far wall.
    solid.box(6.6, 0.13, 0.62, '#3f6f76', { x: 0.7, y: 0.72, z: -1.22 });
    solid.box(6.6, 0.14, 0.12, '#2f5258', { x: 0.7, y: 1.1, z: -1.56 });
    solid.box(6.6, 0.55, 0.12, '#345d63', { x: 0.7, y: 0.95, z: -1.58 });
    for (let index = 0; index < 5; index += 1) {
      solid.box(1.2, 0.04, 0.6, '#6b8c8f', {
        x: -2.1 + index * 1.35,
        y: 0.8,
        z: -1.22,
      });
    }
    solid.box(0.08, 0.55, 0.5, '#34464a', { x: -2.4, y: 0.45, z: -1.22 });
    solid.box(0.08, 0.55, 0.5, '#34464a', { x: 3.8, y: 0.45, z: -1.22 });

    // Priority seat near the door: a quieter colour and a small marker.
    solid.box(1.05, 0.07, 0.58, '#c9b67a', { x: -2.0, y: 0.8, z: -1.22 });
    const priority = makeSignMesh(
      [
        { text: 'PRIORITAS', size: 30, weight: 800, color: '#f4ebdd' },
        { text: 'IBU · ANAK · LANSIA', size: 14, weight: 600, color: '#ffb347' },
      ],
      1.45,
      0.44,
      {
        width: 512,
        height: 150,
        background: '#17313a',
        border: 'rgba(46, 196, 182, 0.45)',
        accent: '#2ec4b6',
        padding: 18,
      },
    );
    priority.position.set(-2.0, 1.52, -1.62);
    this.group.add(priority);

    // Poles, straps, and handrails.
    for (const x of [-2.7, -0.4, 1.9, 4.2]) {
      solid.cylinder(0.045, 0.05, 2.28, 8, '#b8b8ae', { x, y: 2.42, z: 0.05 });
      solid.cylinder(0.08, 0.08, 0.06, 8, '#777d7d', { x, y: 3.54, z: 0.05 });
    }
    solid.cylinder(0.045, 0.045, 8.7, 8, '#b8b8ae', {
      x: 0.2,
      y: 2.42,
      z: 0.62,
      rz: Math.PI / 2,
    });
    solid.cylinder(0.045, 0.045, 8.7, 8, '#b8b8ae', {
      x: 0.2,
      y: 2.42,
      z: -0.72,
      rz: Math.PI / 2,
    });
    for (const x of [-1.8, -1.1, -0.4, 0.3, 1.0, 1.7, 2.4, 3.1]) {
      solid.cylinder(0.018, 0.018, 0.34, 5, '#d6cdb8', { x, y: 2.2, z: 0.62 });
      addRing(solid, x, 2.03, 0.62);
    }

    // Ceiling lights and the route strip above the windows.
    for (const x of [-3.2, -1.5, 0.2, 1.9, 3.6]) {
      glow.box(1.0, 0.035, 0.16, '#ffe0ae', { x, y: 2.62, z: 0.3 });
    }
    const route = makeSignMesh(
      [
        { text: 'LIN SELATAN', size: 25, weight: 700, color: '#f4ebdd' },
        { text: 'RANGKASBITUNG  →', size: 17, weight: 600, color: '#ffb347' },
      ],
      2.9,
      0.55,
      {
        width: 640,
        height: 150,
        background: '#13242c',
        border: 'rgba(244, 235, 221, 0.26)',
        accent: '#ffb347',
        padding: 20,
      },
    );
    route.position.set(0.5, 2.48, -1.62);
    this.group.add(route);

    // Door end at the left, with a bright vestibule.
    solid.box(0.12, 2.5, 3.2, '#26373f', { x: -4.55, y: 1.4, z: 0 });
    solid.box(0.08, 2.15, 1.2, '#0f1b21', { x: -4.48, y: 1.3, z: 0.7 });
    glow.box(0.09, 1.7, 0.82, '#9ccbd3', { x: -4.42, y: 1.28, z: 0.7 });
    solid.box(0.08, 0.1, 1.4, '#ffb347', { x: -4.4, y: 2.42, z: 0.7 });
    solid.box(0.08, 0.1, 1.4, '#ffb347', { x: -4.4, y: 0.3, z: 0.7 });

    // Luggage rack suggestion and end wall.
    solid.box(1.3, 0.06, 0.42, '#59676c', { x: 3.5, y: 2.15, z: -1.2 });
    solid.box(0.08, 2.7, 3.2, '#26373f', { x: 4.58, y: 1.36, z: 0 });

    this.group.add(solid.build(solidMaterial({ roughness: 0.76, metalness: 0.08 })));
    this.group.add(glow.build(glowMaterial()));

    this.seatHighlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffb347,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.seatHighlight = new THREE.Mesh(
      new THREE.RingGeometry(0.26, 0.36, 28),
      this.seatHighlightMaterial,
    );
    this.seatHighlight.rotation.x = -Math.PI / 2;
    this.seatHighlight.position.set(1.15, 0.82, -1.18);
    this.group.add(this.seatHighlight);

    this.player = createPerson({
      role: 'worker',
      build: 'medium',
      colorIndex: 1,
      aggression: 0,
      vulnerable: false,
      player: true,
    });
    this.player.group.position.set(-3.05, 0.22, 0.45);
    this.player.group.rotation.y = 0.15;
    this.group.add(this.player.group);

    this.addPassenger(2.8, -0.85, 'office', 3, 0.9, 0.2);
    this.addPassenger(3.55, 0.35, 'student', 4, -0.3, 0.1);
    this.addPassenger(-1.7, -0.35, 'parent', 5, 0.2, 0.05);

    const warm = new THREE.PointLight(0xffd7a0, 16, 9, 2);
    warm.position.set(0, 2.45, 0.2);
    this.group.add(warm);
    this.lights.push(warm);

    const windowLight = new THREE.PointLight(0x75aabb, 8, 8, 2);
    windowLight.position.set(-2.2, 1.8, -1.2);
    this.group.add(windowLight);
    this.lights.push(windowLight);
  }

  update(state: SimState, now: number, reducedMotion: boolean): void {
    const successResult = state.phase === 'result' && state.result?.success === true;
    this.group.visible = state.phase === 'inside' || successResult;
    if (!this.group.visible) return;

    const seatChoice = state.phase === 'inside' && state.seatChoice && state.player.spot === null;
    this.seatHighlight.visible = seatChoice;
    if (seatChoice) {
      const pulse = reducedMotion ? 0.5 : 0.5 + Math.sin(now * 4) * 0.16;
      this.seatHighlightMaterial.opacity = 0.55 + pulse * 0.3;
      this.seatHighlight.scale.setScalar(0.94 + pulse * 0.1);
    }

    let targetX = -3.05;
    let targetZ = 0.45;
    let rotation = 0.15;
    if (state.player.spot === 'seat') {
      targetX = 1.15;
      targetZ = -0.72;
      rotation = 0;
    } else if (state.player.spot === 'pole') {
      targetX = -0.4;
      targetZ = 0.4;
      rotation = 0;
    } else if (state.player.spot === 'deep') {
      targetX = 3.3;
      targetZ = 0.2;
      rotation = 0.2;
    } else if (state.player.spot === 'door') {
      targetX = -3.05;
      targetZ = 0.45;
      rotation = 0.15;
    }
    this.player.group.position.x += (targetX - this.player.group.position.x) * 0.15;
    this.player.group.position.z += (targetZ - this.player.group.position.z) * 0.15;
    this.player.group.rotation.y += (rotation - this.player.group.rotation.y) * 0.15;

    for (const light of this.lights) {
      light.intensity = light === this.lights[0] ? 14 : 7;
    }
  }

  private addPassenger(
    x: number,
    z: number,
    role: 'office' | 'student' | 'parent',
    colorIndex: number,
    aggression: number,
    rotation: number,
  ): void {
    const person = createPerson({
      role,
      build: role === 'student' ? 'slim' : 'medium',
      colorIndex,
      aggression,
      vulnerable: false,
    });
    person.group.position.set(x, 0.22, z);
    person.group.rotation.y = rotation;
    this.group.add(person.group);
  }
}

function addRing(bucket: ColoredBucket, x: number, y: number, z: number): void {
  bucket.add(new THREE.TorusGeometry(0.07, 0.014, 5, 10), '#d6cdb8', {
    x,
    y,
    z,
    rx: Math.PI / 2,
  });
}
