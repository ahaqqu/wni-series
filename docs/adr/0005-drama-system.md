# ADR-0005 — Drama is a rare, real-basis, fictionalised story layer

- **Status:** accepted
- **Date:** 2026-10-19
- **Owners:** WNI Series
- **Research brief:** [2026-10 drama system and source bank](../games/pejuang-nafkah/research/2026-10-drama-system.md)
- **Evidence:** design review with the user; [_brand.md_](../games/pejuang-nafkah/brand.md); Phase 1 research plan
- **Revalidate:** before drama content lock, and before each city/season release

## Context

The game's first promise was “susah” (the struggle). Playtests and the user's direction show that struggle alone becomes a grind: the player needs something to **retell**. The memorable unit of a Jakarta commute is often not the traffic average but the day something happened: the underpass flooded, a demo closed the road, a small accident turned one lane into a car park, or a stranger started a fight about a queue.

The user's direction (2026-10-19): drama is a **core characteristic and principle**, not an occasional set piece. It should be:

- **rare / irregular**, not every run;
- **real or having really happened** in Jabodetabek, not invented geography or fake news;
- **memorable and funny** — “wah, ada drama apa hari ini?”;
- met by the character with **bercanda dan santai**, not panic;
- **shared** with other people afterwards.

This is also a risk area: real disasters, accidents, and unrest involve real victims, grief, and law. A game that turns those into content can be tasteless, defamatory, or worse. The decision must bound the fiction before content work starts.

## Decision

Adopt **drama as a core, rare, deterministic story layer** with these constraints:

1. **Two tiers, never “every run is chaos”.**
   - **Kejadian** — small, low-stakes absurdities (a queue jump, a broken card reader, a motorbike that won't start). Common texture; not every one is a “drama”.
   - **Drama** — a major disruption that changes the plan (flood, demo, minor accident, station failure, small unrest). Target **~1 in 5 runs**, at most one major drama per run.
   - **Drama langka** — a rarer, once-in-a-while city moment. Target **~1 in 25 runs**, and never a real recent tragedy.
2. **Every drama has a real basis.** Each card must cite at least one documented recurring event or a verified historical incident in the relevant city (flood-prone underpass, permitted demo route, known accident blackspot, operator disruption). Details are **composited and fictionalised**, never a reconstruction of a named real event with victims.
3. **Hard exclusions.** No real recent tragedy (default: within 12 months), no identifiable victims or bystanders, no mass-casualty event, no terrorist attack, no communal/religious/ethnic blame, no graphic injury, no real person's name or likeness, no “funny” framing of a death or disaster. A near-miss is the ceiling for violence.
4. **Fair, not arbitrary.** Drama is selected at run start from the seed, content version, route, time, weather, and conditions; it is **frozen for the run**. It is never a server push mid-run. Every drama has at least two readable responses and one viable “out”; it can cost time, money, or dignity, but cannot make the run unwinnable.
5. **The character carries it with humour and calm.** Bang Nafkah names the absurdity, shrugs, and offers the next move (“Bercanda dulu, panik belakangan.”). The player is never forced to laugh; a serious beat gets warmth or silence.
6. **Drama becomes a story, then a share.** The report card carries a **“Cerita hari ini”** headline and a drama stamp. A local share card (image + text) can be generated on-device and shared via the Web Share API or download/copy. No public feed, no UGC, no stranger chat, no upload in v1, no home/work precise location, no real names.
7. **Drama is never paid content.** It is included in the free route and All Maps; no drama pack, gacha, or “unlock the flood” purchase. Live data may change conditions, not sell drama.
8. **Content lock is blocked until the source bank exists.** The Phase 1 research task must produce a source log with two independent sources per drama family, a sensitivity review, and a frequency/fairness test. Until then this ADR is a design direction, not permission to author final cards.

## Consequences

- **Positive:** a repeatable freshness engine, a natural share loop, a stronger memory of each run, and a brand that owns “susah + drama” rather than generic misery.
- **Negative / accepted tradeoffs:** more content and review work; real-world sourcing is slow; some genuinely dramatic real events are unusable; rarity must be tuned so players don't feel cheated or overwhelmed.
- **Security/privacy:** share cards are generated locally; no server upload, no precise location, no PII. If link sharing is added later it needs opaque IDs, expiry, moderation, and abuse controls.
- **Performance:** drama selection is a pure seeded function; no extra network during a scored run. Share image generation happens after arrival, off the render loop, and must fit the low-end budget (≤150 ms target, fallback to text share).
- **Cost/operations:** no provider cost for drama; content review and native-language review are the cost. No live-news ingestion in v1.
- **Legal/ethics:** real-basis documentation, a sensitivity checklist, and a kill list for excluded events. Takedown/correction path for a card that crosses a line.
- **Rollback:** drama can be disabled by content flag without breaking the run; the report card falls back to the normal story line.

## Alternatives considered

| Option                            | Why rejected                                                                              |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| Scripted set-piece story mode     | Memorable once, stale on replay; fights the “every morning is different” fantasy.         |
| Pure random chaos every run       | Exhausting, unfair, and turns misery into a slot machine.                                 |
| Invented drama with no real basis | Breaks the authenticity promise and risks fake-news harm.                                 |
| Real news headlines as content    | Reopens real grief, dates instantly, and creates defamation/sensitivity risk.             |
| Paid drama packs / gacha          | Violates the no-pay-to-win and no-dark-pattern principles; drama is the free game's soul. |

## Evidence summary

- User direction, 2026-10-19 (drama is core; rare/real; “wah ada drama apalagi hari ini”; bercanda/santai; share).
- Existing research F1–F5 on corridor reality and disruptions.
- Source-bank plan: [2026-10 drama system and source bank](../games/pejuang-nafkah/research/2026-10-drama-system.md).
- Open unknowns: exact rarity, drama family list, source licences, sensitivity reviewers, share-card design, low-end render budget.

## Revalidation

Recheck before content lock and at each city/season release. Triggers: a real disaster that makes a card feel exploitative, a legal/regulatory change, a playtest showing drama fatigue or “the game is making fun of victims”, or a source that cannot be verified. If the source bank is stale or a card has no real basis, it does not ship.
