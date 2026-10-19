# packages/content-schema

**Status:** planned — Phase 0 seed.

Schemas and validators for real-world game content:

- station master (code, name, line, order, km, platform side, facilities, hub)
- route graph (nodes, polyline, lanes, speed profile, landmarks)
- rules (fares, odd-even, busway, helmet, fines, effective dates)
- scenarios (weather, incidents, weights, telegraphs, counterplay)
- source registry (URL, retrieved_at, confidence, licence)
- content pack version/`effective_from`/checksum

The same validators run in CI (`pnpm verify:content`) and at build time. A content pack cannot ship with a missing source, a station order mismatch, or a fare formula that fails its test.
