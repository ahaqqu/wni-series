/**
 * Real KRL Commuter Line (KAI Commuter) station data for the playable routes.
 * Coordinates are schematic map-space (x = west→east, y = south→north) so the
 * live map reads like the official corridor while staying readable in-game.
 *
 * Free trial — Rangkasbitung Line (Green) Bintaro corridor:
 *   Jurangmangu → Pondok Ranji → Kebayoran → Tanah Abang
 *
 * Full map — continues toward SCBD via Tanah Abang corridor (walk/transit
 * flavour) then Bogor Line (Red) core through Manggarai → Sudirman → Dukuh Atas.
 */

export type LineId = 'green' | 'red';

export interface KrlStation {
  id: string;
  name: string;
  line: LineId;
  /** map-space 0..1 along corridor (0 = origin, 1 = destination) */
  t: number;
  /** schematic map coordinates for the HUD minimap */
  mapX: number;
  mapY: number;
  /** dwell / transfer flavour */
  note?: string;
}

export const LINE_META: Record<LineId, { label: string; color: string }> = {
  green: { label: 'Rangkasbitung Line', color: '#1ec8a5' },
  red: { label: 'Bogor Line', color: '#e63946' },
};

/** Bintaro free-trial corridor (real Rangkasbitung Line stations). */
export const TRIAL_ROUTE: KrlStation[] = [
  { id: 'jng', name: 'Jurangmangu', line: 'green', t: 0, mapX: 0.08, mapY: 0.72, note: 'Bintaro · start' },
  { id: 'pdr', name: 'Pondok Ranji', line: 'green', t: 0.33, mapX: 0.28, mapY: 0.62 },
  { id: 'kby', name: 'Kebayoran', line: 'green', t: 0.66, mapX: 0.52, mapY: 0.48 },
  { id: 'tab', name: 'Tanah Abang', line: 'green', t: 1, mapX: 0.78, mapY: 0.36, note: 'Transfer' },
];

/**
 * Full commute to SCBD — real station names, order follows the actual
 * Rangkasbitung (Bintaro) → Tanah Abang → Bogor Line core (Manggarai–Sudirman–Dukuh Atas)
 * morning flow that Pejuang Nafkah ride.
 */
export const FULL_ROUTE: KrlStation[] = [
  { id: 'jng', name: 'Jurangmangu', line: 'green', t: 0, mapX: 0.06, mapY: 0.78, note: 'Bintaro · start' },
  { id: 'pdr', name: 'Pondok Ranji', line: 'green', t: 0.07, mapX: 0.12, mapY: 0.74 },
  { id: 'kby', name: 'Kebayoran', line: 'green', t: 0.14, mapX: 0.18, mapY: 0.68 },
  { id: 'tab', name: 'Tanah Abang', line: 'green', t: 0.22, mapX: 0.26, mapY: 0.60, note: 'Transit' },
  { id: 'mng', name: 'Manggarai', line: 'red', t: 0.45, mapX: 0.42, mapY: 0.48, note: 'Hub sibuk' },
  { id: 'sda', name: 'Sudirman', line: 'red', t: 0.72, mapX: 0.62, mapY: 0.32 },
  { id: 'dka', name: 'Dukuh Atas', line: 'red', t: 1, mapX: 0.82, mapY: 0.18, note: 'SCBD · finish' },
];

/** Extra Bogor Line stations shown on the full map as context (not all playable stops). */
export const MAP_CONTEXT_STOPS: KrlStation[] = [
  { id: 'dep', name: 'Depok', line: 'red', t: -1, mapX: 0.04, mapY: 0.95 },
  { id: 'pdc', name: 'Pondok Cina', line: 'red', t: -1, mapX: 0.14, mapY: 0.88 },
  { id: 'uic', name: 'UI', line: 'red', t: -1, mapX: 0.2, mapY: 0.82 },
  { id: 'psm', name: 'Pasar Minggu', line: 'red', t: -1, mapX: 0.36, mapY: 0.58 },
  { id: 'teb', name: 'Tebet', line: 'red', t: -1, mapX: 0.48, mapY: 0.42 },
  { id: 'bni', name: 'BNI City', line: 'red', t: -1, mapX: 0.9, mapY: 0.12 },
];

export function getRoute(isFull: boolean): KrlStation[] {
  return isFull ? FULL_ROUTE : TRIAL_ROUTE;
}

export function nextStationName(route: KrlStation[], progress: number): string {
  for (const s of route) {
    if (s.t > progress + 0.01) return s.name;
  }
  return route[route.length - 1]?.name ?? '—';
}

export function currentStationName(route: KrlStation[], progress: number): string {
  let name = route[0]?.name ?? '—';
  for (const s of route) {
    if (progress >= s.t - 0.02) name = s.name;
  }
  return name;
}

export function stationsRemaining(route: KrlStation[], progress: number): number {
  return route.filter((s) => s.t > progress + 0.01).length;
}
