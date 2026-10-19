# docs/games/_template

Copy this folder to `docs/games/<slug>/` when starting a new WNI Series game.

## Steps

1. Copy the four documents from game #1 and rewrite them — do not leave Pejuang Nafkah assumptions in place:
   - `specs.md` — principles, objectives, requirements, release criteria
   - `design.md` — fantasy, loop, controls, art, web, monetization, accessibility
   - `plan.md` — phases, gates, evidence, risks
   - `architecture.md` — reuse the platform; document only what is different
2. Create `status.md` with the current phase and decisions.
3. Create `research/` with a brief, findings, and a dated refresh.
4. Add `games/<slug>/game.manifest.json` and a README.
5. Get user approval before implementation.

## Reuse, don't fork

- Auth, payments, entitlements, analytics, design system: shared (`services/api`, `packages/*`).
- Game-specific simulation, rendering, content, narrative: own package.
- Default commercial model: free sample/one route + one-time content unlock + optional subscription for live/online services. Ads, loot boxes, or pay-to-win are new decisions, not defaults. Payments use Mayar unless a new provider decision is recorded.
- The free core must be a complete game, not a demo.

## Minimum before code

- [ ] One-sentence promise and three experience pillars
- [ ] One-hand / input contract (or explicit non-handheld justification)
- [ ] Free vs paid boundary
- [ ] Real-world data sources + licences (if applicable)
- [ ] Security/privacy impact assessment
- [ ] Phase plan with measurable gates
- [ ] User sign-off
