import * as THREE from 'three';

/** Gradient sky dome + sun disc + soft cloud billboards. */
export class SkySystem {
  readonly root = new THREE.Group();
  private readonly skyMesh: THREE.Mesh;
  private readonly sunSprite: THREE.Sprite;
  private readonly clouds: THREE.Group;
  private readonly uniforms: {
    top: { value: THREE.Color };
    horizon: { value: THREE.Color };
    bottom: { value: THREE.Color };
    sunDir: { value: THREE.Vector3 };
    sunColor: { value: THREE.Color };
  };

  constructor() {
    this.uniforms = {
      top: { value: new THREE.Color(0x1a3a6b) },
      horizon: { value: new THREE.Color(0xf0a070) },
      bottom: { value: new THREE.Color(0xc4d4e8) },
      sunDir: { value: new THREE.Vector3(-0.35, 0.42, -0.84).normalize() },
      sunColor: { value: new THREE.Color(0xffe0b0) },
    };

    const skyGeo = new THREE.SphereGeometry(280, 32, 18);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: this.uniforms,
      vertexShader: /* glsl */ `
        varying vec3 vWorldDir;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldDir = normalize(wp.xyz - cameraPosition);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 top;
        uniform vec3 horizon;
        uniform vec3 bottom;
        uniform vec3 sunDir;
        uniform vec3 sunColor;
        varying vec3 vWorldDir;
        void main() {
          vec3 d = normalize(vWorldDir);
          float h = d.y * 0.5 + 0.5;
          vec3 col = mix(bottom, horizon, smoothstep(0.35, 0.52, h));
          col = mix(col, top, smoothstep(0.52, 0.88, h));
          float sun = pow(max(dot(d, normalize(sunDir)), 0.0), 18.0);
          float halo = pow(max(dot(d, normalize(sunDir)), 0.0), 4.0);
          col += sunColor * sun * 1.4 + sunColor * halo * 0.22;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.skyMesh.frustumCulled = false;
    this.root.add(this.skyMesh);

    // sun disc
    const sunTex = this.makeRadialTexture();
    const sunMat = new THREE.SpriteMaterial({
      map: sunTex,
      color: 0xffe8c4,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.sunSprite = new THREE.Sprite(sunMat);
    this.sunSprite.scale.setScalar(42);
    this.sunSprite.position.copy(this.uniforms.sunDir.value).multiplyScalar(220);
    this.root.add(this.sunSprite);

    // clouds
    this.clouds = new THREE.Group();
    const cloudTex = this.makeCloudTexture();
    for (let i = 0; i < 18; i += 1) {
      const mat = new THREE.SpriteMaterial({
        map: cloudTex,
        color: 0xffffff,
        transparent: true,
        opacity: 0.22 + Math.random() * 0.2,
        depthWrite: false,
      });
      const s = new THREE.Sprite(mat);
      const angle = (i / 18) * Math.PI * 2;
      const r = 120 + Math.random() * 80;
      s.position.set(Math.cos(angle) * r, 55 + Math.random() * 45, Math.sin(angle) * r - 40);
      s.scale.set(40 + Math.random() * 50, 16 + Math.random() * 14, 1);
      this.clouds.add(s);
    }
    this.root.add(this.clouds);
  }

  private makeRadialTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,240,200,1)');
    g.addColorStop(0.25, 'rgba(255,200,140,0.55)');
    g.addColorStop(1, 'rgba(255,180,100,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  private makeCloudTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 256, 128);
    for (let i = 0; i < 12; i += 1) {
      const x = 40 + Math.random() * 176;
      const y = 40 + Math.random() * 48;
      const r = 18 + Math.random() * 36;
      const g = ctx.createRadialGradient(x, y, 2, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.7)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    return new THREE.CanvasTexture(c);
  }

  followPlayer(x: number, z: number): void {
    this.root.position.set(x, 0, z);
  }

  update(elapsed: number): void {
    this.clouds.rotation.y = elapsed * 0.008;
    this.clouds.position.x = Math.sin(elapsed * 0.03) * 8;
  }

  setWeather(intensity: number): void {
    const clearTop = new THREE.Color(0x2a5aaa);
    const stormTop = new THREE.Color(0x3a4558);
    const clearHorizon = new THREE.Color(0xffb088);
    const stormHorizon = new THREE.Color(0x7a8898);
    this.uniforms.top.value.copy(clearTop).lerp(stormTop, intensity);
    this.uniforms.horizon.value.copy(clearHorizon).lerp(stormHorizon, intensity);
    (this.sunSprite.material as THREE.SpriteMaterial).opacity = 0.85 * (1 - intensity * 0.8);
  }

  dispose(): void {
    this.skyMesh.geometry.dispose();
    (this.skyMesh.material as THREE.Material).dispose();
  }
}
