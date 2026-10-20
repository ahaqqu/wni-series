import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeIconTexture } from './textures';
import type { Build, Role } from '../sim/types';

export interface PersonLook {
  role: Role;
  build: Build;
  colorIndex: number;
  aggression: number;
  vulnerable: boolean;
  player?: boolean;
  sitting?: boolean;
}

export interface PersonView {
  group: THREE.Group;
  body: THREE.Mesh;
  icon: THREE.Sprite | null;
  ring: THREE.Mesh | null;
}

const SKIN = ['#f0c6a2', '#dca97f', '#bd8259', '#9a6545', '#754a33', '#5a3827'];
const HAIR = ['#1b1a1a', '#2e211c', '#493025', '#242b34', '#5b4130', '#15191f'];
const TOPS = [
  '#d8c8ac',
  '#c95a4d',
  '#6e8fa7',
  '#477e70',
  '#b39b52',
  '#806d9c',
  '#d8d6cf',
  '#c87942',
  '#42566b',
];
const BOTTOMS = ['#28323c', '#39434d', '#4a4136', '#2d3a43', '#555a5e', '#202a33'];
const BAGS = ['#25313c', '#714638', '#b28b36', '#3c665b', '#7a3c45'];

const PERSON_MATERIAL = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.86,
  metalness: 0.02,
  flatShading: true,
});

const MARKER_MATERIAL = new THREE.SpriteMaterial({
  map: makeIconTexture(),
  transparent: true,
  depthWrite: false,
  depthTest: false,
  toneMapped: false,
});

type PartList = THREE.BufferGeometry[];

interface Place {
  x?: number;
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
}

function addPart(
  parts: PartList,
  geometry: THREE.BufferGeometry,
  color: string,
  place: Place = {},
): void {
  const part = geometry.toNonIndexed();
  if (place.rx) part.rotateX(place.rx);
  if (place.ry) part.rotateY(place.ry);
  if (place.rz) part.rotateZ(place.rz);
  part.translate(place.x ?? 0, place.y ?? 0, place.z ?? 0);
  const position = part.getAttribute('position');
  const count = position.count;
  const rgb = new THREE.Color(color);
  const colors = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    colors[index * 3] = rgb.r;
    colors[index * 3 + 1] = rgb.g;
    colors[index * 3 + 2] = rgb.b;
  }
  part.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  parts.push(part);
}

function widthFor(build: Build): number {
  if (build === 'slim') return 0.86;
  if (build === 'broad') return 1.18;
  return 1;
}

function lookColors(look: PersonLook): {
  skin: string;
  hair: string;
  top: string;
  bottom: string;
  bag: string;
  shoes: string;
} {
  const skin = SKIN[look.colorIndex % SKIN.length] ?? SKIN[0] ?? '#d9a477';
  const hair = HAIR[(look.colorIndex + 2) % HAIR.length] ?? HAIR[0] ?? '#1b1a1a';
  const bag = BAGS[look.colorIndex % BAGS.length] ?? BAGS[0] ?? '#25313c';
  if (look.player) {
    return {
      skin,
      hair,
      top: '#2ec4b6',
      bottom: '#24323c',
      bag: '#ffb347',
      shoes: '#182027',
    };
  }
  if (look.vulnerable) {
    return {
      skin,
      hair,
      top: look.role === 'pregnant' ? '#c97b84' : '#e6b54b',
      bottom: look.role === 'pregnant' ? '#3c4552' : '#344b5d',
      bag: '#c9a68a',
      shoes: '#252b31',
    };
  }
  if (look.role === 'elderly') {
    return {
      skin,
      hair: '#b8b3a9',
      top: TOPS[(look.colorIndex + 4) % TOPS.length] ?? '#d8c8ac',
      bottom: '#3b4249',
      bag: '#5e4b3c',
      shoes: '#24282d',
    };
  }
  return {
    skin,
    hair,
    top: TOPS[look.colorIndex % TOPS.length] ?? TOPS[0] ?? '#d8c8ac',
    bottom: BOTTOMS[look.colorIndex % BOTTOMS.length] ?? BOTTOMS[0] ?? '#28323c',
    bag,
    shoes: '#1d2329',
  };
}

