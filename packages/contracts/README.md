# packages/contracts

**Status:** planned — Phase 0 seed, expanded with each endpoint.

Single source of truth for client/server contracts:

- Zod schemas for API requests/responses, orders, entitlements, runs, saves
- inferred TypeScript types
- error/problem shapes
- enum/state-machine constants
- version constants

Rules: no database imports, no browser-only APIs, no secrets; schemas must be usable in Node and the browser. The API validates every input with these schemas; the game imports the same types.
