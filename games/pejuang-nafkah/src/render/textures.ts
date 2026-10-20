import * as THREE from 'three';

export interface BoardLine {
  text: string;
  size: number;
  weight?: number;
  color?: string;
  mono?: boolean;
}

export interface BoardStyle {
  width?: number;
  height?: number;
  background?: string;
  border?: string;
  accent?: string;
  label?: string;
  align?: 'left' | 'center';
  padding?: number;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  lines: BoardLine[],
  style: BoardStyle,
): void {
  const padding = style.padding ?? 26;
  const align = style.align ?? 'left';
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = style.background ?? '#0b1624';
  roundRect(ctx, 2, 2, width - 4, height - 4, 18);
  ctx.fill();

  if (style.border) {
    ctx.strokeStyle = style.border;
    ctx.lineWidth = 3;
    roundRect(ctx, 5, 5, width - 10, height - 10, 15);
    ctx.stroke();
  }

  ctx.fillStyle = style.accent ?? '#ffb347';
  ctx.fillRect(0, 0, 12, height);

  let y = padding + 6;
  if (style.label) {
    ctx.fillStyle = style.accent ?? '#ffb347';
    ctx.font = '700 15px ui-monospace, "DM Mono", monospace';
    ctx.textAlign = align === 'center' ? 'center' : 'left';
    ctx.fillText(
      style.label.toUpperCase(),
      align === 'center' ? width / 2 : padding,
      y + 2,
    );
    y += 23;
  }

  for (const line of lines) {
    const weight = line.weight ?? 700;
    const family = line.mono
      ? 'ui-monospace, "DM Mono", monospace'
      : '"Inter", "Segoe UI", system-ui, sans-serif';
    ctx.font = `${weight} ${line.size}px ${family}`;
    ctx.fillStyle = line.color ?? '#f4ebdd';
    ctx.textAlign = align === 'center' ? 'center' : 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(line.text, align === 'center' ? width / 2 : padding, y);
    y += line.size * 1.12;
  }
}

function canvasTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

export function makeTextTexture(
  lines: BoardLine[],
  options: BoardStyle = {},
): THREE.CanvasTexture {
  const width = options.width ?? 512;
  const height = options.height ?? 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is unavailable');
  drawBoard(ctx, width, height, lines, options);
  return canvasTexture(canvas);
}

export function makeSignMesh(
  lines: BoardLine[],
  widthMeters: number,
  heightMeters: number,
  options: BoardStyle = {},
): THREE.Mesh {
  const texture = makeTextTexture(lines, options);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.FrontSide,
    toneMapped: false,
    depthWrite: false,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(widthMeters, heightMeters), material);
}

export function makeIconTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is unavailable');

  ctx.clearRect(0, 0, 128, 128);
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  ctx.fillStyle = 'rgba(11, 22, 36, 0.84)';
  ctx.strokeStyle = 'rgba(244, 235, 221, 0.72)';
  ctx.lineWidth = 4;
  roundRect(ctx, 20, 20, 88, 88, 26);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f4ebdd';
  ctx.beginPath();
  ctx.moveTo(64, 86);
  ctx.bezierCurveTo(42, 69, 38, 56, 46, 46);
  ctx.bezierCurveTo(53, 38, 63, 42, 64, 49);
  ctx.bezierCurveTo(65, 42, 75, 38, 82, 46);
  ctx.bezierCurveTo(90, 56, 86, 69, 64, 86);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
  return canvasTexture(canvas);
}

export function makeFloorLabelTexture(letter: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is unavailable');
  ctx.clearRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(128, 128, 84, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.beginPath();
  ctx.arc(128, 128, 80, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 112px ui-monospace, "DM Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, 128, 136);
  return canvasTexture(canvas);
}

export class DynamicBoard {
  readonly mesh: THREE.Mesh;

  private readonly canvas: HTMLCanvasElement;

  private readonly ctx: CanvasRenderingContext2D;

  private readonly texture: THREE.CanvasTexture;

  private readonly width: number;

  private readonly height: number;

  private lastKey = '';

  constructor(widthMeters: number, heightMeters: number, options: BoardStyle = {}) {
    this.width = options.width ?? 512;
    this.height = options.height ?? 256;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is unavailable');
    this.ctx = ctx;
    this.texture = canvasTexture(this.canvas);
    const material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      toneMapped: false,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(widthMeters, heightMeters), material);
    this.set([], options);
  }

  set(lines: BoardLine[], options: BoardStyle = {}): void {
    const key = JSON.stringify({ lines, options });
    if (key === this.lastKey) return;
    this.lastKey = key;
    drawBoard(this.ctx, this.width, this.height, lines, options);
    this.texture.needsUpdate = true;
  }
}
