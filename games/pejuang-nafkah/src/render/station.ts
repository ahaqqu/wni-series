import * as THREE from 'three';
import { zoneName, zoneX } from '../sim/simulation';
import type { SimState } from '../sim/types';
import { ColoredBucket, glowMaterial, solidMaterial } from './geometry';
import {
  DynamicBoard,
  makeFloorLabelTexture,
  makeSignMesh,
} from './textures';

export const PLATFORM_TOP = 0.58;
const NEAR_EDGE_Z = 0;
const YELLOW_LINE_Z = 0.48;
const PLAYER_STAND_Z = 2.65;

interface ZoneMarker {
  zone: number;
  label: THREE.Mesh;
  labelMaterial: THREE.MeshBasicMaterial;
  edge: THREE.Mesh;
  edgeMaterial: THREE.MeshBasicMaterial;
}

export class StationView {
  readonly group = new THREE.Group();

  private readonly board: DynamicBoard;

  private readonly zoneMarkers: ZoneMarker[] = [];

  private readonly steam = new THREE.Group();

  private reducedMotion = false;

  constructor() {
    this.group.name = 'jurangmangu-station';
    const solid = new ColoredBucket();
    const glow = new ColoredBucket();

    this.buildGround(solid);
    this.buildTracks(solid);
    this.buildNearPlatform(solid, glow);
    this.buildConcourse(solid, glow);
    this.buildOutside(solid, glow);
    this.buildFarSide(solid, glow);
    this.buildSkyline(solid, glow);

    this.group.add(solid.build(solidMaterial({ roughness: 0.92 })));
    this.group.add(glow.build(glowMaterial()));

    this.addStaticLights();

    this.board = new DynamicBoard(3.2, 1.45, {
      width: 512,
      height: 232,
      background: '#0b1624',
      border: 'rgba(244, 235, 221, 0.32)',
      accent: '#ffb347',
      padding: 24,
    });
    this.board.mesh.position.set(24.6, 3.28, 3.18);
    this.group.add(this.board.mesh);
    const hanger = new ColoredBucket();
    hanger.box(0.05, 0.7, 0.05, '#505b63', { x: 23.4, y: 3.85, z: 3.18 });
    hanger.box(0.05, 0.7, 0.05, '#505b63', { x: 25.8, y: 3.85, z: 3.18 });
    this.group.add(hanger.build(solidMaterial({ metalness: 0.4, roughness: 0.5 })));

    this.buildZoneMarkers();
    this.buildSteam();
  }

  update(state: SimState, now: number, reducedMotion: boolean): void {
    this.reducedMotion = reducedMotion;
    this.updateBoard(state);
    this.updateZoneMarkers(state);
    this.updateSteam(state, now);
  }

  private buildGround(bucket: ColoredBucket): void {
    bucket.box(130, 0.3, 90, '#151d24', { x: 30, y: -0.2, z: -5 });
    bucket.box(52, 0.12, 13, '#1f282e', { x: 28, y: 0.0, z: 9.2 });
    bucket.box(37, 0.16, 8, '#252d31', { x: -2, y: 0.02, z: 8.0 });
    bucket.box(24, 0.2, 4.4, '#39434a', { x: 5, y: 0.05, z: 4.4 });
    bucket.box(15, 0.18, 6.5, '#303a40', { x: 12.5, y: 0.1, z: 2.6 });

    // Parking bay lines, deliberately low so they read as paint.
    for (let index = 0; index < 5; index += 1) {
      bucket.box(0.07, 0.025, 3.4, '#b6b2a6', {
        x: -8 + index * 3.1,
        y: 0.09,
        z: 9.2,
      });
    }
    bucket.box(12.5, 0.025, 0.08, '#b6b2a6', { x: -1.8, y: 0.09, z: 8.2 });
  }

