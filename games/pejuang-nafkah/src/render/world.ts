import * as THREE from 'three';
import type { SimState } from '../sim/types';
import { zoneX } from '../sim/simulation';
import { InteriorView, INTERIOR_TARGET } from './interior';
import { createPerson, createPlayerVisual, type PersonView } from './people';
import { PLATFORM_TOP, StationView } from './station';
import { TrainView } from './train';

const STATION_OFFSET = new THREE.Vector3(9.5, 14.5, 18.5);
const INTERIOR_OFFSET = new THREE.Vector3(7.5, 10, 14);

export class GameWorld {
  readonly renderer: THREE.WebGLRenderer;

  private readonly scene = new THREE.Scene();

  private readonly camera: THREE.OrthographicCamera;

  private readonly station = new StationView();

  private readonly train = new TrainView();

  private readonly interior = new InteriorView();

  private readonly player = createPlayerVisual();

  private readonly playerBeacon: THREE.Mesh;

  private readonly playerBeaconMaterial: THREE.MeshBasicMaterial;

  private readonly crowd = new Map<number, PersonView>();

  private readonly crowdGroup = new THREE.Group();

  private readonly extras: PersonView[] = [];

  private readonly gateCrowd: PersonView[] = [];

  private readonly alighters: PersonView[] = [];

  private readonly alightGroup = new THREE.Group();

  private builtSeed = -1;

  private width = 390;

  private height = 844;

  private viewHeight = 16.5;

  private readonly target = new THREE.Vector3(-5.5, 1.55, 1.2);

  private readonly desiredTarget = new THREE.Vector3();

  private lastInterior = false;

  private reducedMotion = false;

  private firstFrame = true;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.28;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.scene.fog = new THREE.Fog(0x0b1624, 36, 104);

