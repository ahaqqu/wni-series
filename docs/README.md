# Documentation index

WNI Series is a multi-game platform. Each game has its own folder under `docs/games/<slug>/`; shared engineering docs live at the root of `docs/`.

## Game #1 — Pejuang Nafkah

| Doc                                                               | Purpose                                                                                                    |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [specs.md](games/pejuang-nafkah/specs.md)                         | Product principles, objectives, functional/non-functional requirements, security/privacy, release criteria |
| [design.md](games/pejuang-nafkah/design.md)                       | Game feel, dual mode, systems, art direction, one-hand UX, web/motion design, monetization                 |
| [brand.md](games/pejuang-nafkah/brand.md)                         | Slogans, drama engine, WNI Series expansion template, Bang Nafkah voice, humour rules                      |
| [research/PROTOCOL.md](games/pejuang-nafkah/research/PROTOCOL.md) | Research-first gate: latest tech/data, security, performance, cost, scaling, WNI experience                |
| [ADR index](adr/README.md)                                        | Architecture decision records and rejected alternatives                                                    |
| [plan.md](games/pejuang-nafkah/plan.md)                           | Phase-by-phase delivery, gates, evidence, risks, launch checklist                                          |
| [architecture.md](games/pejuang-nafkah/architecture.md)           | Stack, data model, API, payments, security, privacy, deployment, CI/CD, multi-game                         |
| [status.md](games/pejuang-nafkah/status.md)                       | Current phase, decisions, evidence, next action                                                            |
| [research/](games/pejuang-nafkah/research/)                       | Research brief, F1–F5, synthesis, 2026-10 refresh, live-data/Mayar fees/cost                               |

## Shared docs

| Doc                                                    | Purpose                                                         |
| ------------------------------------------------------ | --------------------------------------------------------------- |
| [verification/README.md](verification/README.md)       | Test tiers, evidence contract, agent self-verification protocol |
| [runbooks/README.md](runbooks/README.md)               | Deploy, payments, backup/restore, incident, privacy request     |
| [games/_template/README.md](games/_template/README.md) | How to start game #2 without forking the platform               |

## Reading order

1. `specs.md` — what we are building and what “done” means.
2. `design.md` — how it feels, looks, and plays.
3. `research/PROTOCOL.md` — the research-first gate.
4. `brand.md` — the words, voice, and jokes.
5. `plan.md` — the order of work and the gates.
6. `architecture.md` — how it is built and operated.
7. `research/2026-10-refresh.md` — transport/market facts behind the design.
8. `research/2026-10-live-data-and-mayar.md` — provider access, fees, and live-data cost model.

## Documentation rules

- English for engineering docs; Indonesian for in-game copy and player-facing pages.
- Every number that can change (fare, station order, schedule, price) has a source and a date.
- IDs in `specs.md` are referenced by tests and `plan.md`.
- When a decision changes, update the docs first, then the code, then `status.md`.
- No detailed plan or implementation without a current research brief and ADR; expiry is a red gate.
