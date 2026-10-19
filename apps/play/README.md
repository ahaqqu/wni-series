# apps/play

**Status:** optional host shell — decision deferred to Phase 1.

Each game builds to `/play/<slug>/` and is served by Caddy. This package is reserved for a thin shared game host if we need a common boot/loader/error surface across multiple games. It must not contain game logic.

If a common host is unnecessary, this folder can remain a documented placeholder and each game's Vite build owns its own `index.html`.

## If implemented

- Load game manifests from `games/*/game.manifest.json`.
- Provide install/PWA prompt, unsupported-browser fallback, and error boundary.
- Never gate paid content; the API owns entitlements.
- Keep the host bundle tiny; the game bundle is lazy-loaded.
