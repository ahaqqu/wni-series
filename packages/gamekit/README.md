# packages/gamekit

**Status:** planned — extracted during Phase 1, hardened in Phase 2.

Reusable Three.js game runtime for WNI Series games. It should contain only generic, well-tested primitives:

- fixed-timestep loop + accumulator
- deterministic PRNG + clock injection
- one-hand pointer input (drag/hold/tap/swipe) with buffering
- quality detection, adaptive resolution, object pooling helpers
- asset loading/caching, audio bus, haptics adapter
- save/checkpoint + offline queue
- telemetry batching (privacy-safe)
- error boundary / unsupported-browser fallback

It must not contain Pejuang Nafkah content, routes, prices, or entitlements. Simulation stays in each game's `sim/`; rendering stays in `render/`.