function buildBody(look: PersonLook): THREE.BufferGeometry {
  const parts: PartList = [];
  const colors = lookColors(look);
  const width = widthFor(look.build) * (look.role === 'child' ? 0.82 : 1);
  const headScale = look.role === 'child' ? 0.88 : 1;
  const isElderly = look.role === 'elderly';
  const isPregnant = look.role === 'pregnant';
  const isWorker = look.role === 'worker';
  const isStudent = look.role === 'student';
  const isOffice = look.role === 'office';
  const isParent = look.role === 'parent';

  addPart(parts, new THREE.BoxGeometry(0.19, 0.09, 0.33), colors.shoes, {
    x: -0.15,
    y: 0.045,
    z: -0.04,
  });
  addPart(parts, new THREE.BoxGeometry(0.19, 0.09, 0.33), colors.shoes, {
    x: 0.15,
    y: 0.045,
    z: -0.04,
  });
  addPart(parts, new THREE.BoxGeometry(0.19, 0.7, 0.2), colors.bottom, {
    x: -0.145,
    y: 0.44,
    z: 0,
  });
  addPart(parts, new THREE.BoxGeometry(0.19, 0.7, 0.2), colors.bottom, {
    x: 0.145,
    y: 0.44,
    z: 0,
  });

  addPart(parts, new THREE.BoxGeometry(0.48 * width, 0.64, 0.3), colors.top, {
    y: isElderly ? 1.02 : 1.06,
    z: isElderly ? -0.04 : 0,
  });
  addPart(parts, new THREE.BoxGeometry(0.12, 0.4, 0.02), colors.bag, {
    y: 1.08,
    z: -0.16,
    x: 0.08,
    rz: 0.05,
  });

  addPart(parts, new THREE.BoxGeometry(0.14, 0.6, 0.16), colors.top, {
    x: -0.31 * width,
    y: 1.03,
    z: 0.01,
    rz: -0.09,
  });
  addPart(parts, new THREE.BoxGeometry(0.14, 0.6, 0.16), colors.top, {
    x: 0.31 * width,
    y: 1.03,
    z: 0.01,
    rz: 0.09,
  });
  addPart(parts, new THREE.BoxGeometry(0.13, 0.12, 0.15), colors.skin, {
    x: -0.31 * width,
    y: 0.75,
    z: 0.01,
  });
  addPart(parts, new THREE.BoxGeometry(0.13, 0.12, 0.15), colors.skin, {
    x: 0.31 * width,
    y: 0.75,
    z: 0.01,
  });

  addPart(parts, new THREE.CylinderGeometry(0.07, 0.08, 0.1, 6), colors.skin, {
    y: 1.43,
    z: isElderly ? -0.02 : 0,
  });
  addPart(parts, new THREE.SphereGeometry(0.17 * headScale, 7, 6), colors.skin, {
    y: 1.57,
    z: isElderly ? -0.03 : 0,
  });
  addPart(parts, new THREE.SphereGeometry(0.175 * headScale, 7, 4, 0, Math.PI * 2, 0, Math.PI * 0.62), colors.hair, {
    y: 1.6,
    z: isElderly ? -0.02 : 0,
  });

  if (look.player) {
    addPart(parts, new THREE.BoxGeometry(0.34, 0.1, 0.36), '#f4ebdd', {
      y: 1.37,
      z: 0,
      rx: 0.1,
    });
    addPart(parts, new THREE.BoxGeometry(0.36, 0.33, 0.17), colors.bag, {
      y: 1.02,
      z: 0.24,
    });
    addPart(parts, new THREE.BoxGeometry(0.3, 0.04, 0.18), '#ffcf70', {
      y: 1.19,
      z: 0.245,
    });
    addPart(parts, new THREE.BoxGeometry(0.04, 0.28, 0.02), '#f4ebdd', {
      x: 0.12,
      y: 1.26,
      z: -0.17,
      rz: 0.25,
    });
  } else if (isStudent) {
    addPart(parts, new THREE.BoxGeometry(0.32, 0.37, 0.18), colors.bag, {
      y: 1.04,
      z: 0.23,
    });
    addPart(parts, new THREE.BoxGeometry(0.26, 0.05, 0.19), '#d9d5c8', {
      y: 1.16,
      z: 0.235,
    });
  } else if (isOffice) {
    addPart(parts, new THREE.BoxGeometry(0.36, 0.31, 0.15), colors.bag, {
      x: 0.2,
      y: 0.98,
      z: 0.17,
      rz: -0.15,
    });
    addPart(parts, new THREE.BoxGeometry(0.03, 0.52, 0.02), '#b99b62', {
      x: 0.2,
      y: 1.24,
      z: 0.14,
      rz: -0.45,
    });
  } else if (isParent) {
    addPart(parts, new THREE.BoxGeometry(0.28, 0.34, 0.14), colors.bag, {
      x: -0.32,
      y: 0.85,
      z: 0.06,
    });
    addPart(parts, new THREE.BoxGeometry(0.03, 0.4, 0.03), '#9b7a55', {
      x: -0.3,
      y: 1.15,
      z: 0.05,
      rz: 0.35,
    });
  } else if (isWorker) {
    addPart(parts, new THREE.BoxGeometry(0.44, 0.07, 0.34), '#d6a83b', {
      y: 1.72,
      z: 0.01,
    });
    addPart(parts, new THREE.BoxGeometry(0.46, 0.06, 0.31), '#2d353b', {
      y: 0.78,
      z: 0,
    });
  } else {
    addPart(parts, new THREE.BoxGeometry(0.28, 0.28, 0.14), colors.bag, {
      x: -0.28,
      y: 0.83,
      z: 0.12,
    });
  }

  if (isPregnant) {
    addPart(parts, new THREE.SphereGeometry(0.2, 7, 6), colors.top, {
      y: 0.96,
      z: -0.13,
      rx: 0.1,
    });
    addPart(parts, new THREE.BoxGeometry(0.08, 0.28, 0.04), colors.top, {
      x: 0.12,
      y: 0.94,
      z: -0.23,
      rz: -0.2,
    });
  }

  if (isElderly) {
    addPart(parts, new THREE.CylinderGeometry(0.025, 0.035, 0.88, 5), '#6f543c', {
      x: 0.34,
      y: 0.44,
      z: 0.05,
      rz: 0.08,
    });
    addPart(parts, new THREE.TorusGeometry(0.08, 0.025, 5, 8, Math.PI), '#6f543c', {
      x: 0.34,
      y: 0.88,
      z: 0.05,
      rx: Math.PI / 2,
    });
  }

  if (look.aggression > 0.62 && !look.vulnerable && !look.player) {
    addPart(parts, new THREE.BoxGeometry(0.15, 0.1, 0.17), '#c7443c', {
      x: 0.36,
      y: 1.02,
      z: 0.01,
    });
  }

  const merged = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  if (!merged) throw new Error('Could not merge person geometry');
  merged.computeBoundingSphere();
  return merged;
}

