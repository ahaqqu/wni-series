# Caching and edge delivery — Postgres vs Valkey, VPS vs Cloudflare

**Status:** decision support for [ADR-0007](../../../adr/0007-caching-and-edge-delivery.md). Vendor behavior verified 2026-10-19. **The load figures below are a planning model, not a benchmark.**
**Date:** 2026-10-19
**Companions:** [ADR-0002](../../../adr/0002-vps-first-cloudflare.md) · [architecture.md](../architecture.md) §5.1, §10A.2, §13.4 · [plan.md](../plan.md)

> Question from the owner: should the API use Valkey for caching so the server scales, or is Postgres enough — and should static files and JSON content be cached/served by Cloudflare instead of the VPS?

---

## 1. Questions

1. Is Postgres enough for API reads at launch and at 10k DAU, or does the design need a shared cache?
2. If a cache is added, which data must never be cached?
3. Should static files and content JSON be served by Cloudflare rather than the VPS?
4. What measurable trigger justifies adding Valkey later?

## 2. Findings (verified against vendor docs)

| #   | Finding                                                                                                                                                                                                     | Source                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| F1  | Cloudflare caches **by file extension, not MIME type**, and **does not cache HTML or JSON by default**.                                                                                                     | [Default cache behavior][cf-default], updated 2026-09-14                |
| F2  | Default cached extensions include `js`, `css`, images, fonts, audio, video, `pdf`, `zip`; HTML and JSON are excluded. A Cache Rule with **Eligible for cache = Yes** is required for content JSON.           | [Default cache behavior][cf-default], [Uncached responses][cf-uncached]  |
| F3  | Cache Rules are available on the **Free** plan with **10 rules**.                                                                                                                                            | [Cache Rules][cf-rules], updated 2026-08-14                             |
| F4  | **Tiered Cache is available on Free** with Smart topology; Generic Global, Regional, and Custom topologies are Enterprise.                                                                                    | [Tiered Cache][cf-tiered], updated 2026-09-29                           |
| F5  | Cloudflare does not cache when the origin sends `private`, `no-store`, `no-cache`, `max-age=0`, `Set-Cookie`, or `Vary: *`; on Free/Pro/Business, a request with `Authorization` is cached only if the response also allows it (`public`, `s-maxage`, `must-revalidate`). | [Default cache behavior][cf-default], [Uncached responses][cf-uncached] |
| F6  | Free/Pro/Business cacheable object limit is **512 MB**; max upload 100 MB.                                                                                                                                   | [Default cache behavior][cf-default]                                    |
| F7  | R2 charges **no egress**; free tier 10 GB-month storage, 1M Class A, 10M Class B; standard storage $0.015/GB-month after that.                                                                               | [R2 pricing][r2-pricing], updated 2026-10-01                            |
| F8  | Cloudflare collapses concurrent misses per data center into one origin fetch (cache lock).                                                                                                                    | [Default cache behavior][cf-default]                                    |

[cf-default]: https://developers.cloudflare.com/cache/concepts/default-cache-behavior/
[cf-uncached]: https://developers.cloudflare.com/cache/troubleshooting/investigating-uncached-responses/
[cf-rules]: https://developers.cloudflare.com/cache/how-to/cache-rules/
[cf-tiered]: https://developers.cloudflare.com/cache/how-to/tiered-cache/
[r2-pricing]: https://developers.cloudflare.com/r2/pricing/

**Consequence:** the current §5.1 table says "assets immutable" but does not say that JSON is excluded from default caching. Without an explicit Cache Rule, every content-pack fetch reaches Caddy and Postgres, which is exactly the traffic the VPS should not serve.

## 3. Load model (estimate)

Assumptions: 30 API requests per active user per day; 6× peak-to-average; 5 database queries per authenticated request; ~1.5 game sessions per active user per day at 8–12 MB of static assets per session.

| DAU   | API req/day | Avg rps | Peak rps | Peak DB queries | Asset egress/day (origin-served) |
| ----- | ----------- | ------- | -------- | --------------- | -------------------------------- |
| 1,000 | 30k         | 0.35    | ~2       | ~10             | 12–18 GB                         |
| 10k   | 300k        | 3.5     | ~21      | ~105            | 120–180 GB                       |
| 100k  | 3M          | 35      | ~210     | ~1,050          | 1.2–1.8 TB                       |

Two observations drive the decision:

1. **The database load is small.** Even the 100k-DAU peak is ~1k simple indexed queries per second, which is the range where Postgres starts to need attention rather than the range where it fails. At 10k DAU it is roughly two orders of magnitude below a 2 vCPU box's capability.
2. **The byte volume is the real scaling problem.** At 10k DAU the VPS would push 4–5 TB/month if it served assets directly. That is the cost and saturation risk, and Cloudflare removes it for €0.

