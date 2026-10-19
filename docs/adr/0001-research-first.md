# ADR-0001 — Research-first gate for plans and implementation

- **Status:** accepted
- **Date:** 2026-10-19
- **Owners:** WNI Series
- **Research brief:** [PROTOCOL.md](../games/pejuang-nafkah/research/PROTOCOL.md)
- **Evidence:** provider/live-data research, landing Lighthouse, Phase 0 gate
- **Revalidate:** every phase start and on provider/law/dependency change

## Context

The product depends on fast-moving facts (framework versions, Mayar/TomTom pricing and terms, fares and station order, live-data availability) and on how real WNI commuters feel physically and emotionally. A confident plan built from stale memory or a single blog post would create rework or a security/cost incident.

## Decision

Adopt the research-first gate in [PROTOCOL.md](../games/pejuang-nafkah/research/PROTOCOL.md). No detailed plan, estimate, dependency choice, architecture change, content lock, or implementation starts without:

1. a current research brief with dated primary sources;
2. an ADR for the choice;
3. security/privacy, performance, cost, robustness/scaling evidence;
4. accurate real-world data validation;
5. WNI emotional/physical experience research or an explicit approved gap.

The gate applies per phase and on revalidation triggers. Unknowns are stop conditions, not prose to hand-wave.

## Consequences

- Positive: fewer rewrites, honest cost/security claims, better product truth, auditable decisions.
- Negative: slower start to a phase; requires field research and benchmarks.
- Mitigation: tiered timeboxes (R0/R1/R2), reuse existing briefs until they expire, and narrow scope instead of skipping.
- Security/privacy: threat model and data map must be refreshed before new trust boundaries.
- Performance/scaling: benchmarks on reference devices and 2× peak; state what breaks at 10×.
- Cost: provider prices with date/FX, worst case, caps, unit economics.

## Alternatives considered

| Option                              | Why rejected                                                            |
| ----------------------------------- | ----------------------------------------------------------------------- |
| Research once at project start      | Prices, terms, versions, and city data change; stale facts break plans. |
| Trust model memory/vendor marketing | Not verifiable; high risk on money, security, and real-world data.      |
| Research only after a bug/incident  | Reactive; rework and user harm.                                         |

## Evidence summary

- [2026-10 live-data/Mayar research](../games/pejuang-nafkah/research/2026-10-live-data-and-mayar.md)
- [2026-10 refresh](../games/pejuang-nafkah/research/2026-10-refresh.md)
- Landing Lighthouse/evidence: `artifacts/verification/landing/2026-10-19/`

## Revalidation

At each phase start; when Mayar/TomTom/BMKG pricing or terms change; when a law/regulation changes; when a dependency major changes; when a new city/corridor is added; after an incident that reveals a wrong assumption.
