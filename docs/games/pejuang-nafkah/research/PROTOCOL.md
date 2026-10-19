# Research-first protocol

**Applies to:** WNI Series platform and every game, including Pejuang Nafkah.
**Status:** mandatory process gate, adopted 2026-10-19.
**Companion:** [brand.md](../brand.md) · [specs.md](../specs.md) · [architecture.md](../architecture.md) · [ADR index](../../../adr/README.md)

> **Rule:** no detailed plan, estimate, dependency choice, architecture change, content lock, or implementation starts until there is a **current research brief**, a **decision record** for the choice, and **evidence** for the facts that could break it.

Research is not a one-time phase. It is a **pre-flight gate for every phase**, and a **revalidation trigger** whenever a provider, price, law, dependency, or city changes.

---

## 1. What counts as “deep research”

Deep research is not “I searched once” or “the model remembers”. It is a timeboxed investigation that:

1. names the decision it informs;
2. uses current primary sources (official docs, operators, regulators, price pages);
3. tests the riskiest assumption with a benchmark, quote, licence, or field observation;
4. records rejected alternatives and unknowns;
5. produces an artifact another agent can audit.

If a fact cannot be verified, the answer is **stop and ask**, not “probably”.

## 2. Research tiers and timebox

| Tier                      | Use for                                                                       | Minimum effort | Output                                                              |
| ------------------------- | ----------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------- |
| **R0 — fact check**       | Copy, one fare, one date, one link                                            | ≤2 hours       | Source note in the research file/PR                                 |
| **R1 — feature research** | New feature, API, UI pattern, city content, content pack                      | 1–2 days       | Brief + source log + ADR if a choice is made                        |
| **R2 — deep research**    | Payments, live data, stack change, new city, scaling, security-sensitive work | 3–5 days       | Brief + source log + ADR(s) + benchmark + cost/security/UX evidence |

Timeboxing is not permission to skip a lens. If the box is too small, **narrow the scope** or **stop**.

## 3. Required lenses

Every R1/R2 brief must cover these explicitly. Mark “not applicable” with a reason.

| ID           | Lens                     | Questions                                                                                                                                                                                      |
| ------------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R-TECH**   | Latest technology        | Current stable versions? Official release notes/changelog? Support/EOL? Licence? Security advisories? Bundle/runtime cost? Benchmarked on our reference devices?                               |
| **R-DATA**   | Accurate real-world data | Primary operator/regulator source? Effective date? Two independent confirmations for volatile facts? Licence/attribution? Does it match the corridor/city?                                     |
| **R-SEC**    | Security                 | Threat model updated? Authn/authz? Payment/entitlement invariants? Secrets? Supply chain? Abuse/rate limits? Privacy/PDP?                                                                      |
| **R-PERF**   | Performance              | Budgets (p95, FPS, LCP/INP/CLS, memory)? Reference low/mid/high devices and network? Load test at 2× peak? Stale/offline behaviour?                                                            |
| **R-COST**   | Cost control             | Provider price from the source and date? FX assumption? Worst case (10×)? Unit economics at 100/1k/10k? Cap/alert/kill switch? Mayar fees?                                                     |
| **R-ROBUST** | Robustness               | Failure modes, retries/backoff, idempotency, cache/stale, degraded mode, rollback, observability, on-call path?                                                                                |
| **R-SCALE**  | Scaling                  | 10×/100× data and traffic? DB indexes/query plans? Queue/cache/rate limits? Cost per user? What breaks first?                                                                                  |
| **R-WNI**    | WNI experience           | How does this feel **emotionally and physically**? Heat, rain, crowding, standing, one hand, fatigue, dignity, safety, accessibility, money stress? Field evidence, not just desk assumptions? |
| **R-LEGAL**  | Legal/licence            | Terms allow this use (game/derived data/commercial)? Attribution? Tax? Consumer/subscription rules? PSE/IGRS?                                                                                  |

## 4. Source quality and freshness

**Source order:** primary operator/regulator/provider → official documentation → reputable independent reporting → community reports. Community sources are leads, not proof.

For every volatile claim record:

```text
claim | value | source URL | source type | retrievedAt | effectiveFrom | confidence | cross-check
```

Minimum freshness:

| Fact                                                   | Revalidate before                                          |
| ------------------------------------------------------ | ---------------------------------------------------------- |
| Provider price / quota / API terms                     | **30 days**; immediately on a price/terms change           |
| Fares, station order, schedules, door side, road rules | **30 days** before content lock; **7 days** before release |
| Tax/law/consumer rules                                 | **90 days**; immediately on a regulation change            |
| Framework/runtime versions and support                 | **each phase**; before a dependency upgrade                |
| WNI field/UX research                                  | **6 months**, or when the corridor/city/audience changes   |
| Market/competitor scan                                 | **6 months**                                               |

Use `retrievedAt`, `effectiveFrom`, `expiresAt`, and `confidence` in content packs. **Do not use model memory as a source.**

## 5. WNI experience research (emotional + physical)

Desk research is not enough for a game about bodies in transit. Before locking a commute beat, do at least one of:

- **Contextual inquiry / shadowing:** ride the corridor with 4–8 commuters (with consent), observe standing, heat, rain, crowding, transfers, phone use, and one-hand constraints.
- **Diary study:** 7–14 days of short entries (time, weather, wait, cost, body, mood, one good/funny moment). No precise location or unnecessary PII.
- **Body map:** where does the commute hurt, tighten, or exhaust? What can one thumb reach while holding a strap?
- **Emotional interview:** “When did you feel like a number?”, “When did you laugh?”, “What would feel disrespectful if a game showed it?”
- **Accessibility check:** low-end Android, small screen, reduced motion, screen reader, disabled/elderly/pregnant commuters where relevant.
- **Tone/punch-down review:** 3+ native Indonesian readers; check who the joke targets.

**Ethics:** informed consent, compensation, right to withdraw, no faces/voices without release, redact PII, no covert recording, no trauma mining. Store anonymised notes only.

**Synthesis:** journey map + physical constraints + emotional beats + implications for mechanics, copy, and humour. State sample size and limitations; do not claim statistical significance from 6 people.

## 6. Deliverables

Every R1/R2 research cycle produces:

1. **Research brief** (`docs/games/<game>/research/YYYY-MM-<topic>.md`): question, decision, method, findings, options, recommendation, risks, unknowns, sources.
2. **ADR(s)** (`docs/adr/NNNN-*.md`) for architecture/security/cost choices; context, decision, consequences, rejected options.
3. **Source log** with URLs, dates, type, claim, confidence.
4. **Benchmark sheet** with device/network/tool/command and raw results.
5. **Cost model** with provider prices, FX/date, worst case, caps, and cost per user at 100/1k/10k.
6. **Security/privacy note** updating the threat model and data map.
7. **WNI experience note** with method, participants (anonymised), themes, quotes (consented), limitations.
8. **Data validation sheet** for fares/stations/schedules/rules/geometry, with `effectiveFrom`.
9. **Gate decision:** go / go with limits / no-go, and what would change it.

## 7. Gate checklist

A detailed plan or implementation PR is blocked until all are true:

- [ ] Research brief linked; decision and unknowns explicit.
- [ ] Sources are current, dated, and primary where possible.
- [ ] At least two independent confirmations for volatile facts; licence/attribution recorded.
- [ ] Latest tech versions/support/security checked against official sources.
- [ ] Threat model and privacy data map updated; no new unchecked trust boundary.
- [ ] Performance/load benchmark run on reference hardware; budgets stated.
- [ ] Cost model includes worst case, FX/date, caps, and unit economics.
- [ ] Failure/degraded/rollback plan and observability defined.
- [ ] Scaling assumption stated; what breaks at 10× is known.
- [ ] WNI emotional/physical research done, or an explicit, approved gap.
- [ ] Native Indonesian/punch-down review planned for player-facing copy.
- [ ] ADR accepted; rejected alternatives recorded.

## 8. Stop rules

Stop and ask the user when:

- a fare/station/schedule/road rule is unverified or conflicts across sources;
- a provider licence/terms do not clearly allow the use;
- the cost model has no hard cap or the worst case is unaffordable;
- security/privacy impact is unknown or requires accepting a new trust boundary;
- the experience claim has no field evidence and would drive a core mechanic;
- the “latest” version/price cannot be confirmed today;
- research freshness has expired and the phase is about to start.

Do not paper over an unknown with a confident paragraph.

## 9. Evidence and revalidation

- Store briefs/ADRs in git; store raw benchmark JSON, redacted notes, and source snapshots under `artifacts/research/<phase>/<date>/` (gitignored).
- Link the brief/ADR in the PR and in `status.md`.
- Revalidate at every phase start and when: provider price/terms change, API version changes, regulation changes, a new city/corridor is added, a major dependency upgrades, an incident exposes a wrong assumption.
- A stale brief is a **red gate**, not a historical note.

## 10. Anti-patterns

- “I know this” / model memory as a source.
- One blog post or content farm for a fare, schedule, price, or law.
- Benchmarking only on a fast laptop; no low-end device/network.
- “We’ll add security/cost caps later.”
- A cost estimate without worst case, FX/date, or provider quote.
- A scaling claim without a query plan or load test.
- Designing “what Indonesians feel” from stereotypes instead of observing commuters.
- Punching down and calling it “dark humour”.
- Copying a competitor’s feature without checking licence, cost, or fit.
- Letting research become an infinite excuse not to ship; timebox and decide.

---

## Appendix A — Research brief template

```markdown
# Research brief — <topic>

**Date:** YYYY-MM-DD
**Tier:** R0 / R1 / R2
**Decision it informs:**
**Owner:**
**Expires/revalidate:**

## Question

## Method and sources

## Findings (with dates)

## Options and tradeoffs

## Recommendation

## Security / privacy

## Performance / scaling

## Cost (source date, FX, worst case)

## WNI emotional/physical evidence

## Unknowns and stop conditions

## Sources
```

## Appendix B — ADR template

Use [`docs/adr/0000-template.md`](../../../adr/0000-template.md). An ADR is required for stack, provider, data store, auth, payments, hosting, live-data source, cost cap, and any irreversible content/licence choice.

## Appendix C — Minimum benchmark record

```text
device / browser / network:
commit / build:
command:
p50 / p95 / p99:
FPS p1 / p0.1, memory peak:
LCP / INP / CLS:
error rate / provider calls / cost:
pass/fail against budget:
```
