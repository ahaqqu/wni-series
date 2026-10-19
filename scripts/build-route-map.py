#!/usr/bin/env python3
"""Build the landing-page route map from raw OSM extracts.

Inputs (not committed by default):
  data/raw/osm/roads.json    Overpass ways: motorway|trunk|primary|secondary
  data/raw/osm/rail.json     Overpass ways: railway=rail
  data/raw/osm/rangkas.json  Overpass relation 2922215 (Rangkasbitung -> Tanah Abang)

Outputs:
  apps/platform/src/assets/route-map.svg
  apps/platform/src/data/route-map.json

Data: © OpenStreetMap contributors, ODbL. Retrieved 2026-10-18.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data/raw/osm"
OUT_SVG = ROOT / "apps/platform/public/images/route-map.svg"
OUT_JSON = ROOT / "apps/platform/src/data/route-map.json"

# Tight bbox around the free corridor. Equal-ish lon/lat span at Jakarta latitude.
LON_MIN, LON_MAX = 106.704, 106.846
LAT_MIN, LAT_MAX = -6.307, -6.164
PAD = 64
SIZE = 1000

STATIONS = [
    {
        "id": "jurangmangu",
        "name": "Jurangmangu",
        "code": "JMU",
        "lat": -6.2885820,
        "lon": 106.7291463,
        "kind": "krl",
        "line": "Rangkasbitung",
        "door": "Kanan",
        "km": 15.33,
        "note": "Stasiun side platform, dekat Bintaro Xchange.",
        "label": "right",
    },
    {
        "id": "pondok-ranji",
        "name": "Pondok Ranji",
        "code": "PDJ",
        "lat": -6.2766831,
        "lon": 106.7446926,
        "kind": "krl",
        "line": "Rangkasbitung",
        "door": "Kanan",
        "km": 13.15,
        "note": "Titik parkir motor dan ojek langganan.",
        "label": "right",
    },
    {
        "id": "kebayoran",
        "name": "Kebayoran",
        "code": "KBO",
        "lat": -6.2372300,
        "lon": 106.7825345,
        "kind": "krl",
        "line": "Rangkasbitung",
        "door": "Kanan",
        "km": 6.93,
        "note": "Mulai ramai. Siap-siap berdiri.",
        "label": "left",
    },
    {
        "id": "palmerah",
        "name": "Palmerah",
        "code": "PLM",
        "lat": -6.2079197,
        "lon": 106.7972321,
        "kind": "krl",
        "line": "Rangkasbitung",
        "door": "Kanan",
        "km": 3.19,
        "note": "Satu stasiun lagi menuju Tanah Abang.",
        "label": "left",
    },
    {
        "id": "tanah-abang",
        "name": "Tanah Abang",
        "code": "THB",
        "lat": -6.1857127,
        "lon": 106.8108938,
        "kind": "hub",
        "line": "Rangkasbitung / Cikarang",
        "door": "Kanan",
        "km": 0.0,
        "note": "Hub transfer. Bisa lanjut ke BNI City / Sudirman.",
        "label": "right",
    },
    {
        "id": "bni-city",
        "name": "BNI City",
        "code": "BNC",
        "lat": -6.2015938,
        "lon": 106.8197174,
        "kind": "krl",
        "line": "Cikarang",
        "door": "Kanan",
        "km": 0.0,
        "note": "Terhubung ke Dukuh Atas dan MRT.",
        "label": "right",
    },
    {
        "id": "sudirman",
        "name": "Sudirman",
        "code": "SUD",
        "lat": -6.2024081,
        "lon": 106.8234493,
        "kind": "krl",
        "line": "Cikarang",
        "door": "Kanan",
        "km": 0.0,
        "note": "Turun di sini untuk SCBD dan Sudirman.",
        "label": "right",
    },
    {
        "id": "scbd",
        "name": "SCBD",
        "code": "OFFICE",
        "lat": -6.2263,
        "lon": 106.8097,
        "kind": "office",
        "line": "Last mile",
        "door": "—",
        "km": 0.0,
        "note": "Kantor. Tujuan akhir. Akhirnya.",
        "label": "right",
    },
]

EXTRA_POINTS = [
    {"id": "home", "name": "Bintaro", "lat": -6.2700, "lon": 106.7200, "kind": "home", "label": "left"},
]


def project(lat: float, lon: float) -> tuple[float, float]:
    x = PAD + (lon - LON_MIN) / (LON_MAX - LON_MIN) * (SIZE - 2 * PAD)
    y = PAD + (LAT_MAX - lat) / (LAT_MAX - LAT_MIN) * (SIZE - 2 * PAD)
    return x, y


def rdp(points: list[tuple[float, float]], eps: float) -> list[tuple[float, float]]:
    if len(points) < 3:
        return points
    start, end = points[0], points[-1]
    dx, dy = end[0] - start[0], end[1] - start[1]
    norm = math.hypot(dx, dy) or 1.0
    idx, best = -1, eps
    for i in range(1, len(points) - 1):
        px, py = points[i]
        dist = abs(dy * (px - start[0]) - dx * (py - start[1])) / norm
        if dist > best:
            idx, best = i, dist
    if idx == -1:
        return [start, end]
    return rdp(points[: idx + 1], eps)[:-1] + rdp(points[idx:], eps)


def path_from(points: list[tuple[float, float]], close: bool = False) -> str:
    if not points:
        return ""
    cmds = [f"M{points[0][0]:.1f},{points[0][1]:.1f}"]
    cmds += [f"L{x:.1f},{y:.1f}" for x, y in points[1:]]
    if close:
        cmds.append("Z")
    return " ".join(cmds)


def load(name: str):
    with (RAW / name).open(encoding="utf-8") as fh:
        return json.load(fh)


def way_points(way: dict) -> list[tuple[float, float]]:
    return [project(g["lat"], g["lon"]) for g in way.get("geometry", [])]


def build_road_paths() -> dict[str, str]:
    roads = load("roads.json")
    groups: dict[str, list[str]] = {"motorway": [], "primary": [], "secondary": []}
    for way in roads.get("elements", []):
        tags = way.get("tags", {})
        highway = tags.get("highway")
        if highway not in {"motorway", "trunk", "primary", "secondary"}:
            continue
        pts = way_points(way)
        if len(pts) < 2:
            continue
        pts = rdp(pts, 1.4)
        if highway in {"motorway", "trunk"}:
            groups["motorway"].append(path_from(pts))
        elif highway == "primary":
            groups["primary"].append(path_from(pts))
        else:
            groups["secondary"].append(path_from(pts))
    return {key: " ".join(vals) for key, vals in groups.items()}


def build_rail_path() -> str:
    rail = load("rail.json")
    paths: list[str] = []
    for way in rail.get("elements", []):
        pts = way_points(way)
        if len(pts) < 2:
            continue
        paths.append(path_from(rdp(pts, 1.2)))
    return " ".join(paths)


def build_krl_route() -> str:
    rel = load("rangkas.json")["elements"][0]
    all_points: list[tuple[float, float]] = []
    for member in rel.get("members", []):
        if member.get("type") != "way" or not member.get("geometry"):
            continue
        pts = way_points(member)
        if not pts:
            continue
        if all_points and math.dist(all_points[-1], pts[0]) < 1.0:
            pts = pts[1:]
        all_points.extend(pts)
    if len(all_points) < 2:
        raise SystemExit("Could not extract the KRL route from the OSM relation")

    # Trim to the Jurangmangu -> Tanah Abang section, not the whole Rangkasbitung line.
    jurang = project(-6.2885820, 106.7291463)
    tanah = project(-6.1857127, 106.8108938)
    start_idx = min(range(len(all_points)), key=lambda i: math.dist(all_points[i], jurang))
    end_idx = min(
        (i for i in range(start_idx, len(all_points))),
        key=lambda i: math.dist(all_points[i], tanah),
    )
    section = all_points[start_idx : end_idx + 1]
    section = [p for p in section if PAD - 8 <= p[0] <= SIZE - PAD + 8 and PAD - 8 <= p[1] <= SIZE - PAD + 8]
    section = rdp(section, 0.8)
    return path_from(section)


def catmull_rom_path(points: list[tuple[float, float]]) -> str:
    if len(points) < 2:
        return ""
    p = [points[0], *points, points[-1]]
    cmds = [f"M{points[0][0]:.1f},{points[0][1]:.1f}"]
    for i in range(1, len(p) - 2):
        p0, p1, p2, p3 = p[i - 1], p[i], p[i + 1], p[i + 2]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        cmds.append(
            f"C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}"
        )
    return " ".join(cmds)


def main() -> None:
    roads = build_road_paths()
    rail = build_rail_path()
    krl = build_krl_route()

    stations = []
    for item in STATIONS + EXTRA_POINTS:
        x, y = project(item["lat"], item["lon"])
        station = {
            **{k: v for k, v in item.items() if k not in {"lat", "lon"}},
            "xPct": round(x / SIZE * 100, 3),
            "yPct": round(y / SIZE * 100, 3),
        }
        stations.append(station)

    route_points = [project(s["lat"], s["lon"]) for s in STATIONS if s["kind"] in {"krl", "hub"}]
    # Path for the moving train dot: Jurangmangu -> Tanah Abang -> BNI City -> Sudirman.
    train_path = catmull_rom_path(route_points)

    # Transfer from Tanah Abang to BNI City/Sudirman, then last mile to SCBD.
    tanah = project(-6.1857127, 106.8108938)
    bni = project(-6.2015938, 106.8197174)
    sudirman = project(-6.2024081, 106.8234493)
    scbd = project(-6.2263, 106.8097)
    home = project(-6.2700, 106.7200)
    jurang = project(-6.2885820, 106.7291463)

    transfer = (
        f"M{tanah[0]:.1f},{tanah[1]:.1f} "
        f"Q{(tanah[0] + bni[0]) / 2 + 22:.1f},{(tanah[1] + bni[1]) / 2 - 18:.1f} {bni[0]:.1f},{bni[1]:.1f} "
        f"L{sudirman[0]:.1f},{sudirman[1]:.1f}"
    )
    last_mile = (
        f"M{home[0]:.1f},{home[1]:.1f} Q{(home[0] + jurang[0]) / 2 - 8:.1f},{(home[1] + jurang[1]) / 2 + 8:.1f} {jurang[0]:.1f},{jurang[1]:.1f} "
        f"M{sudirman[0]:.1f},{sudirman[1]:.1f} Q{(sudirman[0] + scbd[0]) / 2 + 10:.1f},{(sudirman[1] + scbd[1]) / 2 - 6:.1f} {scbd[0]:.1f},{scbd[1]:.1f}"
    )

    svg = f'''<svg class="route-map-svg" viewBox="0 0 {SIZE} {SIZE}" role="img" aria-labelledby="route-map-title route-map-desc" xmlns="http://www.w3.org/2000/svg">
  <title id="route-map-title">Rute perjalanan Bintaro ke SCBD</title>
  <desc id="route-map-desc">Peta bergaya dari OpenStreetMap: Jurangmangu, Pondok Ranji, Kebayoran, Palmerah, Tanah Abang, BNI City, Sudirman, dan SCBD. Data OpenStreetMap contributors, ODbL, 18 Oktober 2026.</desc>
  <defs>
    <radialGradient id="map-bg" cx="38%" cy="28%" r="85%">
      <stop offset="0%" stop-color="#123044"/>
      <stop offset="58%" stop-color="#0a1b29"/>
      <stop offset="100%" stop-color="#06111b"/>
    </radialGradient>
    <pattern id="map-grid" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M50 0H0V50" fill="none" stroke="#9fd8ff" stroke-opacity="0.055" stroke-width="1"/>
    </pattern>
    <filter id="route-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="7" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="route-color" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffb347"/>
      <stop offset="55%" stop-color="#ff7a45"/>
      <stop offset="100%" stop-color="#d7263d"/>
    </linearGradient>
  </defs>
  <rect width="{SIZE}" height="{SIZE}" fill="url(#map-bg)"/>
  <rect width="{SIZE}" height="{SIZE}" fill="url(#map-grid)"/>
  <path class="map-roads map-roads-major" d="{roads['motorway']}" fill="none" stroke="#7fb3c8" stroke-opacity="0.13" stroke-width="4.5" stroke-linecap="round"/>
  <path class="map-roads map-roads-primary" d="{roads['primary']}" fill="none" stroke="#8fc3d5" stroke-opacity="0.12" stroke-width="2.6" stroke-linecap="round"/>
  <path class="map-roads map-roads-secondary" d="{roads['secondary']}" fill="none" stroke="#8fc3d5" stroke-opacity="0.09" stroke-width="1.5" stroke-linecap="round"/>
  <path class="map-rail" d="{rail}" fill="none" stroke="#7f9eaf" stroke-opacity="0.18" stroke-width="1.4" stroke-dasharray="2 6" stroke-linecap="round"/>
  <path class="route-underlay" d="{krl}" fill="none" stroke="#ffb347" stroke-opacity="0.2" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" filter="url(#route-glow)"/>
  <path id="krl-route" class="route-line" d="{krl}" pathLength="1" fill="none" stroke="url(#route-color)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path class="transfer-line" d="{transfer}" fill="none" stroke="#ff6b6b" stroke-width="2.4" stroke-dasharray="2 8" stroke-linecap="round"/>
  <path class="last-mile-line" d="{last_mile}" fill="none" stroke="#2a9d8f" stroke-width="2.4" stroke-dasharray="2 7" stroke-linecap="round" stroke-opacity="0.85"/>
  <path id="train-path" d="{train_path}" fill="none" stroke="none"/>
  <g class="train-dot">
    <circle r="7" fill="#ffb347" opacity="0.95"/>
    <circle r="3" fill="#fff4de"/>
    <animateMotion dur="20s" repeatCount="indefinite" rotate="auto">
      <mpath href="#train-path"/>
    </animateMotion>
  </g>
</svg>
'''

    OUT_SVG.write_text(svg, encoding="utf-8")
    OUT_JSON.write_text(
        json.dumps(
            {
                "generatedFrom": "OpenStreetMap Overpass API",
                "retrievedAt": "2026-10-18T15:51:21Z",
                "attribution": "© OpenStreetMap contributors, ODbL",
                "bbox": [LON_MIN, LAT_MIN, LON_MAX, LAT_MAX],
                "stations": stations,
                "trainPath": train_path,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"wrote {OUT_SVG} ({OUT_SVG.stat().st_size} bytes)")
    print(f"wrote {OUT_JSON} ({OUT_JSON.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
