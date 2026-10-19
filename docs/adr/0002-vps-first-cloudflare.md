# ADR-0002 — VPS-first + Cloudflare edge

- **Status:** accepted
- **Date:** 2026-10-18
- **Owners:** WNI Series
- **Research brief:** [architecture](../games/pejuang-nafkah/architecture.md) §1–3
- **Evidence:** netcup 2 vCPU/4 GB box, Cloudflare free plan, cost envelope
- **Revalidate:** when traffic, p95 latency, or ops burden exceeds the assumptions

## Context

A small single-player game/platform needs Postgres transactions, cron/reconciliation, predictable egress, and simple operations. The owner already has a netcup VPS and Cloudflare; serverless CPU/time limits and per-request pricing add risk for the live-data/reconciliation jobs.

## Decision

Run Caddy + Fastify + PostgreSQL + cloudflared on the existing netcup VPS behind Cloudflare DNS/WAF/cache/Tunnel. Static platform/game assets are served by Caddy; no Kubernetes and no multi-region active-active at launch.

## Consequences

- Positive: fixed cost, Postgres transactions, cron, full control, one deploy path.
- Negative: single point of failure; Europe origin adds latency to Jakarta; we own patching/backups.
- Mitigation: encrypted backups, restore drills, fast rebuild, Cloudflare edge, SLOs that reflect latency, scale vertically before adding nodes.
- Security: origin hidden by Tunnel; SSH restricted; Cloudflare is not the authorization boundary.
- Cost: existing VPS + Cloudflare free; live data is the variable cost.

## Alternatives considered

| Option                          | Why rejected                                                               |
| ------------------------------- | -------------------------------------------------------------------------- |
| Cloudflare Workers + D1         | CPU/duration limits, D1/queue constraints, reconciliation/cron complexity. |
| Managed PaaS + managed Postgres | Higher monthly cost at low volume; less control of backups/egress.         |
| Kubernetes                      | Operationally disproportionate for one small team.                         |

## Revalidation

Revisit if p95 API latency from Jakarta exceeds the SLO, traffic needs more than one API/DB node, or the VPS becomes an operational burden.
