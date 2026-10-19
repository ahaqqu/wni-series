# Daily drama pipeline — research and pre-flight plan

**Status:** design direction + research plan. **Not built, not approved for production, no source/provider selected.**
**Date:** 2026-10-19
**Companions:** [ADR-0006](../../../adr/0006-daily-drama-pipeline.md) · [ADR-0005](../../../adr/0005-drama-system.md) · [drama system](2026-10-drama-system.md) · [design.md](../design.md) · [architecture.md](../architecture.md)

> The cadence may be daily; the **approval is always human**. The agent can research, draft, and regenerate. It cannot publish, and it cannot put a real person's name, face, or private life into the game.

---

## 1. Questions to answer before implementation

1. **Sources:** which news APIs/RSS/official feeds allow commercial use, storage, and transformation into a game? What are the attribution/redistribution limits? Which social-platform “trend” signals are allowed without scraping post content or personal data?
2. **Truth:** how do we confirm a “viral drama” happened (≥2 independent sources), avoid hoaxes/misinformation, and date the claim?
3. **Law:** defamation (UU ITE/PDP), privacy (UU PDP), copyright, platform ToS, consumer/content rules; is a fictionalised, anonymous card safe? What records prove due diligence?
4. **AI:** which model/provider terms allow this use, no training on our data, low retention, region/residency, and a cost cap? How do we keep personal data out of prompts?
5. **Anonymisation:** what automated checks (NER/PII, names, faces, locations, minors) and human checks are needed? What is the false-negative risk?
6. **Approval UX:** how does the owner review, select, comment, regenerate, and approve a pack quickly on a phone? What is the SLA and fallback?
7. **Cost/ops:** cost per day at 1/3/10 cities, source calls, model tokens, storage/egress, review time; what breaks at 10×?
8. **Failure:** what happens if research fails, the model is down, the owner is unavailable, or a card is published then found harmful?
9. **Game integration:** how does a daily pack version pin to a run, cache offline, and fall back without breaking determinism?
10. **Transparency:** how do we label AI-assisted, human-approved, fictionalised content without claiming “live news”?

## 2. Source policy (to validate)

**Allowed after review:** licensed news APIs/RSS; official notices (BMKG, BPBD, Dishub, Polda, operator statements); public reports from reputable outlets; internal editorial tips with source URLs.

**Not allowed without a written licence/ToS approval:**

- scraping X/TikTok/Instagram/Facebook/WhatsApp/Telegram/private groups;
- storing posts, usernames, profile photos, or comment threads;
- using “viral” as a synonym for “true”;
- republishing copyrighted captions/videos/photos;
- processing personal data of bystanders, victims, minors, or public figures beyond what is necessary and lawful.

**Lookback:** default last 72 hours (today/yesterday/last few days), maximum 7 days; older events need an explicit exception.

**“Viral” definition:** a topic/event with measurable public attention (multiple reputable reports, official notice, or licensed trend signal) — not a single anonymous post. The card is based on the **event**, not the post.

### 2.1 Candidate: social signal ingestion (proposed, not approved)

Owner directive (2026-10-19): X, TikTok, and Threads are where viral drama starts and must be in scope. [ADR-0008](../../../adr/0008-social-signal-ingestion.md) records this as a **proposal only** — ADR-0006 and the no-scraping rule stay in force until it is accepted.

What the research has established so far (checked 2026-10-19):

