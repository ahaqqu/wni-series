# Drama system — research and source-bank plan

**Status:** design direction + research plan. **Not a completed source bank and not a content lock.**
**Date:** 2026-10-19
**Companions:** [ADR-0005](../../../adr/0005-drama-system.md) · [brand.md](../brand.md) · [design.md](../design.md) · [research protocol](PROTOCOL.md)
**Tier:** R1 for the first vertical slice; R2 before a city/content lock

> The rule: **drama may be random in selection, never random in truth.** A card can be composited and funny, but the thing it is based on must have happened or still recur in the real corridor.

---

## 1. Questions this research must answer

1. Which disruption families actually recur on the launch corridor (Jurangmangu/Pondok Ranji → Tanah Abang → Sudirman/SCBD), with what seasonality and rough frequency?
2. Which specific locations are credible for each family (flood points, demo routes, accident blackspots, station failure points, market crowd pinch points)?
3. Which events are **unusable** because they involve real victims, ongoing grief, communal blame, or active legal proceedings?
4. What makes a drama feel fair and funny rather than punishing or mocking? How often is “rare” still memorable?
5. What would a commuter actually retell or share the next day?
6. What is the minimum source quality and review needed before a card can ship?

## 2. Method

| Step | Method                                                                                                 | Output                                                       |
| ---- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| 2.1  | Desk review of official records and reputable archives                                                 | Source log with dates, URLs, confidence                      |
| 2.2  | Ride-along on the launch corridor at peak, plus 2 off-peak controls                                    | Field notes: where disruptions are visible, how people react |
| 2.3  | 7-day commute diary with 6–8 commuters                                                                 | Frequency and emotional salience, language people use        |
| 2.4  | 30–45 min interviews with 4–6 commuters and 1–2 transport/urbanism practitioners                       | “What would you retell?”, “what would feel exploitative?”    |
| 2.5  | Sensitivity review with a native Indonesian reviewer and, if possible, a communications/legal reviewer | Approved/excluded families, wording changes                  |
| 2.6  | Paper prototype or greybox of 8–10 drama cards                                                         | Rarity/fairness/fun test                                     |
| 2.7  | Share-card comprehension test                                                                          | Does it read as a story, not a location leak?                |

Consent, anonymity, and no-photo rules apply. Do not collect NIK, phone numbers, or precise home locations. Field notes use role labels, not names.

## 3. Candidate drama families (to validate, not to ship)

| Family                        | What must be verified                                                  | Likely real basis                                                            | Risk / exclusion                                                                                 |
| ----------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Banjir / genangan**         | Recurring flood points on the corridor; depth/duration; season         | BMKG rainfall, BPBD DKI flood records, news archives, OSM/low-point geometry | No real flood with deaths; no “funny” rescue; no climate-doom exploitation                       |
| **Demo / unjuk rasa**         | Permitted demo routes, road closures, frequency, typical duration      | Polda Metro Jaya traffic notices, Dishub, reputable news                     | No violence, no communal/party blame, no recent clash with injuries; keep it a logistics problem |
| **Kecelakaan kecil**          | Actual blackspots; typical minor-collision congestion; response norms  | Korlantas/Polda traffic data, academic road-safety studies, news archives    | No fatalities, no graphic injury, no real victim story; near-miss ceiling                        |
| **Orang ribut / chaos kecil** | Queue disputes, angkot/ojol conflicts, market crowd pinch points       | Field observation, local reporting, interviews                               | No identity stereotype, no filmed real fight, no humiliation; de-escalate                        |
| **Gangguan operasi**          | Signal failure, door fault, delay, cancellation patterns               | KAI Commuter public disruption notices, operator statements, archives        | No fake live claim; label as historical/composite; no real staff blamed                          |
| **Infrastruktur/kota**        | Road repair, fallen tree, power outage, pipe burst, event road closure | Dishub/Bina Marga/PLN notices, news archives, OSM                            | Verify location; no invented closure on a real street                                            |
| **Hari besar / event**        | Car free day, marathon, concert, campaign, holiday surge               | Event permits, police traffic notices, calendar                              | No political endorsement; no real recent tragedy; avoid election-day tension                     |

