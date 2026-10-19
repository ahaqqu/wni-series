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

| ADR                                  | Title                                            | Status   | Date       |
| ------------------------------------ | ------------------------------------------------ | -------- | ---------- |
| [0001](0001-research-first.md)       | Research-first gate for plans and implementation | Accepted | 2026-10-19 |
| [0002](0002-vps-first-cloudflare.md) | VPS-first + Cloudflare edge                      | Accepted | 2026-10-18 |
| [0003](0003-mayar-payments.md)       | Mayar hosted checkout + SaaS membership          | Accepted | 2026-10-19 |
| [0004](0004-live-data-providers.md)  | TomTom + BMKG, modelled crowding                 | Accepted | 2026-10-19 |

Existing architecture summary: [architecture.md](../games/pejuang-nafkah/architecture.md) §3.

## Template

Copy [0000-template.md](0000-template.md), number it sequentially, and link the research brief/evidence.