    const hemi = new THREE.HemisphereLight(0xb9d0df, 0x3b2d20, 1.65);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffc98a, 3.1);
    sun.position.set(36, 42, 24);
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0x7799b3, 1.15);
    fill.position.set(-28, 18, -24);
    this.scene.add(fill);

    this.scene.add(this.station.group);
    this.scene.add(this.train.group);
    this.scene.add(this.interior.group);
    this.scene.add(this.crowdGroup);
    this.scene.add(this.alightGroup);

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 220);
    this.camera.position.copy(this.target).add(STATION_OFFSET);
    this.camera.lookAt(this.target);

    this.createGateCrowd();
    this.createExtras();
    this.createAlighters();

    this.player.group.position.set(-7, 0.06, 2.65);
    this.player.group.rotation.y = -Math.PI / 2;
    this.scene.add(this.player.group);
    this.playerBeaconMaterial = new THREE.MeshBasicMaterial({
      color: 0xffb347,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
      depthWrite: false,
    });
    this.playerBeacon = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.13, 0),
      this.playerBeaconMaterial,
    );
    this.playerBeacon.position.set(0, 2.35, 0);
    this.playerBeacon.renderOrder = 20;
    this.player.group.add(this.playerBeacon);

    this.resize(canvas.clientWidth || 390, canvas.clientHeight || 844);
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  resize(width: number, height: number): void {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(this.width, this.height, false);
    this.applyViewHeight(this.viewHeight);
  }

  update(state: SimState, now: number, delta: number): void {
    const dt = Math.min(Math.max(delta, 0.001), 0.05);
    this.ensureCrowd(state);
    this.station.update(state, now, this.reducedMotion);
    this.train.update(state);
    this.interior.update(state, now, this.reducedMotion);

    const interiorMode =
      state.phase === 'inside' || (state.phase === 'result' && state.result?.success === true);
    this.syncPlayer(state, now, interiorMode);
    this.syncCrowd(state, now);
    this.syncExtras(state);
    this.syncGateCrowd(state);
    this.syncAlighters(state);
    this.updateCamera(state, dt, interiorMode);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  get drawCalls(): number {
    return this.renderer.info.render.calls;
  }

  private applyViewHeight(height: number): void {
    this.viewHeight = height;
    const aspect = this.width / this.height;
    const viewWidth = height * aspect;
    this.camera.left = -viewWidth / 2;
    this.camera.right = viewWidth / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();
  }

  private ensureCrowd(state: SimState): void {
    if (this.builtSeed === state.seed && this.crowd.size === state.actors.length) return;
    for (const person of this.crowd.values()) {
      this.crowdGroup.remove(person.group);
    }
    this.crowd.clear();
    for (const actor of state.actors) {
      const person = createPerson({
        role: actor.role,
        build: actor.build,
        colorIndex: actor.colorIndex,
        aggression: actor.aggression,
        vulnerable: actor.vulnerable,
      });
      person.group.position.set(zoneX(actor.zone), PLATFORM_TOP, 2);
      this.crowdGroup.add(person.group);
      this.crowd.set(actor.id, person);
    }
    this.builtSeed = state.seed;
  }

  private createGateCrowd(): void {
    const queue = [
      { x: 1.6, z: 2.45, role: 'office' as const, ci: 2 },
      { x: 2.9, z: 2.25, role: 'shopper' as const, ci: 6 },
      { x: 3.9, z: 2.55, role: 'student' as const, ci: 4 },
      { x: 5.2, z: 2.3, role: 'worker' as const, ci: 7 },
      { x: 6.1, z: 2.55, role: 'elderly' as const, ci: 3 },
    ];
    for (const entry of queue) {
      const person = createPerson({
        role: entry.role,
        build: entry.role === 'student' ? 'slim' : 'medium',
        colorIndex: entry.ci,
        aggression: 0.05,
        vulnerable: false,
      });
      person.group.position.set(entry.x, 0.2, entry.z);
      person.group.rotation.y = -Math.PI / 2;
      this.crowdGroup.add(person.group);
      this.gateCrowd.push(person);
    }
  }

  private createExtras(): void {
    const offsets = [-1.45, 1.35, -0.9, 0.95];
    const roles = ['office', 'shopper', 'student', 'parent', 'worker', 'elderly'] as const;
    for (let zone = 0; zone < 3; zone += 1) {
      for (let index = 0; index < offsets.length; index += 1) {
        const person = createPerson({
          role: roles[(zone * 2 + index) % roles.length] ?? 'office',
          build: index % 3 === 0 ? 'broad' : index % 3 === 1 ? 'medium' : 'slim',
          colorIndex: (zone * 3 + index + 1) % 8,
          aggression: 0.08,
          vulnerable: false,
        });
        person.group.position.set(
          zoneX(zone) + (offsets[index] ?? 0),
          0.58,
          0.95 + index * 0.34,
        );
        person.group.rotation.y = 0;
        this.crowdGroup.add(person.group);
        this.extras.push(person);
      }
    }
  }

  private createAlighters(): void {
    const roles = ['office', 'shopper', 'worker', 'parent', 'student', 'elderly'] as const;
    for (let index = 0; index < 6; index += 1) {
      const person = createPerson({
        role: roles[index] ?? 'office',
        build: index % 2 === 0 ? 'medium' : 'slim',
        colorIndex: (index + 2) % 8,
        aggression: 0.02,
        vulnerable: false,
      });
      person.group.rotation.y = Math.PI;
      person.group.visible = false;
      this.alightGroup.add(person.group);
      this.alighters.push(person);
    }
  }

  private syncPlayer(state: SimState, now: number, interiorMode: boolean): void {
    const success = state.phase === 'result' && state.result?.success === true;
    const visible = !success && state.phase !== 'inside';
    this.player.group.visible = visible;
    if (!visible) return;

    const onPlatform =
      state.player.x >= 20 ||
      state.phase === 'platform' ||
      state.phase === 'arrival' ||
      state.phase === 'alight' ||
      state.phase === 'board' ||
      state.phase === 'missed';
    const y = onPlatform ? PLATFORM_TOP : state.player.x >= 4 ? 0.2 : 0.06;
    let z = 2.55;
    if (state.phase === 'platform' || state.phase === 'arrival' || state.phase === 'alight') {
      z = 3.55 - state.player.claim * 0.2;
    } else if (state.phase === 'board' || (state.phase === 'result' && state.player.boarded)) {
      z = 3.6 - state.player.boardProgress * 0.3;
    } else if (state.phase === 'missed') {
      z = 0.95;
    }

    const idle = this.reducedMotion ? 0 : Math.sin(now * 2.2) * 0.01;
    this.player.group.position.set(state.player.x, y + idle, z);
    this.player.group.rotation.y =
      state.phase === 'approach' || state.phase === 'gate' || state.phase === 'concourse'
        ? -Math.PI / 2
        : 0;

    let lean = 0;
    if (state.player.holding && (state.phase === 'platform' || state.phase === 'board')) {
      lean = -0.15;
    }
    if (state.burst > 0) lean = -0.3;
    if (state.whistle > 0) lean = 0.12;
    this.player.body.rotation.x = lean;
    this.player.body.rotation.z =
      this.reducedMotion ? 0 : Math.sin(now * 5.5) * (state.player.holding ? 0.008 : 0.002);

    if (this.player.ring) {
      this.player.ring.visible =
        state.phase === 'platform' ||
        state.phase === 'arrival' ||
        state.phase === 'alight' ||
        state.phase === 'board';
      const ringMaterial = this.player.ring.material as THREE.MeshBasicMaterial;
      ringMaterial.color.setHex(state.cameraWarning > 0.08 ? 0xff5a4e : 0xffb347);
      ringMaterial.opacity = 0.55 + (state.player.holding ? 0.3 : 0.1);
      const pulse = this.reducedMotion ? 1 : 1 + Math.sin(now * 5) * 0.04;
      this.player.ring.scale.setScalar(pulse);
    }

    this.playerBeaconMaterial.color.setHex(state.cameraWarning > 0.08 ? 0xff5a4e : 0xffb347);
    this.playerBeacon.visible = !interiorMode;
    this.playerBeacon.position.y =
      2.32 + (this.reducedMotion ? 0 : Math.sin(now * 2.5) * 0.07);
    this.playerBeacon.rotation.y = now * 0.8;
  }

  private syncCrowd(state: SimState, now: number): void {
    const visible =
      state.phase === 'platform' ||
      state.phase === 'arrival' ||
      state.phase === 'alight' ||
      state.phase === 'board' ||
      state.phase === 'missed';
    for (const actor of state.actors) {
      const person = this.crowd.get(actor.id);
      if (!person) continue;
      const show = visible && !actor.boarded;
      person.group.visible = show;
      if (!show) continue;

      const lane = (actor.lane - 0.5) * 0.55;
      const z = 2.12 - actor.boardProgress * 1.75 + lane;
      const x = zoneX(actor.zone) + actor.xOffset;
      const bob = this.reducedMotion ? 0 : Math.sin(now * 2.1 + actor.id * 1.7) * 0.012;
      person.group.position.set(x, PLATFORM_TOP + bob, z);
      person.group.rotation.y = actor.aggression > 0.62 ? -0.1 : 0;

      const crowdLean = state.crowdPulse * (actor.aggression > 0.62 ? 0.14 : 0.08);
      person.body.rotation.x = -crowdLean;
      person.body.rotation.z = this.reducedMotion
        ? 0
        : Math.sin(now * 1.7 + actor.id) * 0.012;
      if (person.icon) {
        person.icon.visible = actor.vulnerable && !actor.protected;
        person.icon.position.y =
          (actor.role === 'child' ? 1.78 : 2.2) +
          (this.reducedMotion ? 0 : Math.sin(now * 2.2 + actor.id) * 0.04);
      }
    }
  }

  private syncExtras(state: SimState): void {
    const visible =
      state.phase === 'platform' ||
      state.phase === 'arrival' ||
      state.phase === 'alight' ||
      state.phase === 'board' ||
      state.phase === 'missed';
    this.extras.forEach((person, index) => {
      person.group.visible = visible && (state.wave === 1 || index < 7);
    });
  }

  private syncGateCrowd(state: SimState): void {
    const visible =
      state.phase === 'ready' ||
      state.phase === 'approach' ||
      state.phase === 'gate' ||
      state.phase === 'concourse';
    for (const person of this.gateCrowd) person.group.visible = visible;
  }

  private syncAlighters(state: SimState): void {
    const arriving = state.phase === 'alight';
    this.alightGroup.visible = arriving;
    if (!arriving) return;
    const t = Math.min(1, state.phaseTime / 2.45);
    this.alighters.forEach((person, index) => {
      const direction = index % 2 === 0 ? -1 : 1;
      const x =
        (state.frontZone >= 0 ? zoneX(state.frontZone) : zoneX(0)) +
        direction * (0.35 + (index % 3) * 0.22);
      const z = -0.42 + t * 2.45 + (index % 2) * 0.12;
      person.group.position.set(x, PLATFORM_TOP, z);
      person.group.rotation.y = Math.PI;
      person.group.visible = true;
      person.body.rotation.x = -0.05 + t * 0.08;
    });
  }

  private updateCamera(state: SimState, dt: number, interiorMode: boolean): void {
    if (interiorMode) {
      this.desiredTarget.set(INTERIOR_TARGET.x, INTERIOR_TARGET.y, INTERIOR_TARGET.z);
    } else {
      const outside =
        state.phase === 'ready' ||
        state.phase === 'approach' ||
        state.phase === 'gate' ||
        state.phase === 'concourse';
      const lookAhead = outside ? 2.0 : state.phase === 'board' ? 0.9 : 1.1;
      this.desiredTarget.set(state.player.x + lookAhead, 1.62, 0.95);
    }

    const desiredHeight = interiorMode
      ? 10.5
      : state.phase === 'board'
        ? 18.5
        : state.phase === 'platform' || state.phase === 'arrival' || state.phase === 'alight'
          ? 23
          : 19;
    if (Math.abs(desiredHeight - this.viewHeight) > 0.01) {
      this.applyViewHeight(desiredHeight);
    }

    const shouldSnap = this.firstFrame || this.lastInterior !== interiorMode;
    if (shouldSnap) {
      this.target.copy(this.desiredTarget);
    } else {
      this.target.lerp(this.desiredTarget, 1 - Math.exp(-dt * 4.2));
    }
    const offset = interiorMode ? INTERIOR_OFFSET : STATION_OFFSET;
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
    this.lastInterior = interiorMode;
    this.firstFrame = false;
  }
}