## 4. Postgres assessment

- The hot read is a primary-key lookup (`live_snapshots` by corridor/bucket, entitlement by user, content manifest by version). Those are sub-millisecond with a warm buffer pool.
- The provider spend is already deduplicated: one worker writes a snapshot per corridor/time bucket and all subscribers read it (§10A.2). Caching the read would not reduce provider calls at all.
- The failure that matters is **connection contention**, not query throughput: cap the pool (10–20), keep transactions short, run `EXPLAIN (ANALYZE, BUFFERS)` on the top queries, and add `pg_stat_statements`.
- Order of escalation: index → pool/PgBouncer → vertical resize (4 vCPU/8 GB) → read replica → shared cache.

## 5. Valkey assessment

A shared in-memory store would be justified for: sessions across multiple API processes, shared rate-limit counters, a job queue, pub/sub, or hot reads that exceed Postgres. None of those exist today:

| Candidate use        | Now                                          | Needed when                                   |
| -------------------- | -------------------------------------------- | --------------------------------------------- |
| Session store        | Postgres + signed cookie                     | 2+ API instances                              |
| Rate-limit counters  | Cloudflare + in-process + `rate_limits` table | 2+ API instances                              |
| Hot read cache       | PK read + in-process TTL LRU                 | measured p95 DB latency breach                |
| Job queue            | cron + `FOR UPDATE SKIP LOCKED`              | job volume/latency outgrows cron              |
| Pub/sub, presence    | none                                         | real-time features enter scope                |

Costs of adding it now: 100–300 MB RAM on a 4 GB box, a second service to patch, back up, monitor, and alert on, and a new correctness risk — **a cached entitlement is an authorization decision with a TTL**. A stale entry either gives away paid access or locks out a paying customer. Payment, entitlement, and subscription state stay read-through and transactional.

**Tripwires (also in ADR-0007):** more than one API instance; sustained Postgres CPU > 60% at peak or p95 DB time > 50 ms after indexing; > 100 req/s sustained on the same endpoints; background jobs outgrow cron + `SKIP LOCKED`; websockets/presence enter scope.

## 6. Security review

- **Never cache `/api/*`.** Authenticated JSON cached at the edge and served to another user is a data-leak incident, not a performance tweak. Cloudflare is explicitly not an authorization boundary (ADR-0002).
- **Scope Cache Rules narrowly** to `/content/*`, `/assets/*`, and static extensions. Do not apply "Cache Everything" to a whole zone.
- **Cache deception:** enable Cache Deception Armor; do not cache paths that reflect user input or append arbitrary suffixes to authenticated URLs.
- **Cache poisoning:** the cache key for content is path + version only. Do not vary on attacker-controlled headers, and do not put query strings on content URLs.
- **Purge authority:** the deploy pipeline only. HTML gets a 5-minute edge TTL plus a purge on deploy.
- **Signed paid URLs:** `private, no-store` on the redirect, never log the signature, short TTL. Their unique query strings make them edge misses by design — acceptable, because the volume is one small download per purchase.
- **Errors:** 404/410 get a 3-minute default TTL ([F2 source][cf-default]); do not cache 5xx.

## 7. Cost

- Cloudflare caching and Cache Rules: **€0** on the Free plan (10 rules).
- R2: within the free tier at projected volume (a few GB of packs, well under 10 GB-month; egress free).
- Valkey: €0 if self-hosted on the same VPS, but consumes RAM and attention; a managed instance adds a monthly bill and a network hop to a single-box deployment. Not evaluated further because it is not needed.

## 8. What this brief does **not** prove

- No production traffic, no zone access in this session, and no measured cache-hit ratio.
- The load table is arithmetic from stated assumptions, not a benchmark; §13.4 requires a 2× peak load test before the Phase 2 gate.
- Vendor docs describe documented behavior. After the first staging deploy, verify with `cf-cache-status` on `/`, `/content/*`, `/api/*`, and a signed pack URL.
- No decision on whether paid packs should ever be edge-cached; the recommendation is no.

## 9. Stop conditions

- A proposed Cache Rule that matches `/api/*`, checkout, webhook, or admin → stop and security-review.
- Measured p95 DB latency above 50 ms at peak after indexing → revisit this brief.
- Cloudflare default caching, Free-plan limits, or R2 pricing changes → revalidate.
- A second API instance becomes necessary → the Valkey decision reopens.

## 10. Revalidation

2027-01-19 (90 days) or on any stop condition, Phase 2 load test, or Cloudflare pricing/behavior change.