  private buildTracks(bucket: ColoredBucket): void {
    bucket.box(84, 0.28, 8.2, '#232729', { x: 35, y: 0.03, z: -4.1 });
    for (const center of [-2.2, -5.2]) {
      bucket.box(84, 0.15, 3.4, '#3b332d', { x: 35, y: 0.1, z: center });
      for (let x = -6; x < 72; x += 1.1) {
        bucket.box(0.22, 0.08, 3.25, '#4a3a2d', { x, y: 0.17, z: center });
      }
      for (const offset of [-1.08, 1.08]) {
        bucket.box(84, 0.09, 0.12, '#8b9094', {
          x: 35,
          y: 0.26,
          z: center + offset,
        });
        bucket.box(84, 0.05, 0.28, '#5c6062', {
          x: 35,
          y: 0.22,
          z: center + offset,
        });
      }
    }
    for (const z of [-1.12, -3.28, -4.12, -6.28]) {
      for (let x = -6; x < 72; x += 8) {
        bucket.box(0.35, 0.3, 0.35, '#51575a', { x, y: 0.15, z });
      }
    }
  }

  private buildNearPlatform(solid: ColoredBucket, glow: ColoredBucket): void {
    solid.box(42, 0.55, 5.6, '#626a6d', { x: 41, y: 0.275, z: 2.7 });
    solid.box(42, 0.08, 5.34, '#7c8283', { x: 41, y: 0.555, z: 2.7 });
    solid.box(42, 0.13, 0.32, '#d8d1c1', { x: 41, y: 0.585, z: 0.16 });
    solid.box(42, 0.09, 0.16, '#e9bd4f', { x: 41, y: 0.6, z: YELLOW_LINE_Z });
    solid.box(42, 0.03, 0.42, '#b9ab86', { x: 41, y: 0.6, z: 0.7 });

    // A short ramp from concourse level to platform level.
    solid.box(2.4, 0.36, 5.2, '#4b5357', { x: 20.9, y: 0.3, z: 2.6, rz: -0.12 });

    const columns = [23, 29, 35, 41, 47, 53, 59];
    for (const x of columns) {
      solid.cylinder(0.16, 0.19, 3.55, 8, '#39444b', { x, y: 2.36, z: 3.8 });
      solid.cylinder(0.24, 0.3, 0.14, 8, '#2b3338', { x, y: 4.14, z: 3.8 });
    }
    // Cutaway station: columns and platform lights only, no solid roof or
    // overhead truss between the isometric camera and the crowd.
    solid.box(40, 0.1, 0.25, '#ffb347', { x: 41, y: 4.05, z: -0.38 });
    solid.box(40, 0.08, 0.4, '#3b464c', { x: 41, y: 3.94, z: 3.45 });

    // Benches.
    for (const x of [26.5, 51.5]) {
      solid.box(2.6, 0.13, 0.62, '#7b5338', { x, y: 1.04, z: 3.7 });
      solid.box(2.6, 0.68, 0.1, '#6b472f', { x, y: 1.35, z: 3.99 });
      solid.box(0.1, 0.48, 0.5, '#3c4143', { x: x - 1.1, y: 0.76, z: 3.7 });
      solid.box(0.1, 0.48, 0.5, '#3c4143', { x: x + 1.1, y: 0.76, z: 3.7 });
    }

    solid.cylinder(0.36, 0.4, 0.85, 8, '#3e5153', { x: 34, y: 0.99, z: 4.3 });
    solid.cylinder(0.4, 0.4, 0.08, 8, '#2b3839', { x: 34, y: 1.42, z: 4.3 });

    solid.box(0.1, 2.35, 0.1, '#5b6468', { x: 46.6, y: 1.72, z: 3.6 });
    solid.box(0.1, 2.35, 0.1, '#5b6468', { x: 48.5, y: 1.72, z: 3.6 });
    const platformSign = makeSignMesh(
      [
        { text: 'PERON 1', size: 32, weight: 800, color: '#f4ebdd' },
        { text: 'TANAH ABANG', size: 18, weight: 600, color: '#ffb347' },
      ],
      3.3,
      0.9,
      {
        width: 512,
        height: 150,
        background: '#101b26',
        border: 'rgba(244, 235, 221, 0.28)',
        accent: '#ffb347',
        padding: 22,
      },
    );
    platformSign.position.set(47.55, 2.7, 3.62);
    this.group.add(platformSign);

    for (const x of [27.2, 30.3, 33.4]) {
      solid.cylinder(0.025, 0.03, 0.7, 5, '#9a7b48', { x, y: 0.95, z: 0.93 });
      solid.cylinder(0.08, 0.08, 0.03, 8, '#c8bca4', { x, y: 0.63, z: 0.93 });
    }
  }

