# games/pejuang-nafkah

**Game #1 of WNI Series.** Status: design complete, implementation not started.

This package will hold the Vite + Three.js client for _Pejuang Nafkah_. It is intentionally empty of implementation in Phase 0. The source of truth for what to build is:

- [specs.md](../../docs/games/pejuang-nafkah/specs.md)
- [design.md](../../docs/games/pejuang-nafkah/design.md)
- [plan.md](../../docs/games/pejuang-nafkah/plan.md)
- [architecture.md](../../docs/games/pejuang-nafkah/architecture.md)

## Planned boundaries

```text
src/
  sim/        deterministic simulation (no DOM, no Three.js) — shared with server replay
  render/     Three.js scene, camera, assets, VFX
  ui/         React HUD/menus; no per-frame renders
  content/    typed content-pack loaders
  main.ts     boot + quality detection + save/offline wiring
public/       game-local assets (hashed at build)
```

- Build base: `/play/pejuang-nafkah/`.
- Must remain playable one-handed in portrait and offline-tolerant.
- Must not import `apps/*` or `services/*`.
- Paid content must never be shipped in the free bundle.

## Phase 1 entry criteria

Do not implement until Phase 0 gates are green (see [plan.md](../../docs/games/pejuang-nafkah/plan.md)). The first vertical slice is the KRL morning: Jurangmangu/Pondok Ranji → Tanah Abang → Sudirman/BNI City.
