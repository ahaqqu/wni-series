# packages/config

**Status:** planned — Phase 1.

Shared configuration for the monorepo:

- TypeScript base config (root `tsconfig.base.json` is the current seed)
- ESLint/Biome rules and framework presets
- Prettier config
- Vitest/Playwright base configs
- environment validation helpers

Keep it boring and strict. A package should be able to extend it without copying rules.