Each family gets a **frequency band** (rare / uncommon / seasonal), a **location allow-list**, a **weather/time window**, and an **exclusion list**.

## 4. Source log format

Every claim in a drama card points to a row:

| Field             | Meaning                                                    |
| ----------------- | ---------------------------------------------------------- |
| `claim`           | The specific fact, e.g. “underpass X floods in heavy rain” |
| `primarySource`   | Official/operator/regulator URL or document                |
| `secondarySource` | Independent reputable source confirming it                 |
| `retrievedAt`     | ISO date                                                   |
| `effectiveFrom`   | When the fact became true                                  |
| `confidence`      | high / medium / low                                        |
| `licence`         | Reuse/attribution terms                                    |
| `notes`           | Conflicts, caveats, what is fictionalised                  |

Drama cards reference `sourceIds`, not copied paragraphs. No source, no card.

## 5. Sensitivity and ethics checklist

- [ ] No real victim, grieving family, or identifiable bystander.
- [ ] No recent tragedy (default 12-month exclusion; longer for mass events).
- [ ] No death, serious injury, or graphic detail on screen.
- [ ] No ethnic, religious, racial, gender, disability, or class blame.
- [ ] No political campaign or partisan framing.
- [ ] No real person's name, face, voice, or likeness.
- [ ] No “disaster tourism” shot or comedic rescue.
- [ ] The player always has a dignified exit; the joke is at the situation/system/self.
- [ ] Native Indonesian review completed; punch-down test passed.
- [ ] A correction/takedown path exists if a card ages badly.

## 6. Frequency and fairness test

Hypothesis to test, not a locked number:

- **Kejadian:** 1–3 per run; small, optional, low-stakes.
- **Drama:** about 1 in 5 runs; at most one per run.
- **Drama langka:** about 1 in 25 runs; share-worthy, never a real tragedy.
- **No repeat:** the same major drama does not repeat within 5 runs on the same route.
- **No pity timer** that makes drama feel scheduled; the daily seed and conditions do the work.
- **First session:** one low-stakes kejadian is guaranteed so the player learns the texture; a major drama is not guaranteed.

Test with 8–12 players: Can they retell the drama? Did it feel fair? Did it feel too frequent/too rare? Did they want to share it? Did any card feel exploitative?

## 7. Share research

- What would a commuter actually send to a group chat: the headline, the grade, the route, the joke, or the image?
- Does the card leak home/work location? (Use corridor names, not exact pins.)
- Is vertical 9:16 or square 1:1 more shareable in Indonesian group chats?
- Does “Gitu aja terus setiap hari.” land as warm resignation, not despair?
- Test Web Share API and download/copy fallback on low-end Android and iOS Safari.

## 8. Stop conditions

Stop and do not author/lock cards if:

- a drama family has no two independent, current sources;
- the only basis is a recent tragedy or a real victim's story;
- the location cannot be verified;
- the card needs a real person's name/face or an official logo;
- native/sensitivity review is unavailable;
- the frequency test shows fatigue or “making fun of victims”;
- the share card cannot avoid precise location/PII.

## 9. Deliverables before content lock

1. Source log (≥2 sources per family) and a location allow-list.
2. 10–15 draft cards across 3 families, each with `realBasis`, `sourceIds`, `fictionalised`, `sensitivity`, `rarity`, `conditions`, `choices`, `effects`, `bangLines`, `shareHeadline`.
3. Sensitivity/native review notes and a kill list.
4. Frequency/fairness playtest report.
5. Share-card prototype + privacy review.
6. ADR-0005 updated from “design direction” to “content locked” (or revised).

## 10. Current status

- Design direction accepted (ADR-0005); slogans/docs updated.
- **No source log, no approved cards, no sensitivity review, no playtest yet.**
- Phase 1 includes tasks 1.23–1.25 for the first bank/selector/share slice; content lock remains blocked until this plan is executed.
