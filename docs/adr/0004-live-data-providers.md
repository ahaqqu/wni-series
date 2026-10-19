# ADR-0004 — TomTom + BMKG, modelled crowding

- **Status:** accepted with limits
- **Date:** 2026-10-19
- **Owners:** WNI Series
- **Research brief:** [live-data/Mayar research](../games/pejuang-nafkah/research/2026-10-live-data-and-mayar.md)
- **Evidence:** provider pricing/terms, BMKG access, cost model, freshness plan
- **Revalidate:** 30 days before Phase 2; on price/terms/API change; before city expansion

## Context

Live traffic/weather/incidents are buyable; real-time KRL/TransJakarta crowding/positions are not publicly available. A “live” badge that is not real would break trust. TomTom pricing and terms must be confirmed for game/derived-data use; BMKG is free with attribution; PetaBencana commercial use needs a licence.

## Decision

Use **TomTom Traffic Flow Segment + Incidents** for road traffic/incidents and **BMKG** forecast/nowcast for weather. Cache snapshots server-side, refresh adaptively (5 min during 9 peak hours, 30 min otherwise), freeze a snapshot at run start, and label crowding/transit delay **Estimasi** unless an operator feed exists. PetaBencana flood layer only after a commercial CC BY licence. Open-Meteo as a paid fallback only if needed and licensed.

## Consequences

- Positive: real traffic/weather with timestamps/source; deterministic runs; cost controllable.
- Negative: ~€149/month at 10 corridors/adaptive; TomTom terms/storage limits need written confirmation; no true crowding.
- Security: provider keys server-only; cost caps; per-user refresh limits; stale/degraded state.
- Privacy: corridor-level queries, not user identity; planner uses chosen points, not GPS.
- Product: Live is useful (traffic/weather/planner) without pretending to know crowding.

## Alternatives considered

| Option                     | Why rejected                                                  |
| -------------------------- | ------------------------------------------------------------- |
| Google Routes              | ~10× cost and terms need review.                              |
| Scrape operator apps/feeds | No licence, brittle, privacy/legal risk.                      |
| Claim live crowding        | No public data; would be dishonest.                           |
| Skip live data             | Subscription loses its utility; traffic/weather are feasible. |

## Revalidation

Written TomTom commercial terms; BMKG attribution; PetaBencana quote; re-run cost model at actual corridors/subscribers; confirm labels/no live-crowding claim before sale.
