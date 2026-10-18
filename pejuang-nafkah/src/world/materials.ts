import * as THREE from 'three';

export type MaterialRole =
  | 'asphalt'
  | 'concrete'
  | 'sidewalk'
  | 'buildingA'
  | 'buildingB'
  | 'glass'
  | 'metal'
  | 'accent'
  | 'danger'
  | 'teal'
  | 'paper'
  | 'foliage'
  | 'skin'
  | 'fabric'
  | 'vehiclePaint'
  | 'vehicleDark'
  | 'headlight'
  | 'taillight';

export interface MaterialKit {
  get(role: MaterialRole, color?: number): THREE.Material;
  dispose(): void;
}

function makeNoiseTexture(base: string, noise = 0.08, size = 128): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 255 * noise;
    img.data[i] = Math.max(0, Math.min(255, img.data[i] + n));
    img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n));
    img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createMaterialKit(): MaterialKit {
  const cache = new Map<string, THREE.Material>();
  const textures: THREE.Texture[] = [];

  const noise = (hex: string, amount: number) => {
    const t = makeNoiseTexture(hex, amount);
    textures.push(t);
    return t;
  };

  const get = (role: MaterialRole, color?: number): THREE.Material => {
    const key = `${role}:${color ?? 0}`;
    const hit = cache.get(key);
    if (hit) return hit;

    let mat: THREE.Material;
    switch (role) {
      case 'asphalt':
        mat = new THREE.MeshStandardMaterial({
          color: color ?? 0x6a7384,
          roughness: 0.82,
          metalness: 0.08,
          map: noise('#6a7384', 0.08),
        });
        break;
      case 'concrete':
        mat = new THREE.MeshStandardMaterial({ color: color ?? 0x6b7280, roughness: 0.88, metalness: 0.05 });
        break;
      case 'sidewalk':
        mat = new THREE.MeshStandardMaterial({ color: color ?? 0x9aa3ad, roughness: 0.9, metalness: 0.02 });
        break;
      case 'buildingA':
        mat = new THREE.MeshStandardMaterial({ color: color ?? 0x3d4a5c, roughness: 0.72, metalness: 0.12 });
        break;
      case 'buildingB':
        mat = new THREE.MeshStandardMaterial({ color: color ?? 0x5c4a3d, roughness: 0.78, metalness: 0.1 });
        break;
      case 'glass':
        mat = new THREE.MeshStandardMaterial({
          color: color ?? 0x7ec8e3,
          roughness: 0.18,
          metalness: 0.75,
          transparent: true,
          opacity: 0.55,
        });
        break;
      case 'metal':
        mat = new THREE.MeshStandardMaterial({ color: color ?? 0xb0b7c0, roughness: 0.38, metalness: 0.82 });
        break;
      case 'accent':
        mat = new THREE.MeshStandardMaterial({
          color: color ?? 0xff6b35,
          roughness: 0.45,
          metalness: 0.18,
          emissive: 0xff6b35,
          emissiveIntensity: 0.12,
        });
        break;
      case 'danger':
        mat = new THREE.MeshStandardMaterial({
          color: color ?? 0xe63946,
          roughness: 0.5,
          metalness: 0.1,
          emissive: 0xe63946,
          emissiveIntensity: 0.18,
        });
        break;
      case 'teal':
        mat = new THREE.MeshStandardMaterial({
          color: color ?? 0x1ec8a5,
          roughness: 0.45,
          metalness: 0.2,
          emissive: 0x1ec8a5,
          emissiveIntensity: 0.1,
        });
        break;
      case 'paper':
        mat = new THREE.MeshStandardMaterial({ color: color ?? 0xf5f0e6, roughness: 0.78, metalness: 0.02 });
        break;
      case 'foliage':
        mat = new THREE.MeshStandardMaterial({ color: color ?? 0x2f7d4a, roughness: 0.9, metalness: 0.02 });
        break;
      case 'skin':
        mat = new THREE.MeshStandardMaterial({ color: color ?? 0xc68642, roughness: 0.72, metalness: 0.02 });
        break;
      case 'fabric':
        mat = new THREE.MeshStandardMaterial({ color: color ?? 0x243b55, roughness: 0.88, metalness: 0.04 });
        break;
      case 'vehiclePaint':
        mat = new THREE.MeshStandardMaterial({
          color: color ?? 0xd9d9d9,
          roughness: 0.28,
          metalness: 0.62,
          envMapIntensity: 1.2,
        });
        break;
      case 'vehicleDark':
        mat = new THREE.MeshStandardMaterial({ color: color ?? 0x1b2028, roughness: 0.55, metalness: 0.45 });
        break;
      case 'headlight':
        mat = new THREE.MeshStandardMaterial({
          color: color ?? 0xfff2cc,
          emissive: color ?? 0xfff2cc,
          emissiveIntensity: 1.4,
          roughness: 0.25,
          metalness: 0.1,
        });
        break;
      case 'taillight':
        mat = new THREE.MeshStandardMaterial({
          color: color ?? 0xff3b30,
          emissive: color ?? 0xff3b30,
          emissiveIntensity: 1.1,
          roughness: 0.3,
          metalness: 0.1,
        });
        break;
      default:
        mat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    }

    cache.set(key, mat);
    return mat;
  };

  return {
    get,
    dispose() {
      for (const m of cache.values()) m.dispose();
      for (const t of textures) t.dispose();
      cache.clear();
      textures.length = 0;
    },
  };
}
