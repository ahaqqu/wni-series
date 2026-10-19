> **Historical evidence:** this checklist reflects the 2026-10-18 Phase 0 baseline (Duitku/Full Pass). Payment/pricing was superseded on 2026-10-19 by Mayar, Free one route, All Maps Rp 79k, Live Rp 49k/month. Keep as an audit record.

# Phase 0 checklist — 2026-10-18

## Docs

- [x] `specs.md` principles/objectives/requirements/release criteria
- [x] `design.md` dual mode, one-hand UX, art, web/motion, monetization
- [x] `plan.md` phases 0–8, gates, evidence, risks
- [x] `architecture.md` stack, payments, security, privacy, deploy, multi-game
- [x] 2026 research refresh with sources and dates
- [x] Runbooks: deploy, payments, backup/restore, incident, privacy
- [x] Agent verification protocol

## Decisions

- [x] Free core + Full Pass Rp 39,000 + cosmetics; no ads
- [x] Real place names; original branding; no official logos
- [x] Duitku personal merchant; sandbox until KYC
- [x] netcup VPS + Cloudflare at `wniseries.ahaqqu.com`
- [x] Astro + Vite/Three.js + Fastify/Postgres/Better Auth
- [x] One-hand, portrait-first, offline-tolerant

## Not done (blockers for Phase 1)

- [ ] User approves Phase 0 scope and open assumptions
- [ ] Duitku sandbox account + KYC path confirmed
- [ ] Cloudflare/VPS access confirmed; staging route + TLS
- [ ] Three.js reference-device spike (60 fps / 30 fps floor)
- [ ] Deterministic sim + replay spike
- [ ] Better Auth + Postgres spike
- [ ] Duitku sandbox callback spike
- [ ] Staging deploy + rollback proven

**Signed by:** agent self-verification (no human sign-off yet).

## Pre-alpha landing page (0.5)

- [x] Astro landing page builds statically
- [x] Desktop/mobile screenshots; no console errors; no horizontal overflow
- [x] Real OSM route map, lazy-loaded, with station tooltips + attribution
- [x] Pre-alpha motor + KRL visuals, clearly labelled as visual targets
- [x] Pricing, FAQ, about/contact, privacy/terms/refund, 404
- [x] Waitlist API (validation, consent, honeypot, rate limit, hashed IP, migration, tests)
- [x] OG/favicon/manifest/sitemap/robots
- [x] Lighthouse: 94–96 perf, 100 a11y/best/SEO, LCP 2.0 s, CLS 0
- [ ] Deploy to `wniseries.ahaqqu.com` (blocked on access/secrets)
- [ ] Duitku KYC submission using this page (blocked on merchant/KYC data)