- **No platform sells commercial keyword search.** X is pay-per-use/enterprise with AI-use restrictions; TikTok's Research API is academic; Threads' API has no general search. Commercial search only exists through scraping brokers.
- **Brokers to compare:** [treg](https://treg.to/web-access) (router over 113 providers; X 167 endpoints, TikTok 193, Threads 18; $0.0001–0.0015 per call; open source), [EnsembleData](https://ensembledata.com/pricing) (8 platforms, Threads keyword search, $100/month minimum), [Apify](https://apify.com/pricing) ($19/month + per-result), Bright Data (enterprise), NewsWhip/Dataminr (licensed, enterprise, monitoring-only).
- **Estimated cost at our volume** (3 platforms × 10 queries/day): treg ≈ $2–10/month; Apify ≈ $20–40/month; EnsembleData ≈ $100/month. Money is not the constraint.
- **Threads is the weak platform:** treg carries only 18 Threads endpoints and its social-listening catalogue lists keyword search for X, TikTok, LinkedIn, and Reddit but not Threads. Verify before relying on it.
- **The legal position does not improve with a broker.** EnsembleData's terms make the client "solely responsible" for compliance and require indemnification. Scraping still breaches platform terms; the broker moves the risk, it does not remove it.

Candidate design, if the owner later accepts the risk: signal-only storage (topic, platform, first seen, velocity, language, URL hash — no text/usernames/media), news confirmation within 24 h before a card is eligible, per-platform caps and kill switches, and no change to the approval flow.

**Blocking questions** (see ADR-0008): Indonesian-language coverage, Threads search feasibility, measured reliability, written legal opinion on ToS/copyright/UU PDP/defamation, vendor retention and sublicensing terms, hoax rate, enforcement risk, and exit path. A 5-day trial must run before acceptance.

## 3. Daily workflow

```text
00:00 WIB  scheduled research job (Asia/Jakarta)
00:00–00:20 source fetch → dedupe/cluster → facts + citations → risk screen
00:20–00:35 AI drafts 3–10 anonymous candidates (configurable) → schema validation → PII/name/banned-topic checks
00:35      candidate pack in admin review queue (never public)
owner      select / reject / comment / request rewrite
agent      new revision → checks → queue again
owner      approve each card → approve final pack
publish    signed pack only after explicit approval; game serves it
fallback   no approval by morning → last approved pack / evergreen bank
```

Times are targets, not promises. The publish step is event-driven, never a timer that bypasses approval.

## 4. Candidate requirements

Each candidate must include:

- `eventSummary` (facts only, cited), `sourceIds` (≥2 independent where possible), `retrievedAt`, `confidence`;
- `whyItMatters` / `whyItIsFunny` without mocking victims;
- `anonymisation`: what was removed/generalised; no names, roles that identify one person, faces, voices, minors, precise locations;
- `riskFlags`: death/injury, legal case, politics, religion/ethnicity, health, minors, sexual content, harassment, disaster, privacy;
- `fictionalised` note: what is invented/composited;
- gameplay: family, rarity, conditions, telegraph, ≥2 choices, one viable out, effects, Bang lines;
- share headline + card text;
- `sensitivityReview` placeholder for human sign-off;
- `sourceSnapshot` metadata (URL, date, licence) — not copied article text.

Automated rejects: named person detected, PII pattern, banned topic, single source for a factual claim, no location verification, copied text above a short factual phrase, no viable out, duplicate of an already-used card without a new angle.

## 5. Approval and audit

- States: `draft → candidate → selected → revision_requested → approved → pack_approved → scheduled → published`; plus `rejected`, `retired`.
- Each revision is immutable and linked to its parent; comments are stored with author/time; approval records include reviewer, timestamp, content hash, checklist answers.
- A pack publishes only if **every included card is approved** and the owner explicitly approves the pack.
- Publishing requires Cloudflare Access + 2FA; the generator has no publish credential.
- Audit log is append-only; a correction/takedown creates a new pack version and a public changelog note.
- The owner can approve from a phone: preview card, source list, risk flags, diff, comment box, approve/reject.

## 6. Legal/privacy checklist

- [ ] DPIA-lite: no personal data in prompts, source captures, or cards; retention for drafts/reviews defined.
- [ ] Defamation review: anonymous, fictionalised, no identifiable person, no accusation of crime, no “true story about X”.
- [ ] Copyright: facts only; no copied captions/photos/video; source links internal.
- [ ] Platform ToS: no scraping; licensed APIs/RSS only.
- [ ] PDP: lawful basis, minimisation, retention, processor terms, cross-border, DSR path.
- [ ] No recent tragedy (default 12 months), no active legal proceedings, no minors, no victims.
- [ ] No politics/religion/ethnicity/health misinformation/sexual content/self-harm/terrorism.
- [ ] AI disclosure + human review label; correction/takedown path.
- [ ] Native Indonesian + sensitivity reviewer sign-off before the first live pack.

## 7. AI-provider checklist

- Contract/terms allow commercial content generation; no training on our inputs; low retention.
- Data residency/cross-border disclosed; no personal data sent.
- Model output schema/JSON mode; deterministic-ish settings; version pinned.
- Cost per candidate/pack; rate limits; fallback model; kill switch.
- Prompt-injection resistance: source text is data, never instructions; strip HTML; no tool access from source content.
- Evaluation set of 20 synthetic/real-anonymised events; measure hallucination, naming, banned-topic leakage, tone.

## 8. Dry run

Before production:

1. Pick 5 consecutive days; generate candidates from allowed sources.
2. Owner reviews/comments/approves at least 3 packs; measure time-to-approve and revision count.
3. Fact-check sample: 100% of factual claims have ≥2 sources or an explicit “single-source” warning that blocks publish.
4. Anonymisation test: no names/PII in 100% of approved cards (automated + human).
5. Legal/sensitivity review of the 3 packs.
6. Failure injection: source down, model down, owner unavailable, pack rejected — game falls back.
7. Cost report for 1/3/10 cities.

## 9. Stop conditions

- No licensed source or the only source is social scraping.
- No written AI-provider terms acceptable for privacy/retention.
- Legal review cannot confirm defamation/PDP safety.
- A candidate cannot be anonymised without losing the story.
- Approval takes longer than the cadence can support and fallback is not acceptable.
- Automated checks miss a name/PII in the dry run.
- The owner cannot review on a phone or the audit trail is incomplete.
- Cost per day is unbounded or the fallback is untested.

## 10. Deliverables before Phase 2D

- Source registry + licences/ToS evidence.
- AI provider ADR + data-processing terms.
- Legal/privacy note and DPIA-lite.
- Approval UI prototype (mobile) + audit schema.
- 5-day dry-run report with owner approvals/comments/revisions.
- Cost model at 1/3/10 cities.
- Failure/fallback test.
- Updated ADR-0006 from “design” to “build approved”.

## 11. Current status

- Direction accepted in ADR-0006; no implementation.
- No source/provider selected; no legal review; no dry run; no approval UI.
- Phase 1 uses an evergreen curated drama bank. Daily generation is **Phase 2D**, after the research gate and the owner's explicit approval.
