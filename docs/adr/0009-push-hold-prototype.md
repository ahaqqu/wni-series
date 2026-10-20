# ADR-0009 — Standalone push-and-hold prototype (Draft 0)

- **Status:** accepted (prototype only)
- **Date:** 2026-10-20
- **Owners:** WNI Series
- **Research brief:** [2026-10 push-and-hold prototype](../games/pejuang-nafkah/research/2026-10-push-hold-prototype.md)
- **Evidence:** [prototype report](../../artifacts/verification/prototype-0/2026-10-20/report.md), 17 sim tests, and Chromium screenshots at 390×844 and 1280×900; source log below
- **Revalidate:** before any integration with v1; before any public playtest beyond the owner; if mobile performance or tone review fails

## Context

The v1 KRL design has soft failure, no “energy” system, and no hard game over for ordinary life. The user wants a short, funny, arcade prototype about pushing through a crowded station to reach the best spot near the train door. A literal implementation would contradict those rules and risk turning vulnerable passengers into a punchline. The repository’s research-first gate also forbids jumping from a chat idea to a detailed build without a brief, an ADR, and evidence.

The prototype is intentionally a **standalone mechanic spike**, not the canonical KRL mode. It exists to test one question: is a two-act **claim → board** hold mechanic fun and readable with one thumb on a phone?

## Decision

Build a standalone **Vite 8.3.4 + TypeScript 6.0.3 (game package) + Three.js 0.186.1** browser greybox in `games/pejuang-nafkah`:

- one authored Jurangmangu south-gate → platform scene;
- three candidate front-car door zones, a station estimate, a last-second scramble, and two train waves (1:30 / 3:30; 4:00 limit);
- a hybrid one-thumb verb: sustained lean, hold-to-claim, hold-to-anchor, release-at-full-charge `Hentak`, release-early stop;
- yellow-line safety, alighters-first, run-only energy, gengsi, rupiah, line cutting, coffee, a one-tap seat/stand choice, and a silent viral fail;
- a pure deterministic `sim/`, a Three.js `render/` that only reads sim state, and a disposable DOM HUD at 10 Hz;
- no server, accounts, payments, live data, analytics, PII, or production deployment.

The prototype uses placeholder fare/coffee values and an approximate interior. Real station data is limited to what is confirmed by the brief’s sources; no official KAI/Commuter logo, trade dress, announcement, or copied asset is used.

## Consequences

- **Positive:** fastest path to a playable answer; no v1 scope or payment/security surface; the deterministic sim and content flags can survive a later HUD/runtime migration.
- **Negative / accepted tradeoffs:** the hard fail, energy stat, and viral game over are non-canonical and must be revisited before integration; the HUD is disposable; art is greybox; the station interior is approximate; performance and tone are not proven.
- **Security/privacy:** local static page only; no network calls, storage of personal data, auth, payments, or secrets. No third-party scripts or trackers.
- **Performance/scaling:** target 60 fps / 30 fps floor with 20–30 low-poly agents and no ragdoll; real-device evidence still pending. No server scaling surface.
- **Cost/operations:** zero incremental provider cost; no deployment. The prototype is served locally during evaluation.
- **Rollback/reversibility:** delete the prototype package and ADR/brief; no production data, entitlement, or content is changed.

## Alternatives considered

| Option | Why rejected |
| --- | --- |
| Fold directly into the canonical v1 KRL mode | Conflicts with the no-hard-game-over and no-energy rules; requires a spec change and the full Phase 1 gate before code |
| Copy Push’em All’s charge-release input only | It is a charged shove, not a sustained claim/anchor; would make the door hold a second, unrelated verb |
| Single-hold / one train only | Simpler but cannot test the two-act claim → board idea or the recovery loop |
| Full art pass before mechanic validation | Wastes assets on an unproven hold; greybox first is cheaper and faster |
| Always-exact door estimate | Removes the spatial read and the scramble; chosen three-zone estimate + reveal instead |

## Evidence summary

- **Reference mechanic:** [Push’em All App Store](https://apps.apple.com/se/app/pushem-all/id1479551182?l=en-GB) and [iOSGames review](https://iosgames.net/Pushem-all/) (hold/release, force, ragdoll; arena-clearing, not a station hold).
- **Station:** [Wikipedia — Stasiun Jurangmangu](https://id.wikipedia.org/wiki/Stasiun_Jurangmangu), [OSM node 318720710](https://www.openstreetmap.org/node/318720710), [Wikimedia Commons photos](https://commons.wikimedia.org/wiki/Category:Jurangmangu_Station).
- **Specs/brand constraints:** [specs.md](../games/pejuang-nafkah/specs.md) §8.4, P6/P16; [brand.md](../games/pejuang-nafkah/brand.md); [design.md](../games/pejuang-nafkah/design.md) §7.
- **Unknowns/stop conditions:** exact gate/kiosk/door positions, current fare, real-device performance, and playtest/tone evidence. A failure in any of these blocks public release or v1 integration, not the local greybox itself.

## Revalidation

Any proposal to make this canonical must: re-open the v1 specs with an explicit ADR, run the Phase 1 research gate, obtain native/sensitivity review, verify current station/fare data, and prove mobile 30 fps. Until then, this remains a local Draft 0.
