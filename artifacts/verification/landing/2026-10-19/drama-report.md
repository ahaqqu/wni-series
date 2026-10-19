# Landing v4.2 — “Susahnya nyata, dramanya gratis.”

**Date:** 2026-10-19
**Scope:** WNI Series / Pejuang Nafkah slogan + drama layer; landing-page copy, one new section, nav/ticker/footer/OG/legal updates. No game, checkout, or live-data implementation.
**Server:** local Astro preview, `http://127.0.0.1:4322`
**Supersedes:** [brand-report.md](brand-report.md) (v4.1 copy)

## Chosen lines

- **WNI Series:** “Susahnya nyata, dramanya gratis.”
- **Long line:** “Jadi WNI itu susah. Untung di game bisa di-pause.” (unchanged)
- **Pejuang Nafkah:** “Berangkat. Berjuang. Sampai. Gitu aja terus setiap hari.”
- **Support:** “Bukan balapan. Ini perjalanan menuju gajian.” / “Satu jempol. Satu tujuan: gajian.”
- **Expansion template:** `[X]nya nyata. Dramanya gratis.` → “Nafkahnya nyata. Dramanya gratis.”

## What shipped on the landing page

- Hero kicker: “1 jempol, drama ada-ada aja” (was “0 drama”).
- Hero punch sticker: “Gitu aja terus setiap hari.” (was “Besok lagi.”).
- Series sticker: “Susahnya nyata,” + “Dramanya gratis.”
- Ticker: “Susahnya nyata · Dramanya gratis · … · Gitu aja terus setiap hari · Drama ada-ada aja”.
- New **Drama** section (`#drama`) with 3 cards:
  - “Underpass jadi kolam.” (BANJIR / PERNAH TERJADI)
  - “Jalan ditutup.” (DEMO / LANGKA)
  - “Antrean jadi lapangan.” (ORANG RIBUT / JANGAN DITIRU)
- A cream **share-card mock** with “Banjir di underpass. Demo di depan gedung.”, “Bercanda dulu, panik belakangan.”, and “Gitu aja terus setiap hari.”
- Honest note: drama is real-basis + fictionalised, no real victims/recent tragedy/names, not in the build yet.
- Nav + footer “Drama” links; FAQ “Dramanya nyata?”; tentang + legal/footer fiction clause; privacy “share card dibuat lokal, tidak diunggah”.
- OG image regenerated with the new lines; `scripts/verify-landing.mjs` now captures the drama section/share card.

## Verification

Commands:

```bash
pnpm --filter @wni/platform typecheck
pnpm --filter @wni/platform build
LANDING_URL=http://127.0.0.1:4322 node scripts/verify-landing.mjs
npx lighthouse@12.8.2 http://127.0.0.1:4322 --only-categories=performance,accessibility,best-practices,seo
```

Results:

| Check | Desktop 1440×1000 | Mobile 390×844 (reduced motion) |
| --- | --- | --- |
| Horizontal overflow | none (scrollWidth 1440 = clientWidth 1440) | none (scrollWidth 390 = body 390 = clientWidth 390) |
| Drama cards / share card | 3 / 1 | 3 / 1 |
| Hero punch | “Gitu aja terus setiap hari.”, 57–347 px (fits) | fits; no overflow |
| Share card right edge | 719.6 px (inside 1440) | 372 px (inside 390) |
| Console errors | 0 | 0 |

Lighthouse (clean local run, mobile):

- **Performance 96**
- **Accessibility 100**
- **Best practices 100**
- **SEO 100**
- LCP 2.1 s, CLS 0, TBT 0 ms

Variance note: a first run with concurrent install/CPU load scored 87 with TBT 440 ms; the clean rerun scored 96 with TBT 0. The 96 is a local observation, not a production guarantee. Full JSON: `lighthouse-drama.json` (gitignored).

Contrast fix during verification: the red “JANGAN DITIRU” stamp and “LANGKA” share badge originally used paper text on sambal (2.6:1). Both now use ink on sambal; accessibility remains 100.

## Screenshots (gitignored, local)

- `desktop-hero.png`
- `mobile-hero.png`
- `desktop-drama.png`
- `mobile-drama.png`
- `desktop-drama-share.png`
- `mobile-drama-share.png`

## Limitations

- No playable build; the drama section is a design/pre-alpha target, explicitly labelled as such.
- No drama bank, source log, sensitivity review, or frequency test yet; those are Phase 1 tasks 1.6a/1.23–1.25 and gate content lock (ADR-0005).
- No share implementation; the card is an HTML mock.
- Lighthouse is a local preview measurement, not field data; real-device thermal/battery testing is still pending.
- Native Indonesian / punch-down / drama-sensitivity review still pending.

## Next

1. Run the drama source-bank research (`research/2026-10-drama-system.md`): ≥2 sources per family, location allow-list, sensitivity review.
2. Prototype 8–10 cards and test rarity/fairness/recall with 8–12 commuters.
3. Only then implement the Phase 1 drama selector + local share card.