  private buildConcourse(solid: ColoredBucket, glow: ColoredBucket): void {
    solid.box(15.8, 0.18, 5.3, '#4d555a', { x: 12.1, y: 0.09, z: 2.6 });
    solid.box(15.8, 0.04, 5.1, '#60676a', { x: 12.1, y: 0.2, z: 2.6 });

    // Canopy over the concourse; roof is above the camera sightline.
    for (const x of [7, 11.2, 15.4, 19.6]) {
      solid.cylinder(0.13, 0.15, 3.25, 8, '#3c464b', { x, y: 1.86, z: 4.5 });
    }
    solid.box(14.5, 0.07, 0.16, '#e0a84b', { x: 13.2, y: 3.45, z: 2.1 });
    for (const x of [8.5, 12.5, 16.5]) {
      glow.box(0.75, 0.04, 0.22, '#ffd79a', { x, y: 3.42, z: 2.65 });
    }

    // Three fare gates. The centre lane is the one the player walks through.
    for (const z of [1.35, 2.6, 3.85]) {
      for (const side of [-1, 1] as const) {
        const gateZ = z + side * 0.52;
        solid.box(0.72, 1.05, 0.36, '#d7d0bf', { x: 7.3, y: 0.68, z: gateZ });
        solid.box(0.76, 0.1, 0.42, '#3e474a', { x: 7.3, y: 1.23, z: gateZ });
        solid.box(0.08, 0.38, 0.06, '#1b2428', { x: 7.3, y: 0.82, z: gateZ + side * 0.2 });
        glow.box(0.16, 0.06, 0.04, side === -1 ? '#2ec4b6' : '#ffb347', {
          x: 7.3,
          y: 1.12,
          z: gateZ + side * 0.21,
        });
      }
    }
    // Queue rails.
    for (const z of [0.95, 4.2]) {
      for (const x of [3.4, 4.8, 6.2]) {
        solid.cylinder(0.045, 0.05, 1.0, 6, '#a9a69b', { x, y: 0.58, z });
      }
      solid.box(3.0, 0.06, 0.06, '#a9a69b', { x: 4.8, y: 0.55, z });
    }

    // Ticket machine.
    solid.box(1.35, 1.9, 0.55, '#303b40', { x: 9.3, y: 1.05, z: 4.35 });
    solid.box(0.56, 0.55, 0.08, '#152631', { x: 9.3, y: 1.38, z: 4.06 });
    glow.box(0.4, 0.04, 0.04, '#78d9ce', { x: 9.3, y: 1.18, z: 4.05 });

    // Coffee cart.
    solid.box(2.4, 1.02, 1.25, '#865436', { x: 16.8, y: 0.68, z: 3.4 });
    solid.box(2.55, 0.1, 1.4, '#a56b43', { x: 16.8, y: 1.25, z: 3.38 });
    solid.box(0.58, 0.5, 0.48, '#313a3e', { x: 16.2, y: 1.56, z: 3.32 });
    solid.box(0.16, 0.22, 0.16, '#d8d2c3', { x: 17.7, y: 1.46, z: 3.25 });
    solid.cylinder(0.08, 0.08, 0.24, 8, '#eee4d2', { x: 17.05, y: 1.51, z: 3.06 });
    solid.cylinder(0.1, 0.1, 0.03, 8, '#eee4d2', { x: 17.05, y: 1.62, z: 3.06 });
    solid.box(2.4, 0.08, 1.35, '#c9a06c', { x: 16.8, y: 2.08, z: 3.4, rz: 0.04 });
    solid.box(0.08, 2.0, 0.08, '#4a4c48', { x: 15.7, y: 1.15, z: 4.0 });
    solid.box(0.08, 2.0, 0.08, '#4a4c48', { x: 17.9, y: 1.15, z: 4.0 });

    const coffeeSign = makeSignMesh(
      [
        { text: 'KOPI SUBUH', size: 42, weight: 800, color: '#ffcf70' },
        { text: 'Rp 10.000 · ENERGI +40', size: 17, weight: 600, color: '#f4ebdd' },
      ],
      2.0,
      0.72,
      {
        width: 512,
        height: 180,
        background: '#2b1a12',
        border: 'rgba(255, 207, 112, 0.5)',
        accent: '#ffb347',
        padding: 24,
      },
    );
    coffeeSign.position.set(17.85, 2.05, 3.15);
    coffeeSign.rotation.y = -0.16;
    this.group.add(coffeeSign);

    // A low planter and the station clock.
    solid.box(3.2, 0.55, 0.8, '#4a3f36', { x: 17.8, y: 0.38, z: 0.9 });
    solid.box(3.0, 0.1, 0.65, '#3c342d', { x: 17.8, y: 0.66, z: 0.9 });
    solid.cylinder(0.07, 0.08, 3.0, 7, '#50595e', { x: 11.6, y: 1.55, z: 4.9 });
    solid.cylinder(0.36, 0.36, 0.1, 16, '#1b242a', {
      x: 11.6,
      y: 3.15,
      z: 4.9,
      rx: Math.PI / 2,
    });
    solid.box(0.03, 0.22, 0.02, '#f4ebdd', { x: 11.6, y: 3.2, z: 4.84 });
    solid.box(0.16, 0.03, 0.02, '#f4ebdd', { x: 11.66, y: 3.15, z: 4.84 });

    const gateSign = makeSignMesh(
      [
        { text: 'TAP IN', size: 38, weight: 800, color: '#f4ebdd' },
        { text: 'E-KTP / QR', size: 16, weight: 600, color: '#ffb347' },
      ],
      1.35,
      0.55,
      {
        width: 384,
        height: 150,
        background: '#13212b',
        border: 'rgba(244, 235, 221, 0.28)',
        accent: '#2ec4b6',
        padding: 20,
      },
    );
    gateSign.position.set(7.3, 2.15, 4.75);
    this.group.add(gateSign);
  }

