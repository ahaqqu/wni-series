# 2026-10 Research Refresh — Jakarta Commute, Market, Payments, Platform

**Status:** evidence lock for `specs.md`, `design.md`, `plan.md`, `architecture.md`
**Research date:** 2026-10-18 (Asia/Jakarta)
**Supersedes:** volatile facts in `REPORT.md` / `findings/F1–F5.md` where this document says so. F1–F5 remain the qualitative/geometry base.
**Rule:** every number below names its source and date. Anything not re-verified is marked **stale / tune in Phase 0**.

> **2026-10-19 supersession:** payment/monetization below is a historical Duitku/Full Pass snapshot. Current provider is **Mayar**; pricing is Free one route / All Maps Rp 79,000 once / Live Rp 49,000-month (Phase 2). See [live-data/Mayar research](2026-10-live-data-and-mayar.md). Transport/market research here remains valid.

---

## 0. Executive summary — what changed since the first research pass

1. **KRL is busier, not less busy.** 271.48 million Jabodetabek trips Jan–Sep 2026; ~1.09 million trips per weekday in Q3 2026. The Bogor line carries 43.98% of all trips. This validates the crowd/boarding fantasy, but also means the game must avoid trivialising crush conditions.
2. **KRL fares are unchanged.** Rp 3,000 for the first 25 km + Rp 1,000 per next 10 km (official KAI statement, Aug 2026). TransJakarta remains Rp 3,500; a fare increase is still only a study/postponement.
3. **The network is changing fast.** Karet station closed 1 September 2026 and its passengers moved to BNI City; a new Gapeka is planned for 1 November 2026; Green Line 12-car operation is targeted for H1 2027. **Never hard-code a timetable.** Content must be versioned with `effective_from`.
4. **Odd-even is active and broader than the old design assumed.** 25 road sections, weekdays 06:00–10:00 and 16:00–21:00, fine up to Rp 500,000. Motorcycles remain the practical exemption/loophole, which is a core tension for the motor mode.
5. **Jakarta is measurably worse.** TomTom Traffic Index 2025 (published Jan 2026) ranked Jakarta 24th globally, up from 90th, with average peak speed 17.8 km/h. That is the tuning baseline, not a racing baseline.
6. **The 2026 economy matters to the fantasy.** UMP DKI 2026 is Rp 5,729,876/month; Pertalite is Rp 10,000/L. Transport cost as a share of daily wage is a real design lever, not flavour text.
7. **The market proof is strong.** BUSSID (Maleo) is estimated at 239.5M installs / 3.7M MAU / $200K+ monthly ad revenue; Ojol Life reached 1M downloads and 4.1★ in 2026. Indonesian transport simulators work. Nobody owns the **emotional, one-hand, web-first, dual-mode commute** space yet.
8. **Payments are feasible for a personal merchant but not "plug and play".** The current baseline is **Mayar** (invoice + SaaS membership), not Duitku; Mayar is a Merchant of Record but does not process sales tax, and its public webhook docs show no signature, so API verification is mandatory. Personal KYC and production approval must be confirmed.
9. **PDP enforcement is about to bite.** GR 33/2026 implements UU PDP, effective **16 January 2027**: 72-hour breach notification, DPO triggers, cross-border transfer tiers, fines up to 2% of annual revenue. Privacy must be designed now, not retrofitted.
10. **Our infrastructure is fixed.** Deploy to the existing netcup VPS (2 vCPU / 4 GB / 100+ GB SSD) at `wniseries.ahaqqu.com`, with Cloudflare DNS/WAF/cache in front. This is a better fit than an all-Cloudflare free-tier stack because payment reconciliation, Postgres transactions, and a fixed outbound IP matter more than edge CPU.

---

## 1. Transport reality (October 2026)

### 1.1 KRL Commuter Line

