# ADR-0006 — Daily drama: AI-assisted research, human approval, no auto-publish

- **Status:** accepted as design/architecture; **not implemented**
- **Date:** 2026-10-19
- **Owners:** WNI Series
- **Research brief:** [2026-10 daily drama pipeline](../games/pejuang-nafkah/research/2026-10-daily-drama-pipeline.md)
- **Evidence:** user direction (2026-10-19); [ADR-0005](0005-drama-system.md); legal/privacy review still pending
- **Revalidate:** before Phase 2D implementation, and on any AI provider, source, platform-ToS, or privacy-law change

## Context

The user wants a **daily drama** layer: every midnight Jakarta time, an agent researches a drama that went viral today/yesterday/last few days, writes it into playable content, and the game has something new that day. The architecture must accept new content easily, and the agent should be creative enough to turn a real event into a good card.

The same request also sets hard boundaries:

- ethics and law come first;
- no privacy breach, no names — anonymise;
- **no automatic production publish**;
- the owner approves every drama, can comment, the agent regenerates, and the owner approves again;
- final production only after all included dramas are approved.

This is a high-risk content pipeline. “Viral” material is often unverified, defamatory, identifying, or built on someone's worst day. A fully automated loop would create legal, privacy, and human-harm risk faster than a human can review it. The design must make automation **useful but powerless to publish**.

## Decision

Build a **human-in-the-loop daily drama pipeline** with these invariants:

1. **Midnight generation, candidate-only.** A scheduled job runs at **00:00 Asia/Jakarta**, researches recent public events (default last 72 hours, max 7 days), and writes a **draft candidate pack**. It never writes the production content bucket and never marks anything published.
2. **Source allowlist, no social scraping.** Research uses licensed news APIs/RSS, official notices (BMKG, BPBD, Dishub, Polda, operator statements), and public reports approved in the source registry. No scraping of X/TikTok/Instagram/Facebook/private groups, no raw posts, no personal profiles, no faces, no usernames. “Viral” may be a **signal** (trend/topic metadata) only if the source's terms allow it; otherwise use reputable reporting.
3. **AI drafts; humans decide.** The agent may produce a configurable number of candidates/day (default 3–10; the owner can request more within cost caps) with facts, citations, confidence, risk flags, anonymisation notes, gameplay choices, Bang lines, and a share headline. AI output is a proposal, not truth.
4. **Anonymity by default.** No named natural persons, no roles that identify one person, no voices/photos, no precise home/work locations, no minors, no victim details, no active legal case, no political/religious/ethnic blame, no death/sexual violence/self-harm/terrorism/communal conflict, no health misinformation, no copied captions.
5. **Approval state machine.** `draft → candidate → selected → revision_requested → approved → pack_approved → scheduled → published` (plus `rejected`, `retired`). Each card needs an approval; a pack publishes only when the owner explicitly approves the final pack containing only approved cards.
6. **Comment → regenerate → re-approve.** Owner comments create a new immutable revision linked to the previous one. Regeneration never inherits approval; the new revision starts at `candidate`.
7. **No auto-publish.** `AUTO_PUBLISH=false` is the default and a deploy-time invariant. The generator cannot call the publish endpoint. Publishing requires an authenticated owner action (Cloudflare Access + 2FA), an approval record, a content hash, and an audit entry. CI/CD cannot promote an unapproved pack.
8. **Fallback, never a broken morning.** If no pack is approved, the game serves the last approved pack or the evergreen bank. The daily job failing must not break a run.
9. **Immutable, versioned packs.** Each pack has `packId` (`daily-YYYY-MM-DD`), `contentVersion`, `publishedAt`, `expiresAt`, `approvalId`, and a signed manifest. A run pins the pack version; editing a published pack creates a new version, never mutates the old one.
10. **Transparency.** Game and site disclose: “Drama harian · diinspirasi kejadian nyata, bukan berita; nama dan detail disamarkan; dibantu AI, disunting dan disetujui manusia.” Corrections/takedowns are possible without a code deploy.
11. **Legal/privacy review before build.** A DPIA-lite, defamation review, copyright/platform-ToS review, AI-processor terms, retention rules, and a dry-run approval test are required before Phase 2D.
12. **Bounded cost.** Daily candidate/token/source-call caps, a monthly AI/research budget, alerts, and a kill switch (`FEATURE_DAILY_DRAMA=false`).

## Consequences

- **Positive:** daily freshness, a creative pipeline, strong human control, an auditable approval trail, and a clear legal story. The owner can scale from “a few candidates” to “many candidates” without changing the publish gate.
- **Negative / accepted tradeoffs:** the owner is a daily bottleneck; research and review take time; some viral stories are unusable; daily cadence can fail and fall back; AI cost and vendor risk.
- **Security/privacy:** no personal data in prompts/source captures; no names/faces; admin-only review; approval audit; least-privilege publish token; no public candidate feed.
- **Performance/scaling:** the game only downloads a small signed JSON pack; no AI call at runtime. One pack/day/city; candidate generation is bounded. At 10× cities, generate per city with a shared review queue; cost scales linearly and must be capped.
- **Legal/ethics:** anonymous, real-basis, fictionalised, no recent tragedy, no active proceedings, no identity blame, human fact-check, correction/takedown. A bad card can be disabled by ID.
- **Rollback:** revert to the previous pack or evergreen bank; disable the feature flag; revoke the approval/publish path.
- **Operational:** a missed midnight run is a fallback, not an incident; a failed approval is a skipped day, not an auto-publish.

## Alternatives considered

| Option                                                 | Why rejected                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Fully automated research → publish                     | Unacceptable legal/privacy/human-harm risk; a model cannot verify truth or consent.  |
| Human writes every card manually                       | Too slow for daily cadence; keep as fallback/evergreen, use AI for drafts.           |
| Scrape social media for “viral” posts                  | Platform ToS/copyright/privacy risk; personal data and unverified claims.            |
| Approve once, auto-publish future cards                | Approval is per card/pack; a template approval cannot cover a new real event.        |
| Publish a pack with a mix of approved/unapproved cards | Violates the owner's “approve all” requirement; keep the pack gate strict.           |
| No daily layer, only evergreen bank                    | Loses the freshness the user asked for; keep evergreen as fallback, not the ceiling. |

## Evidence summary

- User direction, 2026-10-19 (daily cadence, AI research/writing, owner approval, comments/regeneration, no auto-publish, anonymity, ethics/legal).
- [ADR-0005](0005-drama-system.md) real-basis/sensitivity rules.
- Research plan: [2026-10 daily drama pipeline](../games/pejuang-nafkah/research/2026-10-daily-drama-pipeline.md).
- **Open:** source licences/ToS, AI provider data terms, defamation/PDP review, approval UX, cost per day, dry-run evidence.

## Revalidation

Recheck before Phase 2D and whenever the AI provider, news source, platform terms, privacy law, or approval workflow changes. If any of these is unclear, daily generation stays off; the game uses the approved/evergreen pack.