export function createPerson(look: PersonLook): PersonView {
  const group = new THREE.Group();
  group.name = `person-${look.role}`;
  const body = new THREE.Mesh(buildBody(look), PERSON_MATERIAL);
  body.castShadow = false;
  body.receiveShadow = false;
  group.add(body);

  let icon: THREE.Sprite | null = null;
  if (look.vulnerable) {
    icon = new THREE.Sprite(MARKER_MATERIAL);
    icon.scale.set(0.56, 0.56, 0.56);
    icon.position.set(0, look.role === 'child' ? 2.05 : 2.38, 0);
    icon.renderOrder = 30;
    group.add(icon);
  }

  if (look.role === 'child') {
    group.scale.setScalar(0.84);
  } else if (look.role === 'elderly') {
    group.scale.setScalar(0.96);
  }

  return { group, body, icon, ring: null };
}

export function createPlayerVisual(): PersonView {
  const person = createPerson({
    role: 'worker',
    build: 'medium',
    colorIndex: 1,
    aggression: 0,
    vulnerable: false,
    player: true,
  });
  person.group.name = 'player';

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffb347,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.38, 0.48, 32), ringMaterial);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.035;
  ring.renderOrder = 2;
  person.group.add(ring);
  person.ring = ring;
  return person;
}

export function setMarkerVisibility(person: PersonView, visible: boolean): void {
  if (person.icon) person.icon.visible = visible;
}