| Fact                                     | Value                                                                                 | Source                                   | Confidence  |
| ---------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------- | ----------- |
| Jan–Sep 2026 Jabodetabek trips           | 271.48 million, +6.25% YoY                                                            | Kompas, 2026-10-06                       | High        |
| Q3 2026 weekday average                  | ~1.09 million trips/day                                                               | same                                     | High        |
| Sep 2026 weekday average (KAI statement) | 1,093,912                                                                             | RRI, 2026-09-25                          | High        |
| Bogor line share                         | 119.38 million trips, 43.98% of total                                                 | Kompas, 2026-10-06                       | High        |
| Rangkasbitung (Green) line               | 60.92 million trips, +7.08% YoY                                                       | same                                     | High        |
| Tangerang (Brown) line                   | 21.47 million trips, +7.8% YoY                                                        | same                                     | High        |
| Bogor line daily active riders           | 474k–500k                                                                             | RRI, 2026-09-25                          | High        |
| KRL fare                                 | Rp 3,000 first 25 km + Rp 1,000 per next 10 km                                        | KAI, 2026-08-13; RRI, 2026-07-09         | High        |
| Fare increase                            | No plan; government decision required                                                 | RRI, 2026-07-09                          | High        |
| TransJakarta fare                        | Rp 3,500 flat; increase still under study/postponed                                   | Berita Jakarta, 2026-06-10; ANTARA, 2026 | High        |
| TransJakarta daily riders                | ~1.4 million                                                                          | Berita Jakarta, 2026-06-10               | High        |
| TransJakarta 2026 subsidy                | Rp 3.75 trillion (~4.6% of DKI APBD)                                                  | same                                     | High        |
| Karet station                            | Closed 1 Sep 2026; passengers redirected to BNI City                                  | RRI, 2026-08-31                          | High        |
| Cikarang loop trips via Karet/BNI City   | 264 trips/day                                                                         | same                                     | High        |
| Green Line 12-car target                 | H1 2027; headway stays ~10 min until signalling upgrade                               | RRI, 2026-08-25                          | High        |
| New Gapeka                               | Planned 1 Nov 2026; feeder patterns being evaluated                                   | RRI, 2026-08-25                          | Medium-High |
| Bogor line new rolling stock             | CLI-225 SF12 (INKA) third set in service 25 Sep 2026; 7 sets in intensive maintenance | RRI, 2026-09-25                          | High        |

**Design consequence:** the free trial should use the Rangkasbitung/Green corridor because it is stable, short, cheap, and still mostly JR 205 / Tokyo Metro 6000 stock. The Bogor line is the crowd/hub stress test, but its 2026 rolling stock is now mixed (JR 205, Tokyo Metro 6000, CLI-225). Model a **service snapshot**, not a permanent fleet list.

**2026 station-order caveat:** Karet is no longer a passenger stop; BNI City absorbed it. Any route card that shows `Sudirman → Karet → ...` is wrong for the current network. Verify station order against the current KRL line page + KAI Commuter announcement before every content release.

### 1.2 Roads, rules, and congestion

| Fact                                         | Value                                                                            | Source                                        | Confidence         |
| -------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------- | ------------------ |
| Jakarta global congestion rank (2025 index)  | 24th, up from 90th                                                               | TomTom via CNBC Indonesia, 2026-01-21         | High               |
| Average peak speed                           | 17.8 km/h                                                                        | same                                          | High               |
| Congestion level                             | +59.8% vs free-flow                                                              | same                                          | High               |
| Odd-even days/hours                          | Mon–Fri, 06:00–10:00 and 16:00–21:00                                             | Kompas TV, 2026-08-10 / 2026-06-17            | High               |
| Odd-even scope                               | 25 road sections, incl. Sudirman, Gatot Subroto, Rasuna Said, Fatmawati, Thamrin | same                                          | High               |
| Odd-even fine                                | up to Rp 500,000 (UU LLAJ Pasal 287)                                             | same                                          | High               |
| Busway violation                             | fine up to Rp 500,000; police enforcement warnings in 2026                       | Korlantas Polri, 2026-06-22; Viva, 2026-06-22 | Medium-High        |
| Helmet                                       | SNI helmet mandatory; sanctions apply                                            | Polri Humas, 2026                             | High               |
| Motorcycle lane filtering                    | endemic; core Jakarta riding script                                              | F1 (academic abstracts)                       | High (qualitative) |
| Peak motorcycle speed on congested arterials | 14–16 km/h (operational studies)                                                 | F1                                            | Medium             |
| Standard arterial lane width                 | 3.0–3.5 m working range                                                          | F1                                            | Medium             |
| UMP DKI 2026                                 | Rp 5,729,876/month (+6.17%)                                                      | Katadata, 2025-12-24; Hukumonline, 2026-01-23 | High               |
| Pertalite (DKI)                              | Rp 10,000/L                                                                      | CNBC Indonesia, 2026-10-16                    | High               |
| Pertamax (DKI)                               | Rp 15,950/L                                                                      | same                                          | High               |
| Daily in/out Jakarta                         | ~4 million people                                                                | Kompas, 2026-06-28                            | Medium-High        |

