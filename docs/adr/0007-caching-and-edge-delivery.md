# ADR-0007 — Postgres-only caching; Cloudflare edge for static and immutable content

- **Status:** accepted
- **Date:** 2026-10-19
- **Owners:** WNI Series
- **Research brief:** [Caching and edge delivery](../games/pejuang-nafkah/research/2026-10-caching-edge-delivery.md)
- **Evidence:** Cloudflare cache docs (2026-08-14 / 2026-09-14 / 2026-09-29), R2 pricing (2026-10-01), planning load model in the brief
- **Revalidate:** 2027-01-19, or when a tripwire below fires

## Context

The API runs on one netcup VPS (2 vCPU / 4 GB) with one PostgreSQL instance. Before Phase 2 the owner asked whether a Valkey cache is needed for scalability, and whether static files and content JSON should be served by Cloudflare instead of the VPS.

Three facts shape the answer:

1. **The database load is not the constraint.** At 10k DAU the model is ~3.5 req/s average and ~21 req/s at peak, roughly 100 simple indexed queries per second — far below what one Postgres instance handles.
2. **The bytes are the constraint.** At 10k DAU the origin would push 4–5 TB/month of game assets if it served them directly. That is a cost and saturation problem, and it is solved by the edge, not by an in-memory cache.
3. **Caching authorization is dangerous.** Sessions, entitlements, and subscription state are the data most tempting to cache and the data where a stale entry either gives away paid access or locks out a paying customer.

Vendor behavior verified on 2026-10-19: Cloudflare caches by file extension and **does not cache HTML or JSON by default**; Cache Rules are available on Free with 10 rules; Tiered Cache is available on Free; R2 has no egress charge.

## Decision

1. **No Valkey or Redis at launch.** Postgres remains the single source of truth; hot reads use primary-key lookups and a small in-process TTL LRU. Do not cache sessions, entitlements, subscription state, or payment status in a shared store.
2. **Cloudflare serves static and immutable public content.** Hashed JS/CSS/textures/audio and versioned content packs carry `public, max-age=31536000, immutable`. HTML keeps a 5-minute edge TTL plus a purge on deploy. Caddy remains the origin; the cache is an optimization, not a second source of truth.
3. **Content JSON gets an explicit Cache Rule.** Because JSON is not cached by default, add a rule scoped to `/content/*` with **Eligible for cache = Yes**. Content paths carry `contentVersion`/hash, so no purge is ever required for content.
4. **Never edge-cache `/api/*`, auth, checkout, webhooks, or admin.** These stay `no-store` at the origin and are not matched by any Cache Rule. The live briefing stays `private, max-age=60` (browser-only), per §10A.4.
5. **Paid packs stay entitlement-gated.** Signed short-TTL URLs from R2 are not edge-cached on purpose: unique signatures miss anyway, and the volume is one small download per purchase. The public game build is what the CDN absorbs.
6. **Reopen this decision only on a trigger.** Add a shared cache (starting with Valkey, self-hosted) when any of these is true:
   - more than one API instance exists;
   - Postgres CPU is above 60% sustained at peak, or p95 DB time exceeds 50 ms after indexing;
   - sustained traffic exceeds ~100 req/s on the same endpoints;
   - background jobs outgrow cron + `FOR UPDATE SKIP LOCKED`;
   - websockets or presence enter scope.

   Escalation order before Valkey: indexes → connection pooling → vertical resize → read replica.

## Consequences

- **Positive:** one stateful service to operate; no stale-authorization class of bug; the CDN removes the dominant egress and CPU cost; content updates need no cache purge; the deployment stays a single box with a single backup/restore story.
- **Negative / accepted tradeoffs:** the first request per asset per data center still reaches the origin (mitigated by Tiered Cache and request collapsing); Cloudflare behavior must be verified in staging with `cf-cache-status` rather than assumed; the origin is still a single point of failure, and Valkey would not have changed that.
- **Security/privacy:** no authenticated or personal data enters the edge cache; Cache Rules are scoped by path; Cache Deception Armor stays on; the cache is not an authorization boundary.
- **Performance/scaling:** the DB remains well inside capacity through the 10k-DAU model; the expensive provider calls are already deduplicated per corridor, so a read cache would not reduce spend. The 100k-DAU case needs the load test, not a new component.
- **Cost/operations:** €0 incremental on Cloudflare Free and within the R2 free tier; avoids 4–5 TB/month of origin egress at 10k DAU; no second daemon to patch, monitor, or back up.
- **Rollback/reversibility:** removing a Cache Rule or setting `Cache-Control: no-store` reverts delivery instantly. Adding Valkey later does not require undoing anything here.

## Alternatives considered

| Option                                           | Why rejected                                                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Valkey/Redis from day one                        | Solves a load problem we do not have; adds a second stateful service plus a stale-entitlement failure mode.  |
| Cache Everything on the whole zone               | Would cache authenticated `/api/*` JSON and serve it across users — a data-leak incident.                    |
| Serve everything from the VPS                    | 4–5 TB/month of asset egress at 10k DAU; the edge is free and already in front of the origin.                |
| Workers KV / D1 as an application cache          | New vendor surface and consistency model for no measured benefit; D1 is already rejected in ADR-0002.        |
| Edge-cache signed paid packs                     | Per-user signatures produce unique URLs, so hit rate is near zero; caching also risks token leakage.         |
| Cache sessions/entitlements in-process for 15 min | Revocation and expiry would lag; support and refund edge cases become authorization bugs.                    |

## Evidence summary

- [Research brief](../games/pejuang-nafkah/research/2026-10-caching-edge-delivery.md) — findings F1–F8 with source URLs and dates; load model with stated assumptions; security checklist; stop conditions.
- Architecture: §5.1 (edge cache matrix), §5.2 (Caddy), §10A.2 (live snapshots, no shared cache), §13.4 (measured scaling).
- **Unknowns:** no production traffic, no measured hit ratio, no load test yet, and no Cloudflare zone access in this session. The Phase 2 load test and the first staging deploy must confirm the model and the `cf-cache-status` behavior.
- **Stop conditions:** any Cache Rule touching `/api/*`; measured p95 DB latency above 50 ms at peak; a change to Cloudflare default caching or R2 pricing.

## Revalidation

Recheck on 2027-01-19, and immediately on any tripwire in Decision item 6, the Phase 2 load test, a Cloudflare pricing/default-caching change, or the introduction of a second API instance.