  private buildOutside(solid: ColoredBucket, glow: ColoredBucket): void {
    // Low fence around the parking bay.
    for (let index = 0; index < 9; index += 1) {
      const x = -13 + index * 2.1;
      solid.box(0.08, 1.0, 0.08, '#4d585b', { x, y: 0.55, z: 6.1 });
    }
    solid.box(17, 0.08, 0.08, '#4d585b', { x: -4.6, y: 1.03, z: 6.1 });
    solid.box(4.2, 0.08, 0.08, '#4d585b', { x: 8.5, y: 1.03, z: 6.1 });

    // South gate portal. The beam is high; the player is readable underneath.
    for (const x of [-9.6, -4.4]) {
      solid.box(0.22, 4.1, 0.22, '#3f4a4e', { x, y: 2.05, z: 5.55 });
    }
    solid.box(5.8, 0.24, 0.28, '#2d383d', { x: -7, y: 4.18, z: 5.55 });
    solid.box(5.2, 0.05, 0.06, '#ffb347', { x: -7, y: 4.03, z: 5.4 });
    glow.box(0.38, 0.04, 0.04, '#ffd79a', { x: -7, y: 3.92, z: 5.43 });

    // Scooters and a small car, all low-poly and below the sightline.
    for (const [x, z] of [
      [-3.4, 8.1],
      [-1.2, 8.55],
      [1.1, 8.0],
    ] as const) {
      solid.box(0.18, 0.55, 0.18, '#333b3e', { x, y: 0.28, z });
      solid.cylinder(0.3, 0.3, 0.14, 8, '#202528', {
        x: x - 0.52,
        y: 0.32,
        z,
        rx: Math.PI / 2,
      });
      solid.cylinder(0.3, 0.3, 0.14, 8, '#202528', {
        x: x + 0.52,
        y: 0.32,
        z,
        rx: Math.PI / 2,
      });
      solid.box(0.85, 0.08, 0.24, '#6a4b37', { x, y: 0.66, z });
      solid.box(0.4, 0.07, 0.08, '#8a8f90', { x, y: 0.85, z });
    }

    solid.box(3.9, 0.62, 1.72, '#6c7d80', { x: 3.5, y: 0.55, z: 9.6 });
    solid.box(2.0, 0.55, 1.6, '#78898b', { x: 3.5, y: 1.12, z: 9.6 });
    solid.box(0.3, 0.08, 1.7, '#2c3235', { x: 3.5, y: 1.42, z: 9.6 });
    for (const x of [2.5, 4.5]) {
      for (const z of [8.75, 10.45]) {
        solid.cylinder(0.24, 0.24, 0.14, 8, '#1d2224', {
          x,
          y: 0.3,
          z,
          rx: Math.PI / 2,
        });
      }
    }

    // Warung and its low awning.
    solid.box(2.7, 0.8, 1.2, '#6d4a35', { x: -9.2, y: 0.5, z: 8.9 });
    solid.box(2.8, 0.08, 1.3, '#c7b18f', { x: -9.2, y: 0.95, z: 8.9 });
    solid.box(0.08, 1.8, 0.08, '#4d4e47', { x: -10.4, y: 1.9, z: 9.5 });
    solid.box(0.08, 1.8, 0.08, '#4d4e47', { x: -8.0, y: 1.9, z: 9.5 });
    solid.box(3.0, 0.08, 1.7, '#3e6b5f', { x: -9.2, y: 2.8, z: 9.0, rz: 0.06 });
    glow.box(0.32, 0.3, 0.3, '#ffd59b', { x: -9.2, y: 2.35, z: 8.7 });

    const parkSign = makeSignMesh(
      [
        { text: 'PARKIR', size: 42, weight: 800, color: '#ffcf70' },
        { text: 'MOTOR · MOBIL', size: 16, weight: 600, color: '#f4ebdd' },
      ],
      1.65,
      0.58,
      {
        width: 384,
        height: 150,
        background: '#1b262d',
        border: 'rgba(255, 207, 112, 0.42)',
        accent: '#ffb347',
        padding: 20,
      },
    );
    parkSign.position.set(1.1, 1.28, 6.18);
    this.group.add(parkSign);

    const gateSign = makeSignMesh(
      [
        { text: 'PINTU SELATAN', size: 40, weight: 800, color: '#f4ebdd' },
        { text: 'JL. CENDERAWASIH', size: 17, weight: 600, color: '#ffb347' },
      ],
      4.9,
      1.0,
      {
        width: 640,
        height: 160,
        background: '#101b24',
        border: 'rgba(244, 235, 221, 0.3)',
        accent: '#ffb347',
        padding: 22,
      },
    );
    gateSign.position.set(-7, 4.32, 5.38);
    this.group.add(gateSign);
  }

