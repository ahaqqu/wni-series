# games/_template

Copy this folder to `games/<slug>/` when starting a new WNI Series game.

## Required before code

1. Copy `docs/games/_template/` to `docs/games/<slug>/`.
2. Fill the four documents: `specs.md`, `design.md`, `plan.md`, `architecture.md`.
3. Rename `game.manifest.json` and fill every field honestly. `status` starts as `concept` or `design`.
4. Decide the free core and paid expansion. No pay-to-win, no loot boxes.
5. Define the game's content schema version and data sources.
6. Get user approval for the design and phase plan.

## Engineering rules

- Reuse `packages/gamekit`, `packages/ui`, `packages/contracts`, and the shared API.
- Keep `sim/` deterministic and free of DOM/Three.js imports.
- Scope entitlements by `game_id`; never fork auth or payments.
- Build to `/play/<slug>/`; add the slug to the platform catalog.
- Add CI build/deploy steps and a game-specific E2E path.
- Run the same Phase 0–7 gate system as Pejuang Nafkah.

## Do not

- Copy game #1's content or code without checking that it fits.
- Add a new payment provider or auth system without an explicit decision.
- Ship official logos, trade dress, or copied announcements without a licence.
