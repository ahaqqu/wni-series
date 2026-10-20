# Architecture decision records

ADRs capture **decisions**, not diaries. One decision per file; immutable once accepted except for status/supersession links.

## When to write one

- stack/runtime/framework/provider choice;
- data store/auth/payment/hosting change;
- live-data source, licence, or cost cap;
- security/privacy tradeoff or new trust boundary;
- an irreversible content/licence choice;
- a scaling or reliability decision that changes operations.

Research-first requirements and templates: [research protocol](../games/pejuang-nafkah/research/PROTOCOL.md).

## Status values

`proposed` → `accepted` → `superseded` / `deprecated` / `rejected`.

## Index

| ADR                                  | Title                                                  | Status            | Date       |
| ------------------------------------ | ------------------------------------------------------ | ----------------- | ---------- |
| [0001](0001-research-first.md)       | Research-first gate for plans and implementation       | Accepted          | 2026-10-19 |
| [0002](0002-vps-first-cloudflare.md) | VPS-first + Cloudflare edge                            | Accepted          | 2026-10-18 |
| [0003](0003-mayar-payments.md)       | Mayar hosted checkout + SaaS membership                | Accepted          | 2026-10-19 |
| [0004](0004-live-data-providers.md)  | TomTom + BMKG, modelled crowding                       | Accepted          | 2026-10-19 |
| [0005](0005-drama-system.md)         | Rare, real-basis, fictionalised drama layer            | Accepted          | 2026-10-19 |
| [0006](0006-daily-drama-pipeline.md) | Daily AI research with human approval, no auto-publish | Accepted (design) | 2026-10-19 |
| [0007](0007-caching-and-edge-delivery.md) | Postgres-only caching; Cloudflare edge for static/JSON | Accepted          | 2026-10-19 |
| [0008](0008-social-signal-ingestion.md) | Social signal ingestion via a scraping broker (candidate) | **Proposed**    | 2026-10-19 |
| [0009](0009-push-hold-prototype.md) | Standalone push-and-hold prototype (Draft 0) | Accepted (prototype) | 2026-10-20 |
| [0010](0010-push-hold-arena.md) | Standalone push/hold arena test (1 player, 3 passengers); amended for charge/release hard push, knockdowns, revenge quick shove, camera bystander + viral game over + 1.8× inspect zoom + charge/fall poses | Accepted (prototype) | 2026-10-20 |

Existing architecture summary: [architecture.md](../games/pejuang-nafkah/architecture.md) §3.

## Template

Copy [0000-template.md](0000-template.md), number it sequentially, and link the research brief/evidence.