  private buildFarSide(solid: ColoredBucket, glow: ColoredBucket): void {
    solid.box(42, 0.55, 4.2, '#4d5356', { x: 41, y: 0.27, z: -9.1 });
    solid.box(42, 0.07, 4.0, '#5d6264', { x: 41, y: 0.55, z: -9.1 });
    solid.box(42, 0.1, 0.22, '#d8d1c1', { x: 41, y: 0.58, z: -7.12 });
    solid.box(42, 0.06, 0.13, '#e9bd4f', { x: 41, y: 0.6, z: -7.42 });

    for (const x of [23, 31, 39, 47, 55]) {
      solid.cylinder(0.15, 0.17, 3.4, 8, '#3d484d', { x, y: 2.3, z: -8.25 });
    }
    solid.box(38, 0.18, 3.8, '#2c383d', { x: 40, y: 3.98, z: -9.3 });
    for (const x of [27, 35, 43, 51]) {
      glow.box(0.75, 0.035, 0.2, '#ffd79a', { x, y: 3.83, z: -8.1 });
    }

    // Main station building on the far side, visible above the train.
    solid.box(24, 5.8, 4.2, '#33434c', { x: -2, y: 2.9, z: -13.6 });
    solid.box(24.6, 0.26, 4.6, '#26343b', { x: -2, y: 5.95, z: -13.6 });
    solid.box(24, 0.5, 4.3, '#25333a', { x: -2, y: 0.35, z: -13.6 });
    solid.box(23.8, 1.0, 0.14, '#26363f', { x: -2, y: 4.85, z: -11.43 });
    for (let index = 0; index < 6; index += 1) {
      const x = -12.5 + index * 4.2;
      solid.box(1.3, 2.0, 0.12, '#1b2b36', { x, y: 2.45, z: -11.45 });
      solid.box(1.3, 0.08, 0.16, '#d8cab2', { x, y: 3.5, z: -11.44 });
      glow.box(1.14, 0.06, 0.04, '#ffcf8a', { x, y: 3.34, z: -11.38 });
      solid.box(0.18, 2.2, 0.16, '#4e5a5e', { x: x - 0.8, y: 2.5, z: -11.42 });
    }

    const stationName = makeSignMesh(
      [
        { text: 'JURANGMANGU', size: 54, weight: 800, color: '#f4ebdd' },
        { text: 'TANGERANG SELATAN', size: 19, weight: 600, color: '#ffb347' },
      ],
      7.8,
      1.85,
      {
        width: 896,
        height: 240,
        background: '#101b25',
        border: 'rgba(244, 235, 221, 0.3)',
        accent: '#ffb347',
        label: 'STASIUN',
        padding: 26,
      },
    );
    stationName.position.set(-5, 5.1, -11.38);
    this.group.add(stationName);

    const farPlatformSign = makeSignMesh(
      [
        { text: 'PERON 2', size: 30, weight: 800, color: '#f4ebdd' },
        { text: 'RANGKASBITUNG', size: 16, weight: 600, color: '#ffb347' },
      ],
      2.9,
      0.8,
      {
        width: 448,
        height: 146,
        background: '#101b25',
        border: 'rgba(244, 235, 221, 0.25)',
        accent: '#ffb347',
        padding: 20,
      },
    );
    farPlatformSign.position.set(20, 2.75, -8.2);
    this.group.add(farPlatformSign);

    // Trees and a couple of utility poles.
    for (const [x, z, height] of [
      [-13, -7.5, 3.1],
      [58, -7.8, 3.8],
      [64, -12, 2.7],
      [-17, -11, 2.5],
    ] as const) {
      solid.cylinder(0.11, 0.16, height, 6, '#5f4c38', { x, y: height / 2, z });
      solid.cylinder(0.55, 1.4, 2.1, 7, '#315a45', { x, y: height + 0.8, z });
      solid.cylinder(0.4, 1.1, 1.4, 7, '#3d6a51', { x, y: height + 1.55, z });
    }
    for (const x of [-4, 20, 44, 66]) {
      solid.cylinder(0.08, 0.1, 6.5, 6, '#4b4e4b', { x, y: 3.25, z: -17.5 });
      solid.box(2.0, 0.08, 0.08, '#4b4e4b', { x, y: 6.1, z: -17.5 });
    }
  }

