# data

**Status:** structure only — Phase 0 populates the source registry.

Real-world data that drives the game. It is **not** a copy of Google Maps or an official timetable; it is a versioned, sourced, hand-validated content pack.

```text
data/
  raw/           source extracts (OSM, station lists, rules, flood points)
  normalized/    validated JSON consumed by the game/API
```

## Rules

- Every record has `sourceIds`, `retrievedAt`, `confidence`, and `effectiveFrom`.
- Do not commit large raw extracts without a documented source and licence; use Git LFS or R2 when needed.
- OSM data requires attribution (`© OpenStreetMap contributors`, ODbL) and a licence note.
- No official KAI/TransJakarta logos, trade dress, or copied announcements.
- No personal data, real-time location traces, or scraped user content.
- A fare/station/schedule change is a **content release**, not a code change. Old runs stay tied to their content version.
- Run `pnpm verify:content` before shipping a pack (added Phase 1).

## Launch corridors

See [design.md](../docs/games/pejuang-nafkah/design.md) §6.1 and [specs.md](../docs/games/pejuang-nafkah/specs.md) §7.
