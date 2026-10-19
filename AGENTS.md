# AGENTS.md — working agreement for AI/coding agents

This repository is the **WNI Series** platform and its first game, **Pejuang Nafkah**. Read this before changing anything.

## 1. Current phase

**Phase 0 + pre-alpha landing page.** The core documents (specs/design/brand/plan/architecture), research protocol, and ADRs are written, the repo is scaffolded, and the marketing landing page (`apps/platform`) plus email waitlist API (`services/api`) are implemented. **The game, checkout/payments, live data, subscriptions, and account system are not implemented yet.** v4 product direction: free one route; All Maps Rp 79k; Live Rp 49k/month in Phase 2; other cities in Phase 3. Do not start Phase 1 until the user approves the Phase 0 gate and the Phase 1 scope.

**Canonical host:** `https://wniseries.ahaqqu.com`
**Support/privacy email:** `wniseries@gmail.com`
**VPS:** netcup, 2 vCPU / 4 GB / 100+ GB SSD, behind Cloudflare.

## 2. Research-first gate (hard rule)

**No detailed plan, estimate, dependency choice, architecture change, content lock, or implementation starts until there is a current research brief, an ADR for the choice, and evidence for the facts that could break it.** Research is a per-phase pre-flight, not a one-time docs pass.

Every R1/R2 brief must cover:

- **Latest tech:** official release notes/current versions, support/EOL, licence, security advisories, and a benchmark on our reference devices — not model memory.
- **Accurate real data:** primary operator/regulator sources, effective dates, two independent confirmations for fares/station order/schedules/road rules, licence/attribution.
- **Security/privacy:** updated threat model/data map; authn/authz; payment/entitlement invariants; secrets; supply chain; abuse/rate limits.
- **Performance/load/efficiency:** budgets on low/mid/high devices and networks; CPU/GPU/memory/bytes/egress/battery per player; 2× peak test; stale/offline behaviour.
- **Cost control:** provider price with source/date, FX, worst case (10×), caps/alerts/kill switch, unit economics at 100/1k/10k.
- **Robustness/scaling:** failure modes, retries/idempotency, degraded mode, rollback, DB indexes/query plans, what breaks at 10×.
- **WNI emotional/physical experience:** contextual inquiry/ride-alongs, diaries, body map, interviews, accessibility, native/punch-down review. Field evidence, not stereotypes.
- **Legal/licence:** terms allow game/derived-data/commercial use; attribution; tax; consumer/subscription rules.

Minimum deliverables: research brief + source log + ADR + benchmark + cost model + security note + WNI experience note (or an explicit approved gap). Volatile facts expire; a stale brief is a red gate. Stop and ask if a fact cannot be verified, a licence is unclear, or the cost/security impact is unknown.

See [`research/PROTOCOL.md`](docs/games/pejuang-nafkah/research/PROTOCOL.md) and the [ADR index](docs/adr/README.md).

## 3. Source of truth (read in this order)

1. `docs/games/pejuang-nafkah/specs.md` — what and why; MUST requirements; release criteria.
2. `docs/games/pejuang-nafkah/design.md` — feel, controls, art, web, monetization.
3. `docs/games/pejuang-nafkah/brand.md` — slogans, Bang Nafkah voice, humour guardrails.
4. `docs/games/pejuang-nafkah/research/PROTOCOL.md` — research tiers, lenses, evidence, stop rules.
5. `docs/adr/README.md` — decision records; start with ADR-0001.
6. `docs/games/pejuang-nafkah/plan.md` — phases, gates, evidence, risks.
7. `docs/games/pejuang-nafkah/architecture.md` — stack, data, payments, security, deploy.
8. `docs/verification/README.md` — how to prove your work.
9. `docs/games/pejuang-nafkah/status.md` — current truth.
10. `apps/platform` and `services/api` — the pre-alpha landing page and waitlist implementation.

If two documents conflict, stop and ask. If code conflicts with a MUST, the doc wins until the user approves a change.

## 4. Non-negotiable product constraints