  private buildSkyline(solid: ColoredBucket, glow: ColoredBucket): void {
    const towers = [
      { x: -6, z: -27, w: 7, h: 8, d: 5, color: '#22323b' },
      { x: 5, z: -31, w: 8, h: 12, d: 6, color: '#1c2b34' },
      { x: 18, z: -29, w: 6, h: 7, d: 5, color: '#24343d' },
      { x: 32, z: -33, w: 9, h: 17, d: 7, color: '#1a2a33' },
      { x: 47, z: -30, w: 6, h: 10, d: 5, color: '#22343c' },
      { x: 59, z: -26, w: 8, h: 6, d: 5, color: '#26373e' },
    ];
    for (const tower of towers) {
      solid.box(tower.w, tower.h, tower.d, tower.color, {
        x: tower.x,
        y: tower.h / 2,
        z: tower.z,
      });
      for (let row = 0; row < Math.floor(tower.h / 2); row += 1) {
        for (let column = 0; column < Math.floor(tower.w / 1.8); column += 1) {
          if ((row + column) % 3 === 0) {
            glow.box(0.22, 0.12, 0.04, '#d6b16b', {
              x: tower.x - tower.w / 2 + 0.9 + column * 1.8,
              y: 1.2 + row * 1.7,
              z: tower.z + tower.d / 2 + 0.03,
            });
          }
        }
      }
    }
    for (const [x, z, h] of [
      [-2, -22, 3.5],
      [12, -23, 4.2],
      [40, -24, 3.2],
    ] as const) {
      solid.cylinder(0.35, 0.7, h, 6, '#2b443a', { x, y: h / 2, z });
    }
  }

