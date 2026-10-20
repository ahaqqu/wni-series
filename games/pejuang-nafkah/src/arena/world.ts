import * as THREE from 'three';
import { createPerson, createPlayerVisual, type PersonView } from '../render/people';
import { ARENA, incomingProgress, type ArenaPassenger, type ArenaState } from './sim';

const ARENA_OFFSET = new THREE.Vector3(7.5, 11, 14);
const ARENA_TARGET = new THREE.Vector3(0, 1.05, 0);
const VIEW_HEIGHT = 19.2;
export const ARENA_ZOOM_MIN = 1;
export const ARENA_ZOOM_MAX = 1.8;

const FLOOR = 0x252e33;
const FLOOR_EDGE = 0x3c464b;
const AMBER = 0xffb347;
const TEAL = 0x2ec4b6;
const RED = 0xff5a4e;
const BLUE = 0x6e8fa7;
const ORANGE = 0xff8a3d;
const FALL_ANGLE = 1.35;

interface FallDirection {
  x: number;
  z: number;
}

function fallDirection(vx: number, vz: number, facing: number): FallDirection {
  const speed = Math.hypot(vx, vz);
  if (speed > 0.08) return { x: vx / speed, z: vz / speed };
  return { x: Math.sin(facing), z: Math.cos(facing) };
}

function easeToward(value: number, target: number, step: number): number {
  if (value < target) return Math.min(target, value + step);
  return Math.max(target, value - step);
}

function ringMesh(
  inner: number,
  outer: number,
  color: number,
  opacity: number,
): THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial> {
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 64), material);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

function discMesh(radius: number, color: number, opacity: number): THREE.Mesh {
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 40), material);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

function alertTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (context) {
    context.clearRect(0, 0, 64, 64);
    context.fillStyle = 'rgba(255, 90, 78, .95)';
    context.beginPath();
    context.arc(32, 32, 25, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#fff4e4';
    context.font = '700 38px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('!', 32, 34);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function labelTexture(text: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 48;
  const context = canvas.getContext('2d');
  if (context) {
    context.clearRect(0, 0, 128, 48);
    context.fillStyle = 'rgba(5, 12, 19, .82)';
    context.fillRect(3, 3, 122, 42);
    context.strokeStyle = color;
    context.lineWidth = 3;
    context.strokeRect(3, 3, 122, 42);
    context.fillStyle = color;
    context.font = '700 23px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 64, 25);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export class ArenaWorld {
  readonly renderer: THREE.WebGLRenderer;

  private readonly scene = new THREE.Scene();

  private readonly camera: THREE.OrthographicCamera;

  private readonly player = createPlayerVisual();

  private readonly aggressive = createPerson({
    role: 'worker',
    build: 'broad',
    colorIndex: 1,
    aggression: 0.95,
    vulnerable: false,
  });

  private readonly passive = createPerson({
    role: 'student',
    build: 'slim',
    colorIndex: 2,
    aggression: 0,
    vulnerable: false,
  });

  private readonly filmer = createPerson({
    role: 'shopper',
    build: 'medium',
    colorIndex: 3,
    aggression: 0,
    vulnerable: false,
  });

  private readonly aggressiveRing = ringMesh(0.42, 0.52, RED, 0.55);

  private readonly passiveRing = ringMesh(0.34, 0.42, BLUE, 0.4);

  private readonly filmerRing = ringMesh(0.4, 0.48, AMBER, 0.5);

  private readonly targetRing = ringMesh(0.4, 0.5, AMBER, 0.85);

  private readonly timingRing = ringMesh(0.92, 1.0, RED, 0.8);

  private readonly timingInner = ringMesh(0.68, 0.73, RED, 0.3);

  private readonly braceRing = ringMesh(0.55, 0.64, TEAL, 0.75);

  private readonly pushWave = ringMesh(0.42, 0.52, AMBER, 0.75);

  private readonly flashRing = ringMesh(0.55, 0.65, 0xfff4e4, 0.8);

  private readonly alert: THREE.Sprite;

  private readonly passiveAlert: THREE.Sprite;

  private readonly playerShadow = discMesh(0.48, 0x000000, 0.28);

  private readonly aggressiveShadow = discMesh(0.52, 0x000000, 0.28);

  private readonly passiveShadow = discMesh(0.42, 0x000000, 0.28);

  private readonly filmerShadow = discMesh(0.44, 0x000000, 0.28);

  private readonly playerRingMaterial: THREE.MeshBasicMaterial;

  private readonly aggressiveRingMaterial: THREE.MeshBasicMaterial;

  private readonly passiveRingMaterial: THREE.MeshBasicMaterial;

  private readonly filmerRingMaterial: THREE.MeshBasicMaterial;

  private readonly targetRingMaterial: THREE.MeshBasicMaterial;

  private readonly timingRingMaterial: THREE.MeshBasicMaterial;

  private readonly timingInnerMaterial: THREE.MeshBasicMaterial;

  private readonly braceRingMaterial: THREE.MeshBasicMaterial;

  private readonly pushWaveMaterial: THREE.MeshBasicMaterial;

  private readonly flashRingMaterial: THREE.MeshBasicMaterial;

  private readonly aggressiveShadowMaterial: THREE.MeshBasicMaterial;

  private readonly passiveShadowMaterial: THREE.MeshBasicMaterial;

  private readonly filmerShadowMaterial: THREE.MeshBasicMaterial;

  private readonly filmerScreenMaterial: THREE.MeshBasicMaterial;

  private readonly filmerConeMaterial: THREE.MeshBasicMaterial;

  private readonly filmerPhone = new THREE.Group();

  private readonly filmerCone: THREE.Mesh<THREE.ShapeGeometry, THREE.MeshBasicMaterial>;

  private readonly filmerPrepLabel: THREE.Sprite;

  private readonly filmerRecLabel: THREE.Sprite;

  private readonly playerShadowMaterial: THREE.MeshBasicMaterial;

  private readonly fallAxis = new THREE.Vector3();

  private readonly fallQuaternion = new THREE.Quaternion();

  private readonly passengerFallDirs = new Map<number, FallDirection>();

  private readonly passengerFallBlends = new Map<number, number>();

  private playerFallDir: FallDirection | null = null;

  private playerFallBlend = 0;

  private lastAnimationTime = 0;

  private reducedMotion = false;

  private zoom = ARENA_ZOOM_MIN;

  private viewportWidth = 1;

  private viewportHeight = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.22;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.scene.fog = new THREE.Fog(0x0b1624, 22, 48);

    this.scene.add(new THREE.HemisphereLight(0xb9d0df, 0x3b2d20, 1.55));

    const sun = new THREE.DirectionalLight(0xffc98a, 3.1);
    sun.position.set(8, 14, 10);
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0x7799b3, 1.3);
    fill.position.set(-8, 7, -8);
    this.scene.add(fill);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(ARENA.radius, 72),
      new THREE.MeshStandardMaterial({
        color: FLOOR,
        roughness: 0.93,
        metalness: 0.02,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    this.scene.add(floor);

    const rim = new THREE.Mesh(
      new THREE.RingGeometry(ARENA.radius - 0.12, ARENA.radius + 0.08, 72),
      new THREE.MeshBasicMaterial({ color: FLOOR_EDGE, transparent: true, opacity: 0.95 }),
    );
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0.012;
    this.scene.add(rim);

    const warmRim = new THREE.Mesh(
      new THREE.RingGeometry(ARENA.radius - 0.38, ARENA.radius - 0.31, 72),
      new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.24 }),
    );
    warmRim.rotation.x = -Math.PI / 2;
    warmRim.position.y = 0.014;
    this.scene.add(warmRim);

    const center = ringMesh(0.72, 0.77, 0x69767b, 0.28);
    center.position.y = 0.016;
    this.scene.add(center);

    for (let index = 0; index < 4; index += 1) {
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(0.026, 0.012, ARENA.radius * 2 - 0.9),
        new THREE.MeshBasicMaterial({ color: 0x69767b, transparent: true, opacity: 0.16 }),
      );
      spoke.position.y = 0.015;
      spoke.rotation.y = (index * Math.PI) / 4;
      this.scene.add(spoke);
    }

    this.aggressiveRing.position.y = 0.02;
    this.passiveRing.position.y = 0.02;
    this.filmerRing.position.y = 0.02;
    this.scene.add(this.aggressiveRing);
    this.scene.add(this.passiveRing);
    this.scene.add(this.filmerRing);

    this.scene.add(this.playerShadow, this.aggressiveShadow, this.passiveShadow, this.filmerShadow);
    this.scene.add(this.player.group, this.aggressive.group, this.passive.group, this.filmer.group);

    this.playerRingMaterial = this.player.ring?.material as THREE.MeshBasicMaterial;
    this.playerRingMaterial.color.setHex(TEAL);
    this.playerRingMaterial.opacity = 0.8;

    this.aggressiveRingMaterial = this.aggressiveRing.material;
    this.passiveRingMaterial = this.passiveRing.material;
    this.filmerRingMaterial = this.filmerRing.material;

    this.targetRing.position.y = 0.026;
    this.targetRing.visible = false;
    this.scene.add(this.targetRing);
    this.targetRingMaterial = this.targetRing.material;

    this.timingRing.position.y = 0.03;
    this.timingRing.visible = false;
    this.scene.add(this.timingRing);
    this.timingRingMaterial = this.timingRing.material;

    this.timingInner.position.y = 0.031;
    this.timingInner.visible = false;
    this.scene.add(this.timingInner);
    this.timingInnerMaterial = this.timingInner.material;

    this.braceRing.position.y = 0.028;
    this.braceRing.visible = false;
    this.scene.add(this.braceRing);
    this.braceRingMaterial = this.braceRing.material;

    this.pushWave.position.y = 0.027;
    this.pushWave.visible = false;
    this.scene.add(this.pushWave);
    this.pushWaveMaterial = this.pushWave.material;

    this.flashRing.position.y = 0.032;
    this.flashRing.visible = false;
    this.scene.add(this.flashRing);
    this.flashRingMaterial = this.flashRing.material;

    const alertMaterial = new THREE.SpriteMaterial({
      map: alertTexture(),
      transparent: true,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
    });
    this.alert = new THREE.Sprite(alertMaterial);
    this.alert.scale.set(0.46, 0.46, 0.46);
    this.alert.position.set(0, 2.55, 0);
    this.alert.renderOrder = 30;
    this.aggressive.group.add(this.alert);

    this.passiveAlert = new THREE.Sprite(alertMaterial);
    this.passiveAlert.scale.set(0.4, 0.4, 0.4);
    this.passiveAlert.position.set(0, 2.4, 0);
    this.passiveAlert.renderOrder = 30;
    this.passiveAlert.visible = false;
    this.passive.group.add(this.passiveAlert);

    this.filmerScreenMaterial = new THREE.MeshBasicMaterial({
      color: AMBER,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const phoneBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.17, 0.3, 0.035),
      new THREE.MeshStandardMaterial({ color: 0x182027, roughness: 0.55, metalness: 0.05 }),
    );
    const phoneScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.2), this.filmerScreenMaterial);
    phoneScreen.position.z = -0.022;
    phoneScreen.rotation.y = Math.PI;
    this.filmerPhone.add(phoneBody, phoneScreen);
    this.filmerPhone.position.set(0.24, 1.29, -0.28);
    this.filmerPhone.rotation.x = -0.2;
    this.filmerPhone.visible = false;
    this.filmer.group.add(this.filmerPhone);

    this.filmerConeMaterial = new THREE.MeshBasicMaterial({
      color: AMBER,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const coneShape = new THREE.Shape();
    coneShape.moveTo(0, 0);
    coneShape.lineTo(-1.25, -2.35);
    coneShape.lineTo(1.25, -2.35);
    coneShape.closePath();
    this.filmerCone = new THREE.Mesh(new THREE.ShapeGeometry(coneShape), this.filmerConeMaterial);
    this.filmerCone.rotation.x = Math.PI / 2;
    this.filmerCone.position.y = 0.035;
    this.filmerCone.visible = false;
    this.filmer.group.add(this.filmerCone);

    this.filmerPrepLabel = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: labelTexture('SIAP', '#ffb347'),
        transparent: true,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
      }),
    );
    this.filmerPrepLabel.scale.set(0.9, 0.34, 1);
    this.filmerPrepLabel.position.set(0, 2.42, 0);
    this.filmerPrepLabel.renderOrder = 30;
    this.filmerPrepLabel.visible = false;
    this.filmer.group.add(this.filmerPrepLabel);

    this.filmerRecLabel = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: labelTexture('REC', '#ff5a4e'),
        transparent: true,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
      }),
    );
    this.filmerRecLabel.scale.set(0.78, 0.3, 1);
    this.filmerRecLabel.position.set(0, 2.42, 0);
    this.filmerRecLabel.renderOrder = 31;
    this.filmerRecLabel.visible = false;
    this.filmer.group.add(this.filmerRecLabel);

    this.aggressiveShadowMaterial = this.aggressiveShadow.material as THREE.MeshBasicMaterial;
    this.passiveShadowMaterial = this.passiveShadow.material as THREE.MeshBasicMaterial;
    this.filmerShadowMaterial = this.filmerShadow.material as THREE.MeshBasicMaterial;
    this.playerShadowMaterial = this.playerShadow.material as THREE.MeshBasicMaterial;

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 120);
    this.camera.position.copy(ARENA_TARGET).add(ARENA_OFFSET);
    this.camera.lookAt(ARENA_TARGET);

    this.resize(canvas.clientWidth || 390, canvas.clientHeight || 844);
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  setZoom(value: number): void {
    this.zoom = Math.min(ARENA_ZOOM_MAX, Math.max(ARENA_ZOOM_MIN, value));
    this.applyProjection();
  }

  resize(width: number, height: number): void {
    this.viewportWidth = Math.max(1, width);
    this.viewportHeight = Math.max(1, height);
    this.renderer.setSize(this.viewportWidth, this.viewportHeight, false);
    this.applyProjection();
  }

  private applyProjection(): void {
    const aspect = this.viewportWidth / this.viewportHeight;
    const viewHeight = VIEW_HEIGHT / this.zoom;
    const viewWidth = viewHeight * aspect;
    this.camera.left = -viewWidth / 2;
    this.camera.right = viewWidth / 2;
    this.camera.top = viewHeight / 2;
    this.camera.bottom = -viewHeight / 2;
    this.camera.updateProjectionMatrix();
  }

  update(state: ArenaState, now: number): void {
    const idle = this.reducedMotion ? 0 : Math.sin(now * 2.4) * 0.012;
    const animationDelta = Math.min(0.05, Math.max(0, now - this.lastAnimationTime));
    this.lastAnimationTime = now;
    const fallStep = this.reducedMotion ? 1 : animationDelta * 10;
    const p = state.player;

    const playerFallen = p.fallen > 0;
    const charge = p.pushHeld ? p.pushCharge : 0;
    this.playerFallBlend = easeToward(this.playerFallBlend, playerFallen ? 1 : 0, fallStep);
    if (playerFallen && !this.playerFallDir) {
      this.playerFallDir = fallDirection(p.vx, p.vz, p.facing);
    }
    const playerY = 0.02 + idle + this.playerFallBlend * 0.08 - charge * 0.015;
    this.positionPerson(this.player, p.x, p.z, playerY, p.facing);
    this.playerRingMaterial.opacity = playerFallen ? 0.35 : 0.8;

    const playerFallDir = this.playerFallDir;
    if (this.playerFallBlend > 0.001 && playerFallDir) {
      this.player.body.position.set(0, 0, 0);
      this.applyFallenPose(this.player, playerFallDir, p.facing, FALL_ANGLE * this.playerFallBlend);
    } else {
      if (!playerFallen) this.playerFallDir = null;
      const lean = (p.stagger > 0 ? 0.16 : 0) +
        (p.pushFlash > 0 ? (state.lastPushHard ? -0.32 : -0.24) : 0) +
        (state.brace.held ? -0.08 : 0.03) +
        charge * 0.26;
      const wobble = this.reducedMotion
        ? 0
        : Math.sin(now * 5.5) * (p.stagger > 0 ? 0.018 : 0.004) + (p.pushFlash > 0 ? 0.08 : 0);
      this.player.body.rotation.set(lean, 0, wobble);
      this.player.body.position.set(0, 0, charge * 0.07);
    }

    const aggressive = this.passenger(state, 'aggressive');
    if (aggressive) {
      const windupLean = aggressive.windup > 0 ? 0.22 : aggressive.stagger > 0 ? -0.16 : 0;
      this.positionPerson(
        this.aggressive,
        aggressive.x,
        aggressive.z,
        0.02 + (this.reducedMotion ? 0 : Math.sin(now * 1.9 + 1) * 0.01),
        aggressive.facing,
      );
      const aggressiveFallen = this.updatePassengerFall(this.aggressive, aggressive, fallStep);
      if (!aggressiveFallen) {
        this.aggressive.body.rotation.set(windupLean, 0, aggressive.hitFlash > 0 ? 0.12 : 0);
      }
      this.alert.visible = true;
      const alertScale = aggressive.windup > 0 ? 0.56 : 0.44;
      this.alert.scale.setScalar(alertScale);
      this.alert.position.y = 2.55 + (this.reducedMotion ? 0 : Math.sin(now * 4) * 0.04);
      this.aggressiveRing.position.set(aggressive.x, 0.02, aggressive.z);
      this.aggressiveShadow.position.set(aggressive.x, 0.006, aggressive.z);
      this.aggressiveShadowMaterial.opacity = aggressive.fallen > 0 ? 0.4 : aggressive.stagger > 0 ? 0.35 : 0.28;
    }

    const passive = this.passenger(state, 'passive');
    if (passive) {
      this.positionPerson(
        this.passive,
        passive.x,
        passive.z,
        0.02 + (this.reducedMotion ? 0 : Math.sin(now * 2.1 + 2) * 0.009),
        passive.facing,
      );
      const passiveFallen = this.updatePassengerFall(this.passive, passive, fallStep);
      if (!passiveFallen) {
        this.passive.body.rotation.set(
          passive.stagger > 0 ? -0.12 : 0.02,
          0,
          passive.hitFlash > 0 ? -0.1 : 0,
        );
      }
      this.passiveRingMaterial.color.setHex(passive.revenge ? ORANGE : BLUE);
      this.passiveAlert.visible = passive.revenge;
      this.passiveAlert.position.y = 2.4 + (this.reducedMotion ? 0 : Math.sin(now * 6) * 0.04);
      this.passiveRing.position.set(passive.x, 0.02, passive.z);
      this.passiveShadow.position.set(passive.x, 0.006, passive.z);
      this.passiveShadowMaterial.opacity = passive.fallen > 0 ? 0.4 : passive.stagger > 0 ? 0.35 : 0.28;
    }

    const filmer = this.passenger(state, 'filmer');
    if (filmer) {
      const recording = state.filmerMode === 'recording' || state.gameOver === 'viral';
      const active = recording || state.filmerMode === 'preparing';
      this.positionPerson(
        this.filmer,
        filmer.x,
        filmer.z,
        0.02 + (this.reducedMotion ? 0 : Math.sin(now * 2.3 + 3) * 0.01),
        filmer.facing,
      );
      this.filmer.body.rotation.x = 0.02;
      this.filmer.body.rotation.z = 0;
      this.filmerPhone.visible = active;
      this.filmerPhone.position.y = 1.29 + (this.reducedMotion ? 0 : Math.sin(now * 3.2) * 0.008);
      this.filmerCone.visible = active;
      this.filmerScreenMaterial.color.setHex(recording ? RED : AMBER);
      this.filmerScreenMaterial.opacity = recording && !this.reducedMotion
        ? 0.65 + Math.abs(Math.sin(now * 6)) * 0.35
        : 0.95;
      this.filmerConeMaterial.color.setHex(recording ? RED : AMBER);
      this.filmerConeMaterial.opacity = recording ? 0.17 : 0.09;
      this.filmerRingMaterial.color.setHex(recording ? RED : state.filmerMode === 'preparing' ? AMBER : BLUE);
      this.filmerRingMaterial.opacity = active ? 0.62 : 0.34;
      this.filmerRing.position.set(filmer.x, 0.02, filmer.z);
      this.filmerShadow.position.set(filmer.x, 0.006, filmer.z);
      this.filmerShadowMaterial.opacity = 0.28;
      this.filmerPrepLabel.visible = state.filmerMode === 'preparing';
      this.filmerRecLabel.visible = recording;
      const recPulse = this.reducedMotion ? 1 : 1 + Math.sin(now * 8) * 0.05;
      this.filmerRecLabel.scale.set(0.78 * recPulse, 0.3 * recPulse, 1);
      this.filmerRecLabel.position.y = 2.42 + (this.reducedMotion ? 0 : Math.sin(now * 5) * 0.03);
    }

    this.playerShadow.position.set(p.x, 0.006, p.z);
    this.playerShadowMaterial.opacity = p.stagger > 0 ? 0.38 : 0.28;

    const target = state.pushTargetId
      ? state.passengers.find((q) => q.id === state.pushTargetId)
      : null;
    this.targetRing.visible = target !== null;
    if (target) {
      this.targetRing.position.set(target.x, 0.026, target.z);
      const pulse = this.reducedMotion ? 1 : 1 + Math.sin(now * 7) * 0.06;
      this.targetRing.scale.setScalar(pulse);
    }

    if (state.incoming) {
      const progress = incomingProgress(state);
      const inWindow = state.time >= state.incoming.windowStart;
      const scale = 1.55 - progress * 0.85;
      this.timingRing.visible = true;
      this.timingRing.position.set(p.x, 0.03, p.z);
      this.timingRing.scale.setScalar(scale);
      this.timingRingMaterial.color.setHex(inWindow ? TEAL : state.incoming.kind === 'revenge' ? ORANGE : RED);
      this.timingRingMaterial.opacity = 0.55 + progress * 0.35;
      this.timingInner.visible = true;
      this.timingInner.position.set(p.x, 0.031, p.z);
      this.timingInner.scale.setScalar(scale - 0.16);
      this.timingInnerMaterial.color.setHex(inWindow ? TEAL : state.incoming.kind === 'revenge' ? ORANGE : RED);
      this.timingInnerMaterial.opacity = 0.24 + progress * 0.22;
    } else {
      this.timingRing.visible = false;
      this.timingInner.visible = false;
    }

    this.braceRing.visible = state.brace.held;
    if (state.brace.held) {
      this.braceRing.position.set(p.x, 0.028, p.z);
      const pulse = this.reducedMotion ? 1 : 1 + Math.sin(now * 8) * 0.05;
      this.braceRing.scale.setScalar(pulse);
      this.braceRingMaterial.opacity = 0.55 + (state.incoming ? 0.25 : 0);
    }

    this.pushWave.visible = p.pushFlash > 0;
    if (p.pushFlash > 0) {
      this.pushWave.position.set(p.x, 0.027, p.z);
      const t = 1 - p.pushFlash / 0.2;
      this.pushWave.scale.setScalar(0.8 + t * 1.2);
      this.pushWaveMaterial.opacity = 0.7 * (1 - t);
    }

    this.flashRing.visible = p.braceFlash > 0 || p.hitFlash > 0;
    if (this.flashRing.visible) {
      this.flashRing.position.set(p.x, 0.032, p.z);
      const t = Math.max(p.braceFlash / 0.35, p.hitFlash / 0.3);
      this.flashRing.scale.setScalar(1 + (1 - t) * 1.5);
      this.flashRingMaterial.color.setHex(p.braceFlash > 0 ? TEAL : RED);
      this.flashRingMaterial.opacity = 0.65 * t;
    }

    this.applyCameraShake(state, now);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  captureFrame(): string {
    return this.renderer.domElement.toDataURL('image/jpeg', 0.72);
  }

  get drawCalls(): number {
    return this.renderer.info.render.calls;
  }

  private passenger(state: ArenaState, behavior: 'passive' | 'aggressive' | 'filmer'): ArenaPassenger | null {
    return state.passengers.find((q) => q.behavior === behavior) ?? null;
  }

  private updatePassengerFall(
    person: PersonView,
    passenger: ArenaPassenger,
    step: number,
  ): boolean {
    const fallen = passenger.fallen > 0;
    let blend = this.passengerFallBlends.get(passenger.id) ?? 0;
    blend = easeToward(blend, fallen ? 1 : 0, step);
    if (fallen && !this.passengerFallDirs.has(passenger.id)) {
      this.passengerFallDirs.set(
        passenger.id,
        fallDirection(passenger.vx, passenger.vz, passenger.facing),
      );
    }
    if (blend > 0.001) {
      this.passengerFallBlends.set(passenger.id, blend);
      const direction = this.passengerFallDirs.get(passenger.id);
      if (direction) {
        person.body.position.set(0, 0, 0);
        this.applyFallenPose(person, direction, passenger.facing, FALL_ANGLE * blend);
        return true;
      }
    }
    this.passengerFallBlends.delete(passenger.id);
    if (!fallen) this.passengerFallDirs.delete(passenger.id);
    person.body.position.set(0, 0, 0);
    return false;
  }

  private applyFallenPose(
    person: PersonView,
    direction: FallDirection,
    facing: number,
    angle: number,
  ): void {
    const cos = Math.cos(facing);
    const sin = Math.sin(facing);
    const localX = cos * direction.x - sin * direction.z;
    const localZ = sin * direction.x + cos * direction.z;
    this.fallAxis.set(localZ, 0, -localX).normalize();
    this.fallQuaternion.setFromAxisAngle(this.fallAxis, angle);
    person.body.quaternion.copy(this.fallQuaternion);
  }

  private positionPerson(
    person: PersonView,
    x: number,
    z: number,
    y: number,
    facing: number,
  ): void {
    person.group.position.set(x, y, z);
    person.group.rotation.y = facing;
  }

  private applyCameraShake(state: ArenaState, now: number): void {
    if (this.reducedMotion) {
      this.camera.position.copy(ARENA_TARGET).add(ARENA_OFFSET);
      this.camera.lookAt(ARENA_TARGET);
      return;
    }
    const passengerHit = state.passengers.reduce(
      (max, q) => Math.max(max, q.hitFlash / 0.4),
      0,
    );
    const hit = Math.max(
      state.player.hitFlash / 0.3,
      state.player.braceFlash / 0.35,
      (state.player.pushFlash / 0.2) * 0.5,
      passengerHit * 0.8,
    );
    const shake = hit * 0.035;
    const x = Math.sin(now * 80) * shake;
    const y = Math.cos(now * 73) * shake;
    this.camera.position.copy(ARENA_TARGET).add(ARENA_OFFSET);
    this.camera.position.x += x;
    this.camera.position.y += y;
    this.camera.lookAt(ARENA_TARGET);
  }
}
