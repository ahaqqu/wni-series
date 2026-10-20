import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export interface Transform {
  x?: number;
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
}

function paint(geometry: THREE.BufferGeometry, color: string): THREE.BufferGeometry {
  const part = geometry.toNonIndexed();
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
  return part;
}

export class ColoredBucket {
  private readonly parts: THREE.BufferGeometry[] = [];

  add(geometry: THREE.BufferGeometry, color: string, place: Transform = {}): void {
    const part = paint(geometry, color);
    if (place.rx) part.rotateX(place.rx);
    if (place.ry) part.rotateY(place.ry);
    if (place.rz) part.rotateZ(place.rz);
    part.translate(place.x ?? 0, place.y ?? 0, place.z ?? 0);
    this.parts.push(part);
  }

  box(
    width: number,
    height: number,
    depth: number,
    color: string,
    place: Transform = {},
  ): void {
    this.add(new THREE.BoxGeometry(width, height, depth), color, place);
  }

  cylinder(
    radiusTop: number,
    radiusBottom: number,
    height: number,
    segments: number,
    color: string,
    place: Transform = {},
  ): void {
    this.add(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
      color,
      place,
    );
  }

  build(material: THREE.Material): THREE.Mesh {
    if (this.parts.length === 0) throw new Error('Cannot build an empty geometry bucket');
    const merged = mergeGeometries(this.parts, false);
    this.parts.forEach((part) => part.dispose());
    this.parts.length = 0;
    if (!merged) throw new Error('Could not merge geometry bucket');
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    return mesh;
  }
}

export function solidMaterial(
  options: THREE.MeshStandardMaterialParameters = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
    metalness: 0.03,
    flatShading: true,
    ...options,
  });
}

export function glowMaterial(
  options: THREE.MeshBasicMaterialParameters = {},
): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    vertexColors: true,
    toneMapped: false,
    ...options,
  });
}