- **One-hand, portrait-first, offline-tolerant.** A run must be playable on a moving train with one thumb and no network.
- **Free is one chosen route, complete.** Do not cripple it, add ads, energy, loot boxes, or pay-to-win. Free players can change route once within 14 days; after that All Maps is required.
- **Paid = All Maps + Live + cosmetics.** All Maps Rp 79,000 once; Live Rp 49,000/month (Phase 2) includes live traffic/weather/incidents + estimated crowding + planner. All Maps includes Phase 3 cities; Live is optional and cancellable. Prices gross; tax treatment confirmed by an accountant.
- **Mayar is the only payment provider.** Never add another provider without a written decision. Mayar webhooks have no documented signature: verify via API and never grant from the payload.
- **Server owns value.** Prices, entitlements, paid content, subscription state, and leaderboard scores are server-enforced. The client is untrusted.
- **Real place names, original branding.** No official KAI/TransJakarta/JR logos, trade dress, or copied announcements.
- **Data has a date.** Fares/stations/schedules are versioned content, never hard-coded.
- **Privacy by design.** No NIK, phone, address, precise location, contacts, ad IDs, or ad trackers.
- **Tone:** dry, warm, self-deprecating; never misery porn or punching down. Series line: **“Susahnya nyata, dramanya gratis.”** Game line: **“Berangkat. Berjuang. Sampai. Gitu aja terus setiap hari.”** Follow `brand.md`; joke at the situation/system/self, not at victims.
- **Drama is core, rare, real-basis, fair.** Major drama is not every run; every card needs `realBasis`, ≥2 sources, a `fictionalised` note, and sensitivity review. No real recent tragedy, victims, graphic injury, or identity blame. Drama is never paid or gacha. See [ADR-0005](docs/adr/0005-drama-system.md).
- **Sharing is local and private.** Share cards use fixed fields + corridor-level location only; no upload, no public feed/UGC, no precise home/work pin, no PII.
- **Daily drama is candidate-only; no auto-publish.** The 00:00 WIB job may research and draft 3–10 anonymous candidates. The owner approves every card and the final pack; revisions never inherit approval. The generator has no production publish credential. No names/faces/voices/usernames/precise locations/minors/victims/active legal cases/politics/religion/ethnicity. See [ADR-0006](docs/adr/0006-daily-drama-pipeline.md) and [runbook](docs/runbooks/daily-drama.md).
- **Performance:** 60 fps target / 30 fps floor; 60 fps marketing motion with reduced-motion fallback.
- **Live data honesty:** traffic/weather/incidents may be labelled Live; crowding/transit delay are estimated unless an operator feeds them. Never fake live data; freeze a snapshot for each scored run.
- **Landing honesty:** the site must say pre-alpha, show what exists, and never imply the game is playable or payments are live.
- **Waitlist privacy:** only email + consent + source + hashed IP; no ad trackers; no email enumeration.

## 5. Security invariants

Never:

- trust a client-supplied amount, price, entitlement, score, or role;
- expose `MAYAR_API_KEY`, TomTom/BMKG provider keys, OAuth secret, DB URL, session/JWT keys, or Resend key to the client;
- grant an entitlement from a redirect URL or `resultCode` alone;
- process a callback without server API verification and amount/merchant/product/order checks;
- remove or weaken rate limits, CSP, authz checks, or idempotency to make a test pass;
- commit `.env`, keys, tokens, personal data, or production dumps;
- log emails, tokens, cookies, or full IPs;
- use `eval`, `unsafe-inline` scripts, wildcard CORS, or unreviewed third-party scripts;
- let the daily-drama generator publish, hold production credentials, or feed personal data/social posts into prompts;
- set `AUTO_PUBLISH_DAILY_DRAMA=true` or bypass the owner approval record.

Always:

- verify Mayar state by server API re-fetch (payload is untrusted); use timing-safe compare only if Mayar adds a signature;
- make payment/entitlement changes transactional, idempotent, and audited;
- scope every query by the session user (or admin role);
- use the shared Zod contracts;
- pin dependencies and GitHub Actions (SHA), keep the lockfile;
- test the abuse case, not just the happy path;
- require an approval ID + content hash + 2FA for daily-pack publish; verify signature/checksum and fallback.

## 6. Phase workflow

