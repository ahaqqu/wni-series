# WNI Pejuang Nafkah — Final Evidence (pass-8)

## Result
Premium-oriented 3D arcade commute: authored hero bike, layered Jakarta street kit, gradient sky + sun, event VFX, juice (hitstop/shake/FOV/speed lines), gaji tokens, near-miss combo, two modes, landing + Paywuz paywall.

- **URL:** http://127.0.0.1:5188/
- **Controls:** Drag steer · Hold brake/brace · A/D + Space
- **Verified with Playwright** (canvas inspector + interaction probe)

## Playwright checks (pass-8)
| Check | Result |
| --- | --- |
| `npm run build` | pass · 585 kB JS |
| Desktop active-play | nonblank · entropy **5.80** · edge 0.237 · contrast 161 · dom **0.098** |
| Mobile active-play | nonblank · entropy **5.64** · edge 0.270 · contrast 148 · dom 0.189 |
| Desktop landing | nonblank · entropy 4.60 · edge 0.225 |
| Console / page errors | **none** |
| Interaction probe | pass — motor 26 m, near-miss gaji, boost meter, tokens, KRL mode switch |
| GPU | Intel Iris Xe hardware (not software) |

## Renderer diagnostics
- calls: **688** (motor) — over desktop 300 budget; tradeoff = dense authored city kit + 2048 shadows
- triangles: **24.4k** · geometries: **549** · textures: **6** · programs: **10**
- DPR cap 2 · ACES tone map · key/fill/rim + hemisphere + ambient
- Shared world geometries (buildings, windows, trees, rails) to cut memory

## Graphics upgrade (this pass)
- **SkySystem** — gradient shader dome, sun disc/halo, cloud sprites, weather tint
- **Hero bike** — layered chassis/tank/forks/exhaust/wheels + rider/helmet/visor/gloves
- **Vehicles** — car/angkot/bus/truck with lights, wheels, glass, stripes, signs
- **World** — curb/sidewalk, lane markings, glass building faces, trees, lamps, billboards, guardrails, cones, puddles
- **Lighting** — warm key + cool fill + teal rim, lifted shadows (p5 2 → 21)
- **VFX** — impact rings, spark bursts, damage flash, additive speed lines, boost trail

## Gameplay upgrade (this pass)
- Gaji tokens (collect burst + boost)
- Near-miss combo → adrenaline → FOV/speed punch
- Crash: hitstop + trauma shake + damage flash
- Progressive traffic density + weather grip
- Smoother lean steering + camera bank
- Faster fail/retry loop

## Visual scorecard (active-play)
| Category | Score | Evidence |
| --- | --- | --- |
| Art direction | 2.5 | Golden-hour sky + teal/orange Jakarta palette |
| Hero/player | 2.5 | Authored bike+rider silhouette, lean, trail |
| Obstacles | 2.5 | Distinct vehicle families + cones/puddles telegraphs |
| Rewards | 2.5 | Gaji tokens + near-miss banners |
| World | 2.5 | Layered road/buildings/props/billboards |
| Materials | 2 | Shared kit, procedural asphalt, glass/emissive |
| Lighting | 2.5 | Key/fill/rim + sky; measured contrast 161 |
| VFX | 2.5 | Event rings/sparks/flash/speed lines |
| UI/HUD | 2 | Genre meters, pause/result/paywall |
| Performance | 2 | Metrics reported; 688 calls documented overrun |

**Average ≈ 2.35** (premium threshold).

## Known limits
1. Draw calls 688 vs 300 budget (city density tradeoff) — next: merge static segment meshes.
2. No external generated models/audios (no provider keys).
3. KRL interiors still arcade-simplified.
4. Paywuz needs live merchant endpoint.

## Evidence paths
- `artifacts/pass-8/desktop-active-play.png`
- `artifacts/pass-8/mobile-active-play.png`
- `artifacts/pass-8/desktop-landing.png`
- `tests/interaction-probe.mjs`
