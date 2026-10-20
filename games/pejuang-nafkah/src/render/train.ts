import * as THREE from 'three';
import { zoneX } from '../sim/simulation';
import type { SimState } from '../sim/types';
import { ColoredBucket, glowMaterial, solidMaterial } from './geometry';
import { makeSignMesh } from './textures';

interface DoorPanel {
  mesh: THREE.Mesh;
  baseX: number;
  side: -1 | 1;
}

const CAR_SPACING = 7;
const BODY_Z = -2.2;
const DOOR_Z = -0.73;

function createDoorPanel(): THREE.Mesh {
  const bucket = new ColoredBucket();
  bucket.box(0.62, 1.98, 0.07, '#efe3ca', { y: 1.52 });
  bucket.box(0.64, 0.2, 0.075, '#cf4a3f', { y: 0.72 });
  bucket.box(0.4, 0.62, 0.075, '#1b2c3b', { y: 1.9, z: 0.005 });
  bucket.box(0.055, 0.3, 0.08, '#8f8a7c', { x: 0.19, y: 1.1, z: 0.01 });
  return bucket.build(solidMaterial({ roughness: 0.7 }));
}

export class TrainView {
  readonly group = new THREE.Group();

  private readonly doors: DoorPanel[] = [];

  private readonly warmLight: THREE.PointLight;

  private readonly destination: THREE.Mesh;

