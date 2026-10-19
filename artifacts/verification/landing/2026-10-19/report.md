# Landing page v4 verification — 2026-10-19

> **v4.1 note:** the brand/slogan + humour theme supersedes this visual snapshot. See [brand-report.md](brand-report.md).

**Scope:** update the pre-alpha landing page to the v4 offer: Free one route, All Maps Rp 79,000 once, Live Rp 49,000/month (Phase 2), Mayar, honest live-data labels. No game/checkout/live implementation.
**Commit:** working tree (no commit/push requested).

## Checks

| Check | Result |
|---|---|
| `pnpm --filter @wni/platform typecheck` | pass — 0 errors / 0 warnings / 0 hints |
| `pnpm --filter @wni/platform build` | pass — 9 static routes |
| `pnpm verify:docs` | pass — 41 Markdown files, 73 internal links, scaffold |
| `node scripts/verify-landing.mjs` | pass — desktop 1440 / mobile 390, no console errors, no horizontal overflow, live scene ready |
| Lighthouse (local production preview) | performance 92, accessibility 100, best practices 100, SEO 100; LCP 2.0 s, CLS 0, TBT 0 ms |
| Copy scan of built HTML | no `Duitku`, `Full Pass`, or `Rp 39.000`; 3 pricing cards; Mayar + 79k/49k present |
| Desktop/mobile pricing screenshots | captured; 3 cards on 1440, stacked on 390; grid no overflow |

## What changed

- Pricing: Free (one route) / All Maps Rp 79,000 / Live Rp 49,000/month (Phase 2 label, “belum dijual”).
- Payment copy: Mayar, not Duitku. No checkout is live.
- FAQ: free route choice; All Maps vs Live; Mayar; live traffic/weather vs estimated crowding.
- `/harga`, `/syarat`, `/privasi`, `/refund`, `/kontak`, `/tentang` updated.
- Research/status/plan/architecture/specs/design updated; new [live-data/Mayar research](../../../../docs/games/pejuang-nafkah/research/2026-10-live-data-and-mayar.md).

## Not verified

- No Mayar sandbox checkout, subscription lifecycle, or live-data implementation.
- No deployment; Cloudflare/VPS/KYC access remains pending.
- Lighthouse is local synthetic, not a real-device/network measurement.
- Screenshots are in this gitignored folder: `desktop-hero.png`, `desktop-pricing.png`, `mobile-hero.png`, `mobile-pricing.png`, `mobile-route.png`, `report.json`.

## Next

Phase 0 access/KYC + provider terms; Phase 1 free-route slice; Phase 2 All Maps/Mayar/live.