**Design consequence:** odd-even is a **car** rule; the player is on a motorcycle or KRL. Its gameplay value is indirect: it changes car density, police presence, and the temptation to use restricted roads. Do not give the player a fake "plate parity" choice unless they play a car mode (out of scope for v1).

### 1.3 Flood and weather

- 2026 floods remain localised but route-killing: Jl. Pandjaitan 50 cm (CNN Indonesia, 2026-02-04), Jl. Daan Mogot 30 cm (Kompas, 2026-02-20), 115–123 RT inundated in one event (ANTARA, 2026).
- The official flood portal `pantaubanjir.jakarta.go.id` is live and is a good **research/reference** source, but do not scrape it at runtime for v1. Use a curated, dated flood-point layer with `effective_from`.
- Rain changes mode choice: KRL becomes more attractive; motor grip and ojek surge worsen. Model this as a **scenario modifier**, not a cosmetic particle effect.

### 1.4 Live-service volatility

The following must be data, never code:

- station closures/openings (Karet → BNI City, 2026);
- Gapeka and service patterns (1 Nov 2026);
- fare tables;
- odd-even roads/hours;
- rolling stock allocations;
- hub transfer rules;
- flood-prone points;
- police/razia patterns (keep fictionalised and non-specific to avoid real-world harm).

---

## 2. Market and competitive evidence

| Product                                    | Evidence                                                                                                                             | Why it matters                                                                                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bus Simulator Indonesia** (Maleo)        | ~239.5M installs, 3.7M MAU, 3.7M ratings, 4.15★, estimated $200K+/month, 0% IAP / 100% ads (AppGoblin estimates, crawled 2026-10-17) | Authentic Indonesian environment + easy controls + no obstructive ads can scale enormously. Ads alone can work on mobile, but web ad CPMs are much weaker. |
| **Ojol Life** (Maleo)                      | >1M downloads, 4.1★, 11,200+ reviews (Industry.co.id, 2026-08-22)                                                                    | The "life of an Indonesian transport worker" fantasy is mainstream, not niche.                                                                             |
| **BUSSID / Ojol Life design language**     | free, ad-supported, progression from zero, open-world Indonesian city, simple controls                                               | Our differentiation must not be "another vehicle sim". It must be **the commuter's emotional morning**, one-hand, web, dual-mode, real route logic.        |
| **A Space for the Unbound / Afterlove EP** | Indonesian narrative games with international festival/press attention                                                               | Proves Indonesian specificity travels. Emotional authenticity is a viable export.                                                                          |
| **Web game monetization (2026)**           | Direct sales keep ~90% on itch.io; portal ad revenue share 45–80%; rewarded eCPM only $1–3 in tier-3 markets (Cinevva, 2026-09)      | For an Indonesian web game, a one-time All Maps product sold directly is more rational than betting on ads.                                                |

**Positioning statement:** _"The commute game that feels like your commute — not a racing game, not a tycoon game, not a meme."_ Playable in one hand, in 5–10 minute legs, on the train you are actually riding.

**Competitive moat:** real-world content pipeline + deterministic commute simulation + emotional/social systems + one-hand web distribution + a reusable series engine. A competitor can copy the theme, not the accumulated route data, tuning, and tone.

---

## 3. Payments — superseded 2026-10-19

The earlier Duitku/Full Pass baseline is retired. Do **not** use its old fees, signature rules, or Rp 39,000 price. Current provider and pricing:

- **Mayar** invoice/payment request + SaaS membership.
- **Free** one chosen route; **All Maps** Rp 79,000 once; **Live** Rp 49,000/month (Phase 2).
- Mayar has no documented webhook signature; verify via API.
- Full fees, subscription lifecycle, and live-data cost model: [2026-10-live-data-and-mayar.md](2026-10-live-data-and-mayar.md).

## 4. Privacy & legal (Indonesia, 2026)