  private addStaticLights(): void {
    const platformLight = new THREE.PointLight(0xffd0a0, 30, 15, 2);
    platformLight.position.set(35, 3.62, 2.1);
    this.group.add(platformLight);

    const secondPlatformLight = new THREE.PointLight(0xffd0a0, 24, 14, 2);
    secondPlatformLight.position.set(49, 3.62, 2.1);
    this.group.add(secondPlatformLight);

    const coffeeLight = new THREE.PointLight(0xffb35c, 10, 5, 2);
    coffeeLight.position.set(16.8, 2.1, 3.3);
    this.group.add(coffeeLight);

    const farLight = new THREE.PointLight(0x9dc8d4, 16, 18, 2);
    farLight.position.set(4, 4.4, -12);
    this.group.add(farLight);
  }

  private buildZoneMarkers(): void {
    for (let zone = 0; zone < 3; zone += 1) {
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: makeFloorLabelTexture(zoneName(zone)),
        transparent: true,
        depthWrite: false,
        color: 0xffb347,
        side: THREE.DoubleSide,
      });
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), labelMaterial);
      label.rotation.x = -Math.PI / 2;
      label.position.set(zoneX(zone), PLATFORM_TOP + 0.015, 4.15);
      label.renderOrder = 1;
      this.group.add(label);

      const edgeMaterial = new THREE.MeshBasicMaterial({
        color: 0xffb347,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.13), edgeMaterial);
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(zoneX(zone), PLATFORM_TOP + 0.02, 0.36);
      edge.renderOrder = 1;
      this.group.add(edge);

      this.zoneMarkers.push({
        zone,
        label,
        labelMaterial,
        edge,
        edgeMaterial,
      });
    }
  }

  private buildSteam(): void {
    for (let index = 0; index < 4; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: 0xf4ebdd,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
      });
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.16, 7, 5), material);
      puff.position.set(16.8 + (index - 1.5) * 0.12, 2.4, 3.45);
      this.steam.add(puff);
    }
    this.group.add(this.steam);
  }

  private updateBoard(state: SimState): void {
    const label = 'PAPAN PERON';
    if (state.phase === 'platform') {
      this.board.set(
        [
          { text: 'PINTU DEPAN', size: 32, weight: 700, color: '#f4ebdd' },
          {
            text: `ZONA ${zoneName(state.estimate)}`,
            size: 86,
            weight: 800,
            color: '#ffb347',
          },
          { text: 'PERKIRAAN', size: 25, weight: 600, color: '#7aa2c8' },
        ],
        {
          width: 512,
          height: 232,
          background: '#0b1624',
          border: 'rgba(244, 235, 221, 0.32)',
          accent: '#ffb347',
          label,
          padding: 24,
        },
      );
      return;
    }

    if (state.phase === 'arrival' || state.phase === 'alight' || state.phase === 'board') {
      const actual = state.frontZone >= 0 ? zoneName(state.frontZone) : '?';
      this.board.set(
        [
          { text: 'PINTU DEPAN', size: 32, weight: 700, color: '#f4ebdd' },
          { text: `ZONA ${actual}`, size: 86, weight: 800, color: '#2ec4b6' },
          { text: 'AKTUAL', size: 25, weight: 600, color: '#2ec4b6' },
        ],
        {
          width: 512,
          height: 232,
          background: '#0b1624',
          border: 'rgba(46, 196, 182, 0.42)',
          accent: '#2ec4b6',
          label,
          padding: 24,
        },
      );
      return;
    }

    if (state.phase === 'missed') {
      this.board.set(
        [
          { text: 'PINTU TUTUP', size: 38, weight: 800, color: '#ffb3aa' },
          { text: 'TUNGGU KERETA', size: 29, weight: 700, color: '#f4ebdd' },
          { text: 'BERIKUTNYA', size: 23, weight: 600, color: '#7aa2c8' },
        ],
        {
          width: 512,
          height: 232,
          background: '#201215',
          border: 'rgba(255, 90, 78, 0.4)',
          accent: '#ff5a4e',
          label,
          padding: 24,
        },
      );
      return;
    }

    this.board.set(
      [
        { text: 'PERON 1', size: 40, weight: 800, color: '#f4ebdd' },
        { text: 'TANAH ABANG', size: 24, weight: 600, color: '#ffb347' },
        { text: '06:12', size: 30, weight: 700, color: '#7aa2c8', mono: true },
      ],
      {
        width: 512,
        height: 232,
        background: '#0b1624',
        border: 'rgba(244, 235, 221, 0.24)',
        accent: '#ffb347',
        label: 'STASIUN JURANGMANGU',
        padding: 24,
      },
    );
  }

  private updateZoneMarkers(state: SimState): void {
    for (const marker of this.zoneMarkers) {
      const actual = state.trainRevealed && state.frontZone === marker.zone;
      const estimate = !state.trainRevealed && state.estimate === marker.zone;
      const color = actual ? 0x2ec4b6 : estimate ? 0xffb347 : 0x8d979b;
      marker.labelMaterial.color.setHex(color);
      marker.labelMaterial.opacity = actual ? 1 : estimate ? 0.9 : 0.28;
      marker.edgeMaterial.color.setHex(color);
      marker.edgeMaterial.opacity = actual ? 0.95 : estimate ? 0.75 : 0.16;
      marker.label.visible =
        state.phase === 'platform' ||
        state.phase === 'arrival' ||
        state.phase === 'alight' ||
        state.phase === 'board';
      marker.edge.visible = marker.label.visible;
    }
  }

  private updateSteam(state: SimState, now: number): void {
    this.steam.visible = !state.coffee.bought && state.phase !== 'inside';
    if (!this.steam.visible) return;
    this.steam.children.forEach((object, index) => {
      const puff = object as THREE.Mesh;
      const material = puff.material as THREE.MeshBasicMaterial;
      const phase = this.reducedMotion ? 0.45 : (now * 0.32 + index * 0.23) % 1;
      puff.position.set(
        15 + Math.sin(now * 0.6 + index * 1.3) * 0.12,
        2.32 + phase * 0.95,
        4.25 + Math.cos(now * 0.4 + index) * 0.08,
      );
      const scale = 0.55 + phase * 1.1;
      puff.scale.setScalar(scale);
      material.opacity = (1 - phase) * 0.16;
    });
  }
}

export const STATION_LAYOUT = {
  playerStandZ: PLAYER_STAND_Z,
  yellowLineZ: YELLOW_LINE_Z,
  platformEdgeZ: NEAR_EDGE_Z,
  platformTop: PLATFORM_TOP,
} as const;