  constructor() {
    this.group.name = 'train';
    this.group.visible = false;

    const body = new ColoredBucket();
    const glow = new ColoredBucket();

    for (let car = 0; car < 3; car += 1) {
      const x = -car * CAR_SPACING;
      body.box(6.72, 2.66, 2.82, '#efe3ca', { x, y: 1.95, z: BODY_Z });
      body.box(6.74, 0.34, 2.84, '#c94b40', { x, y: 0.91, z: BODY_Z });
      body.box(6.75, 0.08, 2.85, '#e6b34d', { x, y: 1.13, z: BODY_Z });
      body.box(6.7, 0.15, 2.6, '#303940', { x, y: 3.31, z: BODY_Z });
      body.box(6.7, 0.22, 2.62, '#343c42', { x, y: 0.48, z: BODY_Z });
      body.box(6.3, 0.2, 2.4, '#252b30', { x, y: 0.34, z: BODY_Z });

      for (const offset of [-2.42, -1.58, 1.58, 2.42]) {
        body.box(0.66, 0.72, 0.06, '#182b3a', {
          x: x + offset,
          y: 2.18,
          z: BODY_Z + 1.415,
        });
        body.box(0.7, 0.06, 0.07, '#d8cab4', {
          x: x + offset,
          y: 1.79,
          z: BODY_Z + 1.415,
        });
      }

      body.box(1.24, 2.08, 0.025, '#171d22', {
        x,
        y: 1.48,
        z: BODY_Z + 1.415,
      });
      body.box(1.12, 1.88, 0.02, '#ffcf8a', {
        x,
        y: 1.45,
        z: BODY_Z + 1.42,
      });
      body.box(0.065, 2.16, 0.09, '#c5b69f', {
        x: x - 0.66,
        y: 1.48,
        z: BODY_Z + 1.42,
      });
      body.box(0.065, 2.16, 0.09, '#c5b69f', {
        x: x + 0.66,
        y: 1.48,
        z: BODY_Z + 1.43,
      });
      body.box(1.38, 0.065, 0.09, '#c5b69f', {
        x,
        y: 2.52,
        z: BODY_Z + 1.43,
      });

      glow.box(1.02, 1.76, 0.015, '#ffd79a', {
        x,
        y: 1.43,
        z: BODY_Z + 1.425,
      });
      glow.box(0.1, 0.1, 0.02, '#ffd79a', {
        x,
        y: 2.6,
        z: BODY_Z + 1.43,
      });

      for (const axle of [-2.15, 2.15]) {
        for (const z of [-1.12, -3.28]) {
          body.cylinder(0.34, 0.34, 0.18, 8, '#17191b', {
            x: x + axle,
            y: 0.35,
            z,
            rx: Math.PI / 2,
          });
          body.cylinder(0.16, 0.16, 0.2, 8, '#596066', {
            x: x + axle,
            y: 0.35,
            z,
            rx: Math.PI / 2,
          });
        }
      }

      body.box(0.9, 0.24, 1.2, '#3b444b', {
        x: x + 1.4,
        y: 3.44,
        z: BODY_Z,
      });
    }

    // Front cab and the red band that wraps the nose.
    body.box(0.5, 2.7, 2.7, '#efe3ca', { x: 3.42, y: 1.96, z: BODY_Z });
    body.box(0.28, 0.33, 2.72, '#c94b40', { x: 3.62, y: 0.93, z: BODY_Z });
    body.box(0.32, 0.09, 2.73, '#e6b34d', { x: 3.62, y: 1.14, z: BODY_Z });
    body.box(0.14, 0.88, 2.15, '#182b3a', { x: 3.64, y: 2.18, z: BODY_Z });
    body.box(0.2, 0.16, 0.2, '#ffd9a0', { x: 3.72, y: 1.2, z: BODY_Z - 0.9 });
    body.box(0.2, 0.16, 0.2, '#ffd9a0', { x: 3.72, y: 1.2, z: BODY_Z + 0.9 });

    // Pantograph on the middle car.
    body.box(1.9, 0.055, 0.065, '#6c7378', { x: -7, y: 3.72, z: BODY_Z - 0.5, rz: 0.16 });
    body.box(1.9, 0.055, 0.065, '#6c7378', { x: -7, y: 3.72, z: BODY_Z + 0.5, rz: 0.16 });
    body.box(0.06, 0.42, 0.06, '#6c7378', { x: -6.15, y: 3.55, z: BODY_Z - 0.5 });
    body.box(0.06, 0.42, 0.06, '#6c7378', { x: -7.85, y: 3.55, z: BODY_Z + 0.5 });

    const bodyMesh = body.build(solidMaterial({ roughness: 0.62, metalness: 0.08 }));
    this.group.add(bodyMesh);

    const glowMesh = glow.build(glowMaterial({ transparent: true, opacity: 0.96 }));
    this.group.add(glowMesh);

    for (let car = 0; car < 3; car += 1) {
      const x = -car * CAR_SPACING;
      for (const side of [-1, 1] as const) {
        const panel = createDoorPanel();
        const baseX = x + side * 0.31;
        panel.position.set(baseX, 0, DOOR_Z);
        panel.userData.baseX = baseX;
        this.group.add(panel);
        this.doors.push({ mesh: panel, baseX, side });
      }
    }

    this.destination = makeSignMesh(
      [
        { text: 'RANGKASBITUNG', size: 36, weight: 800, color: '#f4ebdd' },
        { text: 'LIN SELATAN', size: 18, weight: 600, color: '#ffb347' },
      ],
      2.25,
      0.6,
      {
        width: 512,
        height: 140,
        background: '#0b1624',
        border: 'rgba(244, 235, 221, 0.28)',
        accent: '#ffb347',
        padding: 22,
      },
    );
    this.destination.position.set(1.95, 2.95, BODY_Z + 1.46);
    this.group.add(this.destination);

    this.warmLight = new THREE.PointLight(0xffd39a, 13, 13, 2);
    this.warmLight.position.set(3.25, 1.55, -0.25);
    this.group.add(this.warmLight);

    this.group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = false;
        object.receiveShadow = false;
      }
    });
  }

  update(state: SimState): void {
    const visible =
      state.frontZone >= 0 &&
      (state.phase === 'arrival' ||
        state.phase === 'alight' ||
        state.phase === 'board' ||
        state.phase === 'missed');
    this.group.visible = visible;
    if (!visible) return;

    const target = zoneX(state.frontZone);
    if (state.phase === 'arrival') {
      const t = Math.min(1, Math.max(0, state.trainProgress));
      const eased = 1 - (1 - t) ** 3;
      this.group.position.x = target - (1 - eased) * 38;
    } else if (state.phase === 'missed') {
      // It closes and pulls away to the left after the player misses it.
      this.group.position.x = target + Math.max(0, state.phaseTime - 0.55) * 7;
    } else {
      this.group.position.x = target;
    }

    const open = state.phase === 'alight' || state.phase === 'board' ? state.doorsOpen : 0;
    for (const door of this.doors) {
      door.mesh.position.x = door.baseX + door.side * open * 0.53;
    }

    this.warmLight.intensity = 7 + open * 16;
  }
}