| Requirement           | What it means for us                                                                                                                             | Source                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| UU PDP 27/2022        | Lawful basis, privacy notice, data subject rights, breach notification, DPO where triggered                                                      | PDP Law                      |
| GR 33/2026            | Implementing regulation; effective **16 Jan 2027**; 72-hour breach notification; cross-border transfer tiers; fines up to 2% of annual revenue   | Mori Hamada, 2026-09-16      |
| Cross-border transfer | netcup (EU region to be confirmed), Cloudflare, Resend, Google, Sentry mean transfers outside Indonesia; rely on safeguards/consent and disclose | GR 33/2026                   |
| PSE                   | Register via OSS; TDPSE before public launch                                                                                                     | Komdigi/OSS                  |
| IGRS                  | Age/content classification; currently paused, monitor                                                                                            | ANTARA, 2026-04-17           |
| Consumer protection   | Clear price, terms, refund, support, no dark patterns                                                                                            | UU 8/1999 / e-commerce rules |
| Tax                   | PPN 11% effective if PKP; personal income tax; e-Faktur if PKP; confirm treatment                                                                | DJP guidance                 |
| Children              | 13+ accounts; no chat/UGC; no targeted ads; parental purchase guidance                                                                           | PP 17/2025                   |

**Data-minimisation decision:** we need email, display name, avatar URL (optional), locale, order metadata, game progress, and anonymous telemetry. We do **not** need phone number, address, NIK, precise location, contacts, or advertising IDs. Do not collect them.

---

## 5. Platform & infrastructure evidence

### 5.1 Existing infrastructure (user-supplied)

- VPS: **netcup, 2 vCPU, 4 GB RAM, 100+ GB SSD**.
- Domain/host: **`wniseries.ahaqqu.com`** (Cloudflare-managed DNS assumed).
- This is enough for Caddy + Fastify API + PostgreSQL + game static files + backups for the launch period. It is not enough to run heavy CI runners, Elasticsearch, or a full observability stack; use external free tiers for those.

### 5.2 Why VPS, not all-Cloudflare free tier

| Criterion                     | Cloudflare free/paid all-in         | Existing netcup VPS                |
| ----------------------------- | ----------------------------------- | ---------------------------------- |
| Payment reconciliation / cron | Workers + D1 limits, 10 ms CPU free | Native Node + Postgres, no CPU cap |
| Transactions / row locks      | D1 lacks interactive transactions   | Full Postgres transactions         |
| Fixed outbound IP             | No stable egress guarantee          | Fixed VPS IP                       |
| Ops burden                    | Lower                               | Higher (we own hardening/backups)  |
| Static performance            | Excellent edge                      | Cloudflare cache in front; good    |
| Cost                          | $0–5/mo                             | Already paid                       |
| Data control                  | Vendor-managed                      | Full control                       |

**Decision:** VPS-first, Cloudflare edge. Cloudflare provides DNS, TLS, WAF, rate limiting, cache, and optionally Tunnel; the VPS runs the stateful core.

### 5.3 Cloudflare limits worth knowing (if we ever split edge functions)

- Workers Free: 100k requests/day, **10 ms CPU/request**, 128 MB memory, 50 subrequests.
- Workers Paid: 30s default CPU, no request cap.
- D1 Free: 5M rows read/day, 100k rows written/day, 5 GB storage; limits enforced since Sep 2026.
- R2: 10 GB free storage, zero egress; good for backups and paid asset packs.
- Pages: free static hosting, but unnecessary if we serve static from the VPS behind Cloudflare.

### 5.4 Auth / email

- Better Auth 1.7.x supports email OTP, Google OAuth, Drizzle/Postgres, and Node. Self-hosting on the VPS avoids per-MAU pricing and keeps PII in our database.
- Resend free tier is adequate for launch OTP/receipts (verify current quota before production). Requires SPF/DKIM/DMARC and a verified sending domain.
- Google OAuth with `openid email profile` is not a sensitive-scope app; consent screen still needs privacy policy, terms, and verified domain.

### 5.5 Toolchain versions observed (2026-10-18)

`three@0.186.1`, `vite@8.3.4`, `astro@7.4.0`, `react@19.3.1`, `typescript@7.0.2`, `pnpm@12.14.0`, `@playwright/test@1.64.1`, `vitest@5.0.5`, `hono@4.13.13`, `fastify@5.12.7`, `drizzle-orm@0.45.4`, `better-auth@1.7.10`.

Pin exact versions in the lockfile during Phase 1. Do not upgrade majors mid-phase.

