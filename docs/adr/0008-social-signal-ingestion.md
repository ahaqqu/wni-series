# ADR-0008 — Social signal ingestion for daily drama (proposed, not accepted)

- **Status:** **proposed — candidate only.** Not accepted, not approved for implementation, and it does **not** change the current rules.
- **Date:** 2026-10-19
- **Owners:** WNI Series
- **Research brief:** [Daily drama pipeline](../games/pejuang-nafkah/research/2026-10-daily-drama-pipeline.md) §2.1
- **Evidence:** treg catalogue snapshot (2026-10-19), EnsembleData pricing and terms (2026-10-19), TinyFish docs (2026-10-19), [ADR-0006](0006-daily-drama-pipeline.md)
- **Revalidate:** on trial results, or any vendor price/term/platform-policy change

> **Read this first.** This record exists so the owner's directive ("X, TikTok and Threads are where viral drama starts") is written down with its risks, options, and open questions — **not** so it can be built. [ADR-0006](0006-daily-drama-pipeline.md) and the "no social scraping" rule in [AGENTS.md](../../AGENTS.md) remain in force until this ADR is accepted.

## Context

- **Owner directive (2026-10-19):** the daily drama pipeline must draw on X, TikTok, and Threads, because that is where viral drama actually originates.
- **Current rule:** ADR-0006 allows licensed news/official sources only, and explicitly forbids scraping social platforms or storing posts, usernames, and photos. The two positions conflict.
- **Technical fact:** none of the three platforms offers commercial keyword search to third parties. X sells a pay-per-use/enterprise API with AI-use restrictions; TikTok's Research API is academic; Meta's Threads API has no general search. Anything that searches them commercially is a **scraper or a broker of scrapers**.
- **Legal fact:** scraping breaches the platforms' terms. Brokers sell access and shift responsibility to the customer — EnsembleData's terms make the client "solely responsible" and require indemnification. Paying a broker does not create a licence to the content.
- **Why act now:** Phase 2D cannot be researched properly without deciding whether social signal is in scope. Answering that later would waste the news-source work.

## Proposal (candidate, not a decision)

