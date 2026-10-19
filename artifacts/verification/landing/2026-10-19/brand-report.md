# Landing v4.1 — brand, slogans, and humour theme

> **Superseded by [drama-report.md](drama-report.md) (v4.2).** Kept as the historical v4.1 snapshot.

**Date:** 2026-10-19
**Scope:** WNI Series / Pejuang Nafkah voice and slogans; landing-page tone layer. No game, checkout, or live-data implementation.

## Chosen lines

- **WNI Series:** “Susahnya nyata. Lucunya gratis.”
- **Long line:** “Jadi WNI itu susah. Untung di game bisa di-pause.”
- **Pejuang Nafkah:** “Berangkat. Berjuang. Sampai. Besok lagi.”
- **Support:** “Bukan balapan. Ini perjalanan menuju gajian.”
- **One-hand:** “Satu jempol. Satu tujuan: gajian.”
- **Expansion:** `[X]nya nyata. Lucunya gratis.` → “Nafkahnya nyata. Lucunya gratis.”

## What shipped on the landing page

- Hero: series line stickers + sambal “Besok lagi.” punchline + “perjalanan menuju gajian”.
- Highlighter ticker: “Berangkat · Berjuang · Sampai · Besok lagi · Kursi kosong itu mitos · Gajian dulu.”
- One Bang Nafkah sticker/quote block (original narrator, not the player).
- Recognition-card tape/stamps (“RELATE”, “8 DETIK”, “BASAH”).
- Pricing: “Tidak ada jebakan. Kecuali macet.” + “PALING MASUK AKAL” stamp.
- One-hand: “Satu tujuan: gajian.”
- Loop: “Kadang harganya parkir.”
- FAQ: “Ini game atau dokumentasi? Dokumentasi yang bisa dimainkan. Sayangnya kami tidak bisa menaikkan gaji lewat patch.”
- Footer/OG/manifest/about/404 carry the series line.
- Reduced-motion ticker becomes a static wrapped strip; no horizontal overflow.

## Checks

| Check | Result |
|---|---|
| `pnpm --filter @wni/platform typecheck` | pass — 0 errors / 0 warnings / 0 hints |
| `pnpm --filter @wni/platform build` | pass — 9 static routes |
| `node scripts/verify-landing.mjs` | pass — 1440/390, no console errors, no horizontal overflow, scene ready |
| Lighthouse (local production preview) | **performance 93, accessibility 100, best practices 100, SEO 100**; LCP 2.1 s, CLS 0, TBT 0 ms |
| Reduced motion | ticker static, no overflow; sticker rotations removed |
| Copy scan | no `Duitku`, `Full Pass`, or Rp 39,000 on active surfaces |
| OG image | regenerated with series line + “BESOK LAGI.” (1200×630) |
| Screenshots | `v41-desktop-hero.png`, `v41-mobile-hero.png`, `v41-desktop-pricing.png`, `v41-mobile-allmaps.png`, `v41-mobile-live.png`, `v41-desktop-bang.png`, `v41-mobile-bang.png` |

## Not verified

- Native Indonesian/punch-down review with real commuters.
- Game implementation, checkout, or live data.
- Real-device measurement; Lighthouse is local synthetic.
- Bang Nafkah is a proposed brand narrator; the in-game protagonist design is still open.

## Next

Native copy review; confirm the slogans/Bang Nafkah direction; Phase 0 access/KYC; then Phase 1 free-route slice. See [brand.md](../../../../docs/games/pejuang-nafkah/brand.md).
