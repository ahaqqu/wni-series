# apps/platform

**Status:** pre-alpha landing page implemented (KYC/marketing prototype); full platform account/checkout work remains Phase 4.

The public WNI Series platform. Current pre-alpha: marketing landing page, real OSM route map, pre-alpha game visuals, pricing/legal/contact pages, and email waitlist. Planned: game catalogue, devlog, auth, account, checkout return, and admin shell.

## Planned stack

- Astro 7 (static output) + React 19 islands for auth/account/checkout.
- Shared design system in `packages/ui`; contracts in `packages/contracts`.
- Served at `/` by Caddy on the netcup VPS, behind Cloudflare.
- No secrets in client code. Only `PUBLIC_*` env values.

## Non-negotiables

- LCP ≤2.0 s on throttled 4G mid-range Android; initial JS ≤150 KB gzip.
- Motion respects `prefers-reduced-motion`; no smooth-scroll hijack.
- The free game is reachable in ≤2 clicks; no sign-in wall before first play.
- Legal pages, support email, refund policy, and PSE/IGRS status are visible.
- Accessibility: keyboard, screen reader, contrast, 320 px layout.

## Planned routes

`/`, `/games/pejuang-nafkah`, `/peta`, `/harga`, `/devlog`, `/faq`, `/tentang`, `/kontak`, `/privasi`, `/syarat`, `/refund`, `/masuk`, `/akun`, `/checkout/return`, `/admin`.

See [architecture.md](../../docs/games/pejuang-nafkah/architecture.md) §6.1 and [design.md](../../docs/games/pejuang-nafkah/design.md) §10.