1. **One ingress, many vendors.** Use [treg](https://treg.to/web-access) as the single routing layer: one token, one API shape, provider fallback, per-call billing at provider rates. It is open source and self-hostable, which limits lock-in.
2. **Fallback ladder.** Free first hop (TinyFish via treg's anonymous route) → TikHub / ScrapeCreators / AnyAPI → EnsembleData for Threads if treg's coverage proves insufficient. Fail over on 429/5xx/timeout, never on 4xx.
3. **Signal-only contract.** Persist only `{topic, platform, firstSeen, velocity/engagement, language, sourceUrlHash}`. Post text, usernames, avatars, media, and author IDs are discarded after the extraction step and never enter the candidate store.
4. **News confirms.** A card is eligible only if at least one reputable Indonesian outlet or official source corroborates the event within 24 hours. Social nominates; news verifies. If nothing corroborates, the candidate expires unapproved.
5. **Anonymise as already designed.** No names, faces, voices, precise locations, or identifiable detail; the standard transparency label stays.
6. **Caps and kill switches.** Per-platform daily call cap, per-call cost cap, per-platform disable switch, and a global stop that falls back to the last approved pack.
7. **Approval unchanged.** Owner approval per card and per pack, no auto-publish, signed packs, audit.

## What this ADR deliberately does **not** decide

- which vendor is used, or the monthly budget;
- whether the ToS/indemnity risk is acceptable;
- the retention period for signal rows;
- whether Threads keyword search is feasible at all;
- any implementation detail or schedule.

Those are the outputs of the deep research described below.

## Alternatives to evaluate

| Option | What it is | Why it is still on the table |
| --- | --- | --- |
| **treg (candidate)** | Router across 113 providers; X 167 endpoints, TikTok 193, Threads 18; $0.0001–0.0015/call | Cheapest by an order of magnitude; fallback built in; open source |
| **EnsembleData** | One scraping API for 8 platforms, TikTok/Threads keyword search | Cleanest single API; Threads keyword search exists; $100/mo minimum |
| **Apify** | Marketplace of per-platform Actors, $19/mo + usage | Cheap, mature, per-actor pricing; more integration work |
| **Direct official APIs** | X pay-per-use, TikTok Research, Meta Graph | Sanctioned access; but no commercial search, AI restrictions, and academic-only TikTok |
| **News and official sources only** | Current ADR-0006 policy | Zero legal exposure; misses drama that news has not covered yet |
| **Licensed enterprise feeds** | NewsWhip, Dataminr, Meltwater, Brandwatch | Real platform agreements; enterprise pricing and monitoring-only terms |
| **Self-hosted open-source scrapers** | Crawl4AI, custom workers | No vendor dependency; we then own every legal and operational risk |

## Open questions for the deep research

1. **Coverage:** how well do X/TikTok/Threads search surface *Indonesian-language* local drama, not just national trending topics?
2. **Threads:** does keyword search exist through any broker, at what cost and reliability? If not, is Threads only usable via named accounts?
3. **Reliability:** measured success rate at ~30 calls/day; how often does fallback fire; what is the p95 latency?
4. **Law:** written opinion on platform ToS, copyright/derivative works, UU ITE and UU PDP exposure, and defamation risk for fictionalised cards based on unverified posts.
5. **Vendor terms:** indemnity, data retention, sublicensing, resale, and whether field filtering can enforce the signal-only contract.
6. **Cost:** at 1/3/10 cities including retries and failures; caps and alerts.
7. **Data minimisation:** can we avoid post text entirely at the vendor boundary, or only after ingestion?
8. **Quality:** how many social candidates survive news confirmation; what is the hoax/false-positive rate?
9. **Enforcement risk:** platform blocking, cease-and-desist, or litigation exposure for a small Indonesian merchant.
10. **Exit:** self-host treg, swap brokers, or drop social entirely without rework.

## Trial before acceptance

A **5-day dry run**, no production publish:

- 3 platforms × 10 keywords/day, logged with cost, latency, outcome, and fallback path.
- Count usable candidates, news-confirmed candidates, and rejected/hoax candidates.
- Audit what was stored: prove zero usernames, post text, or media beyond the extraction step.
- One deliberate vendor outage to test failover and the kill switch.
- Compare treg against EnsembleData on the same keyword set.

## Acceptance gate (proposed → accepted)

- [ ] Legal/privacy review signed, with the ToS/indemnity risk explicitly accepted by the owner in writing.
- [ ] Trial produces ≥3 usable, news-confirmed candidates/day at ≤ the agreed monthly cap.
- [ ] Threads path proven, or explicitly descoped with the owner's agreement.
- [ ] Signal-only storage verified; zero usernames/media in the candidate store.
- [ ] Failover, caps, and kill switch demonstrated.
- [ ] ADR-0006 and AGENTS.md amended in the same change that accepts this ADR.
- [ ] Cost model at 1/3/10 cities added to the research brief.

## Consequences if accepted

- **Positive:** drama can be fresher than news; coverage of hyper-local events; one integration instead of many; low marginal cost.
- **Negative:** ongoing ToS and legal exposure that no vendor absorbs; dependency on brokers that can be blocked or disappear; more hoaxes to filter; a permanent operational and reputational risk that news-only sourcing does not have.
- **Security/privacy:** personal data enters the pipeline transiently; minimisation and a hard discard step become security controls, not best practice.
- **Rollback:** disable the social adapters and fall back to news-only; the pack format and approval flow are unchanged.

## Revalidation

Revisit when the trial completes, when a vendor changes price or terms, when a platform changes access or enforcement, or before Phase 2D implementation — whichever comes first. If the research finds a licensed, commercially usable social feed at a sane price, that option supersedes this proposal.