---

## 6. Digital context (why web-first is credible)

| Fact                                   | Value                                     | Source                    |
| -------------------------------------- | ----------------------------------------- | ------------------------- |
| Internet users in Indonesia            | 230 million (80.5% penetration), Oct 2025 | DataReportal Digital 2026 |
| Mobile connections                     | 331 million (116% of population)          | same                      |
| Median mobile download speed           | 45.01 Mbps (Aug 2025)                     | same                      |
| Median age                             | 30.4                                      | same                      |
| Desktop vs mobile vs tablet (Sep 2026) | 55.83% / 43.62% / 0.55%                   | StatCounter               |
| Social media identities                | 180 million                               | DataReportal              |

**Design consequence:** build for both, but **mobile one-hand is the primary constraint** because the game is meant to be played during the commute. Desktop is a large secondary audience and the best place for the marketing site's heavier motion.

---

## 7. Implications for the four documents

1. **Specs:** make "playable one-handed, in 5–10 minute legs, offline-tolerant, on a moving train" a hard requirement, not an aspiration. Make real-world data freshness and privacy launch gates.
2. **Design:** base the free trial on the Rangkasbitung/Green corridor; treat Bogor/Manggarai as the full-game stress test. Treat odd-even as an environmental pressure, not a player rule. Make the tone warm, specific, and non-exploitative.
3. **Plan:** Phase 0 must resolve **Mayar** personal KYC, domain/Cloudflare routing, and content source licensing before code. Phase 2 must prove one-time/subscription payment/entitlement security end-to-end in sandbox; Phase 5 hardens it. Phase 3 adds cities; Phase 6 includes a content-refresh drill.
4. **Architecture:** VPS-first with Cloudflare edge; Postgres; Better Auth; Mayar hosted checkout + SaaS membership; server-side entitlements; TomTom/BMKG live snapshot worker; deterministic simulation + server replay for leaderboards; paid content as server-gated packs, not client flags.

---

## 8. Sources (accessed 2026-10-18)

**Transport / Jakarta**

- Kompas, _Commuter Line Jabodetabek Makin Sibuk, 1,09 Juta Perjalanan…_, 2026-10-06 — <https://money.kompas.com/read/2026/10/06/154100826/>
- RRI, _Sore Nanti, KAI Commuter Operasikan Rangkaian Ketiga KRL CLI-225…_, 2026-09-25 — <https://rri.co.id/regional/2760039/>
- RRI, _KAI Commuter Siapkan KRL 12 Rangkaian Kereta di Lintas Green Line_, 2026-08-25 — <https://rri.co.id/ekonomi/bisnis/2676863/>
- RRI, _Stasiun Karet Tutup 1 September…_, 2026-08-31 — <https://rri.co.id/regional/2694728/>
- KAI, _Mobilitas Tetap Nyaman…_ (fare), 2026-08-13 — <https://www.kai.id/publikasi/artikel-berita/mobilitas-tetap-nyaman-kai-hadirkan-pilihan-transportasi-yang-bersahabat-di-kantong>
- RRI, _Tarif KRL Dipastikan Tidak Naik…_, 2026-07-09 — <https://rri.co.id/bisnis/2556917/>
- Berita Jakarta, _Transjakarta Fare Adjustment Merits Study…_, 2026-06-10 — <https://www.beritajakarta.id/en/read/153243/>
- Kompas TV, _Lokasi 25 Ruas Terdampak Ganjil Genap…_, 2026-08-10 — <https://www.kompas.tv/regional/684761/>
- Kompas TV, _Awas Kecele Ganjil Genap…_, 2026-06-17 — <https://www.kompas.tv/regional/675284/>
- CNBC Indonesia, _Melesat ke Peringkat 24…_ (TomTom 2025), 2026-01-21 — <https://www.cnbcindonesia.com/news/20260121112655-4-703985/>
- Katadata, _UMP Jakarta Naik 6,17% pada 2026_, 2025-12-24 — <https://databoks.katadata.co.id/ketenagakerjaan/statistik/694bb54384b4f/>
- Hukumonline, _UMP dan Upah Minimum Sektoral DKI Jakarta 2026_, 2026-01-23 — <https://www.hukumonline.com/berita/a/ump-dan-umsp–dki-2026-lt697324d20263d/>
- CNBC Indonesia, _Resmi! Daftar Harga BBM… 16 Oktober 2026_, 2026-10-16 — <https://www.cnbcindonesia.com/news/20261016073830-4-776670/>
- CNN Indonesia, _Pascahujan Deras, Jalan Pandjaitan… 50 Cm_, 2026-02-04 — <https://www.cnnindonesia.com/nasional/20260204130331-20-1324479/>
- Kompas, _Jalan Daan Mogot Terendam Banjir 30 Cm…_, 2026-02-20 — <https://megapolitan.kompas.com/read/2026/02/20/07371881/>
- Korlantas Polri, _Jangan Nekat! … Aturan Ketat Jalur TransJakarta_, 2026-06-22 — <https://korlantas.polri.go.id/2026-06-22-jangan-nekat-korlantas-polri-ingatkan-bahaya-dan-aturan-ketat-jalur-transjakarta/>
- ANTARA, _Kemkomdigi tunda sementara penerapan IGRS…_, 2026-04-17 — <https://www.antaranews.com/berita/5530676/>
- Tribrata News, _Kemenkomdigi: Semua Platform Gim Daring Wajib Patuhi Regulasi Perlindungan Anak…_, 2026-01-08 — <https://tribratanews.polri.go.id/blog/nasional-3/kemenkomdigi-semua-platform-gim-daring-wajib-patuhi-regulasi-perlindungan-anak-di-ruang-digital-97585>