1. Read the phase scope, acceptance criteria, current research brief/ADR, and source freshness.
2. Restate the smallest vertical slice in the issue/PR.
3. Add tests first. If implementation reveals a stale/contradicted fact, stop and re-run the research gate.
4. Implement only that slice.
5. Run `pnpm verify` (or the phase subset).
6. Inspect screenshots/video/perf; a green test is not enough.
7. Fix and repeat. Stop if a product decision is missing.
8. Update `status.md` and evidence.
9. Self-review security/privacy/accessibility/performance/cost/source freshness.
10. Do not claim done without evidence.

**Do not start a new phase with a red gate.** Do not disable a gate to pass. Do not implement beyond the phase scope because it is “easy”.

## 7. Commands (target contract)

```bash
pnpm install --frozen-lockfile
pnpm verify:docs        # markdown + links + scaffold (works now)
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm test:perf
pnpm test:security
pnpm verify:content
pnpm build
pnpm verify             # orchestrates all active gates
```

Today: docs/scaffold, `@wni/platform` build/check, and `@wni/api` build/test exist. Game, E2E, payment, and content gates do not yet exist. When adding a package, add its scripts to the root pipeline; never silently skip.

## 8. Code standards (when implementation starts)

- TypeScript strict; no `any` in domain code without a comment and a reason.
- `sim/` is deterministic, pure, and free of DOM/Three.js; no `Math.random`, `Date.now`, or `performance.now` inside it (inject clock/seed).
- `render/` reads sim state; never owns gameplay truth.
- React HUD updates at 10 Hz, not every frame; no allocation in the render loop.
- Zod schemas in `packages/contracts` for every API boundary.
- Migrations are expand/contract; no destructive change in the same release.
- Tests name the requirement ID (e.g., `PAY-04 duplicate callback`).
- Prefer boring, readable code over clever abstractions.
- No new dependency without checking licence, size, maintenance, and security.
- Every asset has a licence/source note.

## 9. Content standards

- Every route/station/rule has `sourceIds`, `retrievedAt`, `confidence`, `effectiveFrom`.
- Every drama card has `realBasis`, ≥2 `sourceIds`, `fictionalised`, `sensitivity`, rarity/conditions/choices, and a share headline; no source or sensitivity review, no card.
- Daily drama cards are anonymous and owner-approved; no card publishes without a per-card approval and a final pack approval.
- Station order, door side, fares, and odd-even hours must be verified against current sources before content lock.
- No real recent tragedy, no real victims, no official logos, no copied PA audio.
- Native Indonesian review for player-facing copy; English translation for UI.
- A content change is a versioned release; old runs keep their version.

## 10. What to ask the user

Stop and ask when:

- a MUST requirement is ambiguous or conflicts with another doc;
- a product/pricing/monetization decision is missing;
- a security/privacy tradeoff is not covered;
- a real-world fact cannot be verified, sources conflict, or research freshness has expired;
- a phase gate is red and the fix requires scope change;
- you need credentials/access/DNS/Mayar KYC.

Do not guess on money, privacy, legal, or real-world accuracy.

## 11. Git & deploy

- Do not commit or push unless the user asks.
- Do not run production migrations/deploys without explicit approval.
- Keep commits small and describe the phase/requirement.
- Deploy only through the guarded GitHub Actions workflow.
- After a deploy/incident, update `status.md` and the relevant runbook.

## 12. Map

```text
docs/games/pejuang-nafkah/   specs, design, brand, plan, architecture, status, research (protocol + briefs)
docs/adr/                    architecture decision records (ADR-0001 research-first)
apps/platform/               pre-alpha landing page; account/checkout later (Phase 4)
games/pejuang-nafkah/        Vite + Three.js game (Phase 1)
services/api/                Fastify + Postgres + Better Auth + Mayar + live data (Phase 2/5)
packages/                    gamekit, ui, contracts, content-schema, config
data/                        raw/normalized real-world content
infra/                       Caddy, compose, cloudflared, systemd
docs/verification/           evidence contract
docs/runbooks/               deploy, payments, backup, incident, privacy
```

## 13. Definition of done (short)

All in-scope MUSTs pass; research brief/ADR and source freshness are current; evidence exists; no P0/P1; performance/security/privacy/accessibility/cost gates green; `status.md` updated; user accepts. “It runs” is not done.