**Market / digital**

- AppGoblin, _Bus Simulator Indonesia Android Analytics_, crawled 2026-10-17 — <https://appgoblin.info/apps/com.maleo.bussimulatorid>
- Industry.co.id, _Ojol Life… Sudah 1 Juta Unduhan_, 2026-08-22 — <https://www.industry.co.id/read/154822/>
- Cinevva, _Monetisasi Game Web: Apa yang Sebenarnya Dikatakan Data (2026)_, updated 2026-09-06 — <https://app.cinevva.com/id/guides/web-game-monetization>
- DataReportal, _Digital 2026: Indonesia_ — <https://datareportal.com/reports/digital-2026-indonesia>
- StatCounter, _Desktop vs Mobile vs Tablet Market Share Indonesia — September 2026_ — <https://gs.statcounter.com/platform-market-share/desktop-mobile-tablet/indonesia>

**Payments / legal / platform**

- Mori Hamada & Matsumoto, _Indonesia's PDP Implementing Regulation Is Here: Key Takeaways from GR 33/2026_, 2026-09-16 — <https://www.morihamada.com/en/insights/newsletters/print/145906>
- IjinCepat, _Wajib Daftar PSE Kominfo 2026_, 2026-07-29 — <https://ijincepat.id/blog/wajib-daftar-pse-kominfo-2026-siapa-dan-kenapa>
- Kintsugi, _Indonesia VAT (PPN) Guide 2026_ — <https://trykintsugi.com/sales-tax-guides/apac/indonesia>
- Cloudflare, _Workers Limits_, updated 2026-10-12 — <https://developers.cloudflare.com/workers/platform/limits/>
- Cloudflare, _D1 Pricing_ — <https://developers.cloudflare.com/d1/platform/pricing/>
- Cloudflare, _D1 Data location_ — <https://developers.cloudflare.com/d1/configuration/data-location/>
- Better Auth, _Email OTP_ — <https://better-auth.com/docs/plugins/email-otp>
- Better Auth, _Drizzle adapter_ — <https://better-auth.com/docs/adapters/drizzle>

---

## 9. Residual gaps to close in Phase 0

- Mayar KYC/product/tier IDs, webhook signature/IP allowlist question, and provider licences are tracked in [live-data/Mayar research](2026-10-live-data-and-mayar.md).
- Exact station order and service patterns after the 1 Nov 2026 Gapeka; freeze a content snapshot after it takes effect.
- Green Line 12-car rollout date is a target, not a promise.
- Real ojek fare bands/surge and SCBD parking tariffs (use ranges, validate with commute diary study).
- Official signal cycle timings (use plausible ranges; do not claim exact).
- IGRS reactivation date and submission process.
- Personal-merchant tax treatment (PPN/PPh) — accountant review.
- Netcup region/latency to Jakarta and Cloudflare plan; measure before setting API SLOs.
- Whether Cloudflare Tunnel or proxied origin is used; both are supported, but the security runbook differs.
