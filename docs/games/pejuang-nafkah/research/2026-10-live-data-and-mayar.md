# 2026-10 Live Data, Subscription, and Mayar Research

**Status:** decision evidence for `specs.md`, `design.md`, `plan.md`, `architecture.md`
**Research date:** 2026-10-19 (Asia/Jakarta)
**Scope:** Mayar fees/integration, live traffic/weather/crowding/transit/flood data, feasibility, API access, and monthly cost.
**Rule:** prices and API terms change. Re-verify before Phase 2 and before KYC. Figures are planning estimates, not invoices.

---

## 0. Executive summary

1. **Mayar can support both products.** One-time Rp 79,000 can use Mayar Invoice/Payment Request; Rp 49,000/month can use a Mayar **SaaS membership tier** with recurring billing. Mayar's public docs do **not** document a webhook signature, so a callback must never grant an entitlement by itself. Treat the webhook as an event trigger, then fetch the authoritative transaction/member state from Mayar's API.
2. **Traffic is buyable; crowding is not openly buyable.** TomTom Traffic (Flow Segment + Incidents) gives real road speed/incidents and has self-serve, published pricing. KRL/TransJakarta real-time crowding and train positions are **not public APIs**. The honest Phase 2 design is: real traffic + real weather + **modelled crowding with opt-in rider reports**, clearly labeled as estimates; pursue an operator data partnership for true live crowding later.
3. **Weather is cheap.** BMKG's public forecast and nowcast APIs are free, require attribution, and allow 60 requests/minute/IP. Use BMKG as primary and Open-Meteo as a licensed fallback only if needed.
4. **Base live-data provider cost is small at 10 corridors.** TomTom at adaptive refresh (5 min during 9 peak hours / 30 min otherwise) for ten corridors, four flow points each, is about **€149/month (~Rp 3.0 juta)** plus a small weather budget. A 15-minute all-day refresh is about **€96/month**. A 5-minute all-day refresh is about **€338/month**. At a small subscriber base, throttle to 30 min (~€38/month). These are provider fees, not labour.
5. **The 49k subscription works at modest scale but is thin at 100 subscribers.** At 100 subs, 5-min peak polling + weather + infra can consume ~85% of net subscription revenue; use 30-min polling until ~300 subs. At 1,000 subs it is ~8–10%. Use adaptive polling, cost caps, and a minimum-scale launch assumption.
6. **The one-time Rp 79,000 product is the healthy cash-flow product.** QRIS + invoice fees are ~2.2%, leaving ~Rp 77,262 per sale with no recurring provider cost. It should be positioned as the permanent "all maps" product, not a worse subscription.
7. **Phase 2 is the right phase for subscriptions/live and Phase 3 for cities.** The live layer should be built as a provider-agnostic snapshot service, not hard-wired into the game. Other cities reuse the adapter but need their own data/licence gates.

---

## 1. Mayar: fees, products, and integration

### 1.1 Plans and transaction fees

Mayar's published pricing (retrieved 2026-10-19):

- **Starter:** Rp 0/month.
- **Business:** Rp 349,000/month.
- **Enterprise:** custom.

Transaction fees have two parts: a **channel fee** (payment method) and an **admin fee** (Mayar product/plan). The merchant can choose to pass these to the customer; we will **absorb** them so the displayed price is the price paid.

| Payment method                                     |                 Channel fee |
| -------------------------------------------------- | --------------------------: |
| QRIS                                               |                        0.7% |
| E-wallet (DANA, OVO, LinkAja, ShopeePay)           |                        1.5% |
| E-wallet Jenius                                    |                          2% |
| Virtual account (BRI, BNI, Permata, Mandiri, etc.) |                    Rp 4,000 |
| Card (Mastercard/VISA/JCB)                         | 2.6% + Rp 2,000 (excl. tax) |
| Mini market                                        |              Rp 5,000–7,500 |
| Withdrawal                                         |               Rp 2,775 flat |

| Mayar product                           | Starter admin | Business admin | Enterprise |
| --------------------------------------- | ------------: | -------------: | ---------: |
| Invoice / PayMe / POS / Payment Request |          1.5% |             1% |         0% |
| Payment Link                            |          1.5% |             1% |         0% |
| Subscription                            |            4% |             3% |         0% |
| Digital product / e-book / podcast      |            4% |             3% |         0% |

**Important:** Mayar is a Merchant of Record for checkout, but its own docs say it does **not** include sales-tax processing; the merchant must handle tax reporting/payment. PPN treatment therefore remains ours (and only applies if we are a PKP).

Source: [Mayar fees](https://docs.mayar.id/mor/fees), [Mayar pricing](https://mayar.id/pricing), [Mayar MoR introduction](https://docs.mayar.id/mor/introduction).

### 1.2 Net revenue per sale (QRIS baseline)

| Product                                              |           Gross |                  Mayar fee | Net before tax/infra |
| ---------------------------------------------------- | --------------: | -------------------------: | -------------------: |
| One-time All Maps (invoice/payment request, Starter) |       Rp 79,000 |            2.2% = Rp 1,738 |        **Rp 77,262** |
| One-time All Maps (e-wallet, Starter)                |       Rp 79,000 |            3.0% = Rp 2,370 |            Rp 76,630 |
| Subscription (Starter)                               | Rp 49,000/month |            4.7% = Rp 2,303 |  **Rp 46,697/month** |
| Subscription (Business)                              | Rp 49,000/month |            3.7% = Rp 1,813 |      Rp 47,187/month |
| Subscription (VA, Starter)                           | Rp 49,000/month |   4% + Rp 4,000 = Rp 5,960 |      Rp 43,040/month |
| Subscription (card, Starter)                         | Rp 49,000/month | 6.6% + Rp 2,000 = Rp 5,234 |      Rp 43,766/month |

Business plan break-even (ignoring one-time sales): `Rp 349,000 / (1% × Rp 49,000) ≈ 712 active subscriptions`. Switch only after that, and re-check the plan price.

### 1.3 What Mayar provides for subscriptions

Mayar's **Membership (SaaS)** product supports:

- a product with one or more tiers/periods (1, 3, 6, 12 months, lifetime);
- recurring billing, grace period, trial, redirect URL;
- customer portal/cancellation;
- webhook events: `payment.received`, `membership.newMemberRegistered`, `membership.memberExpired`, `membership.memberUnsubscribed`, `membership.changeTierMemberRegistered`;
- API: register member, create invoice, get member detail, cancel member;
- license verify/activate/deactivate for SaaS-style checks.

API base URLs:

- production: `https://api.mayar.id/hl/v2/...`
- sandbox: `https://api.mayar.io/hl/v2/...`

Rate limit: **50 requests/minute per API key**. Queue and cache; never call Mayar per page view.

Useful endpoints:

| Purpose                         | Endpoint                                                    |
| ------------------------------- | ----------------------------------------------------------- |
| Register member                 | `POST /hl/v2/memberships/members/create`                    |
| Create/reuse membership invoice | `POST /hl/v2/memberships/members/{memberId}/invoice/create` |
| Member status/expiry            | `GET /hl/v2/memberships/members/{memberId}?productId=...`   |
| Cancel membership               | `POST /hl/v2/memberships/members/{memberId}/cancel`         |
| One-time invoice                | `POST /hl/v2/invoices/create`                               |
| One-time payment request        | `POST /hl/v2/payments/create`                               |
| Transaction detail              | `GET /hl/v2/transactions/{id}`                              |
| Register webhook                | `POST /hl/v2/webhooks/update`                               |

Sources: [Membership SaaS](https://docs.mayar.id/features/productpage/saas), [register member](https://docs.mayar.id/api-reference-v2/membership/register), [create membership invoice](https://docs.mayar.id/api-reference-v2/membership/createinvoice), [member detail](https://docs.mayar.id/api-reference-v2/membership/memberdetail), [cancel](https://docs.mayar.id/api-reference-v2/membership/cancel), [invoice create](https://docs.mayar.id/api-reference-v2/invoice/create), [transaction detail](https://docs.mayar.id/api-reference-v2/transaction/detail), [rate limit](https://docs.mayar.id/api-reference-v2/rate-limit).

### 1.4 One-time product

Use **Mayar Invoice** (or Payment Request) rather than a generic payment link:

- create our order first (`orders.id`), amount = 79,000;
- create invoice with `extraData.orderId`, `extraData.userId`, product `all_maps`;
- redirect to the returned invoice link;
- on `payment.received`, **do not trust the payload**; `GET /hl/v2/transactions/{id}` and verify amount, status, customer, and `extraData.orderId`;
- grant `maps_all` once, idempotently.

Invoice feature is 1.5% admin on Starter. The payment request/invoice note says customer-borne fee settings do not apply there; we absorb fees.

### 1.5 Subscription flow

1. User signs in and clicks "Live".
2. Server creates/loads a Mayar membership member for the product/tier (or uses the existing member).
3. Server creates a membership invoice and redirects to `membershipBillUrl`.
4. Mayar sends membership/payment webhook.
5. Server fetches member detail and transaction detail; checks:
   - merchant/product/tier IDs match our config;
   - customer email maps to our user;
   - status active and `expiredAt`/`nextPayment` sane;
   - amount matches Rp 49,000;
   - event/transaction ID not processed before.
6. Grant `maps_all` + `live` until `expiredAt` (or next payment + grace). Store `provider_member_id`, `provider_customer_id`, `current_period_end`.
7. Renewal webhooks extend; expiry/unsubscribe revokes `live` but leaves purchased `maps_all`.
8. User cancellation calls Mayar cancel; keep access until `expiredAt`, then revoke. Do not immediately revoke on cancel unless the user explicitly asks for immediate termination and refund.

### 1.6 The webhook signature problem

Mayar's public webhook documentation lists events and fields but **does not document an HMAC/signature header**. A public callback URL can be forged. Therefore:

- **Never** grant value from `payment.received`/`membership.*` payload alone.
- Treat webhook as a low-trust "something changed" hint; fetch authoritative state from `api.mayar.id` using the server API key.
- Verify `merchantId`, product ID, tier ID, amount, customer, and status against our records.
- Use an unguessable webhook path and an IP allowlist if Mayar publishes one, but do not rely on either as the primary control.
- Deduplicate by Mayar transaction/member ID + event ID; make grants idempotent.
- If Mayar later adds a signature, add it as a second control.

This is a **P0 security requirement** for Phase 2, not a cleanup item.

### 1.7 KYC and tax

Mayar individual verification (the likely path for a personal merchant) requires: full name as on KTP, ID number, business name, business description (website/social), business address, website, KTP, selfie with KTP, bank book/account screenshot; NPWP is optional. Source: [Mayar business verification](https://docs.mayar.id/businessverify).

Tax: Mayar does not calculate/remit sales tax for us. `Rp 79,000` and `Rp 49,000` are **gross** customer prices. PPN 11% applies only if we are a PKP; confirm with an accountant. Keep a tax reserve and record gross/net separately.

---

## 2. Live data: what is actually available

### 2.1 Inventory

| Layer                       | What we can get                                                                 | Provider / access                                                        | Freshness                          | Licence / cost                                                         | Verdict                     |
| --------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------- | ---------------------------------------------------------------------- | --------------------------- |
| Road traffic flow           | Current/free-flow speed, travel time, confidence on a road segment near a point | **TomTom Traffic Flow Segment API**; self-serve API key                  | ~30 s upstream; we poll            | Commercial API; €1/1k after 20k free/month                             | **Use**                     |
| Road incidents              | Accidents, jams, road works, closures, flooding category, delay                 | **TomTom Traffic Incidents API**; bbox/IDs                               | ~minutes                           | Commercial API; €2/1k after 2.5k free/month                            | **Use**                     |
| Traffic map tiles           | Vector/raster flow + incidents overlay                                          | TomTom Traffic tiles                                                     | ~30 s                              | €0.10/1k after 200k free/month                                         | Optional visual layer       |
| Weather forecast            | 3-day, 3-hour forecast by kelurahan/desa                                        | **BMKG open data**; no key                                               | 2×/day                             | Free; attribution required; 60 req/min/IP                              | **Use**                     |
| Weather nowcast             | CAP alerts to kecamatan                                                         | **BMKG nowcast**; XML RSS/CAP                                            | As issued                          | Free; attribution required; 60 req/min/IP                              | **Use**                     |
| Rain/precipitation fallback | Hourly precipitation, 1–2 km models                                             | **Open-Meteo**                                                           | Hourly                             | Free non-commercial; commercial licence; paid plans; attribution CC BY | Fallback only               |
| Flood reports/gauges        | Crowdsourced flood reports, Jakarta flood gauges                                | **PetaBencana** open API                                                 | Reports last 3 h; gauges last hour | Non-commercial CC BY-NC; commercial CC BY licence agreement/quote      | Optional, licence first     |
| KRL crowding                | Real-time carriage occupancy                                                    | **No public API**; KAI Commuter app/Google collaboration not an open API | —                                  | Partnership required                                                   | **Model, don't claim live** |
| TransJakarta crowding       | Real-time bus occupancy                                                         | **No public API**                                                        | —                                  | Partnership required                                                   | Model / opt-in              |
| KRL positions/delays        | Real-time train positions                                                       | **No public GTFS-RT/API** found                                          | —                                  | Partnership required                                                   | Schedule model              |
| TransJakarta schedules      | GTFS static/upload portal                                                       | `gtfs.transjakarta.co.id` requires login                                 | Static                             | Access request                                                         | Request for Phase 2/3       |
| Road closures/flooding      | Incident categories incl. flooding/road closed                                  | TomTom incidents                                                         | Minutes                            | Included above                                                         | Use                         |
| Air quality                 | AQI                                                                             | Open-Meteo/other                                                         | Hourly                             | Extra                                                                  | Not v1                      |

### 2.2 What "live crowded" honestly means

There is no official, public, real-time crowding feed for KRL or TransJakarta. The 2023 KAI/Google crowding work is an app feature, not an open API. Scraping the KRL/TransJakarta apps or relying on unofficial endpoints would be brittle and legally risky.

Phase 2 must therefore ship two distinct labels:

- **Live:** road traffic, incidents, weather/nowcast, and any operator-provided feed.
- **Estimated:** crowding and transit delay, derived from time-of-day, direction, headway, weather, school/holiday calendar, incidents, and **opt-in rider reports**. Show a confidence label and "estimasi", never "live occupancy".

This still delivers the subscription promise — a useful pre-trip plan — without lying. A true live-crowding tier is a later partnership milestone.

### 2.3 How to get each feed

#### TomTom Traffic

1. Create an account at `my.tomtom.com`; create an API key; enable Traffic API; add billing only when leaving the free tier.
2. Flow Segment example:
   `GET https://api.tomtom.com/traffic/services/4/flowSegmentData/relative/10/json?key=...&point={lat},{lon}`
3. Incidents example:
   `GET https://api.tomtom.com/maps/orbis/traffic/incidents/details?apiVersion=2&bbox={minLon,minLat,maxLon,maxLat}&timeValidity=present`
   Preferred auth header: `TomTom-Api-Key`.
4. Store only derived, short-lived metrics (delay ratio, speed, incident count/type) and a source timestamp; do not redistribute raw provider data.
5. Confirm the commercial API terms for game/derived-data use before production; display the required TomTom attribution.

Pricing: Flow Segment €1.00/1k for 20k–1M, €0.80/1k 1M–5M; Incidents €2.00/1k for 2.5k–1M, €1.60/1k 1M–5M. Source: [TomTom pricing](https://docs.tomtom.com/pricing), [Flow Segment docs](https://docs.tomtom.com/traffic-api/documentation/tomtom-maps/v1/traffic-flow/flow-segment-data), [Incident docs](https://docs.tomtom.com/traffic-api/documentation/tomtom-orbis-maps/v2/traffic-incidents/incident-details).

#### BMKG

- Forecast: `GET https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={kode_wilayah}` (kelurahan/desa level; 8 forecasts/day; 3-day).
- Nowcast: `GET https://www.bmkg.go.id/alerts/nowcast/id` (RSS) and CAP XML per province.
- Limits/attribution: 60 requests/minute/IP; must display BMKG as source.
- Cache by `adm4` + forecast issuance; no need to call per user.

Sources: [BMKG forecast data](https://data.bmkg.go.id/prakiraan-cuaca/), [BMKG nowcast](https://data.bmkg.go.id/peringatan-dini-cuaca/).

#### Open-Meteo (fallback)

- Commercial use needs a paid licence/key; free tier is non-commercial, 10k/day.
- Data CC BY 4.0; attribution required.
- Pricing is not published as a simple table on the official page; third-party listings indicate ~US$29/month Standard (1M calls) / US$99 Professional (5M), but **verify by quote**. Budget Rp 0.5–2 juta/month if used.
- Do not use the free tier in production.

Sources: [Open-Meteo pricing](https://open-meteo.com/en/pricing), [licence](https://open-meteo.com/en/licence).

#### PetaBencana (optional flood layer)

- Public reports: `GET https://api.petabencana.id/reports?admin=ID-JK&timeperiod=...`
- Flood gauges: `GET https://data.petabencana.id/floodgauges?admin=ID-JK`
- Include a descriptive `User-Agent`.
- Non-commercial use is CC BY-NC 4.0; **commercial use requires a CC BY 4.0 commercial licence agreement and fee negotiated with PetaBencana**.
- Do not ship this layer until the licence is signed. BMKG nowcast covers the minimum for v1.

Sources: [PetaBencana API](https://docs.petabencana.id/routes.md), [commercial licence](https://docs.petabencana.id/informasi-lisensi-data/penggunaan-komersial-cc-by-4.0.md), [flood gauges](https://docs.petabencana.id/master-1/routes/floodgauges.md).

#### Transit schedules

- TransJakarta GTFS: `https://gtfs.transjakarta.co.id/` is a login/upload portal, not an open download. Request access/terms.
- KRL: no official public GTFS/GTFS-RT found. Use versioned schedules/tariffs with `effective_from`; do not scrape the app.
- Crowding: modelled + opt-in reports; operator partnership is the only path to "live".

---

## 3. Traffic provider comparison

| Provider             | Real-time road flow        | Incidents       | Self-serve         | Published pricing                     | Fit                     |
| -------------------- | -------------------------- | --------------- | ------------------ | ------------------------------------- | ----------------------- |
| **TomTom**           | Yes, Flow Segment          | Yes             | Yes                | Yes (€/1k tiers)                      | **Primary**             |
| Google Maps Platform | Yes (Routes traffic-aware) | Some via Routes | Yes                | Yes (US$10/1k Pro; $15/1k Enterprise) | Expensive; terms review |
| HERE                 | Yes                        | Yes             | Enterprise/contact | Quote                                 | Enterprise only         |
| Mapbox               | Traffic tiles/visual       | Limited         | Yes                | Map/tile pricing                      | Not enough numeric flow |
| Waze                 | No official API            | No              | No                 | —                                     | Do not scrape           |

**Why TomTom:** published usage pricing, a dedicated traffic product, segment-level speed/travel time, incident categories including flooding/road closure, and a free tier that covers early testing. Google Routes is a useful benchmark but at 115,200 flow calls/month its Pro tier alone is ~US$1,102 (~Rp 19.9 juta) after the 5k free cap — roughly ten times the TomTom estimate. Google's terms also need a specific review for a game using its traffic data with a non-Google map. Do not choose it without legal sign-off.

Sources: [Google Routes billing](https://developers.google.com/maps/documentation/routes/usage-and-billing), [Google pricing](https://developers.google.com/maps/billing-and-pricing/pricing), [Google Maps Platform terms](https://cloud.google.com/maps-platform/terms).

---

## 4. Cost model

### 4.1 Assumptions

- Phase 2 Jabodetabek: **10 corridors** (the free route plus nine All-Maps corridors).
- **4 TomTom flow points per corridor** (major turns/segments), one incident bbox for the covered area.
- Adaptive refresh: **5 minutes during 9 peak hours** (06:00–10:00 and 16:00–21:00), **30 minutes otherwise**.
- EUR/IDR **20,190**, USD/IDR **18,034** (Wise/Kontan, 2026-10-19). Plan with rounded Rp 20,000/€ and Rp 18,000/US$; rates move.
- Weather cached per kelurahan; BMKG free. Infrastructure stays on the existing netcup VPS.

### 4.2 TomTom monthly cost

| Refresh policy                                  | Flow calls/mo | Incident calls/mo | Provider cost |            ≈ Rp |
| ----------------------------------------------- | ------------: | ----------------: | ------------: | --------------: |
| 30 min all day                                  |        57,600 |             1,440 |        €37.60 |         Rp 759k |
| **Adaptive 5 min peak (9 h) / 30 min off-peak** |   **165,600** |         **4,140** |   **€148.88** | **Rp 3.0 juta** |
| 15 min all day                                  |       115,200 |             2,880 |        €95.96 |    Rp 1.94 juta |
| 5 min all day                                   |       345,600 |             8,640 |       €337.88 |    Rp 6.82 juta |

Notes: free tiers are 20k flow + 2.5k incidents/month. A single incident bbox for Jakarta keeps incident volume near the free cap. If we also render traffic tiles, 15-minute tile loads for 10 corridors are ~576k/month → ~€37.60 after the 200k free cap; this is optional because the game uses derived segment metrics.

### 4.3 Other monthly costs

| Item                           |            Estimate | Notes                                            |
| ------------------------------ | ------------------: | ------------------------------------------------ |
| BMKG forecast/nowcast          |                Rp 0 | Attribution, 60/min/IP, cache                    |
| Open-Meteo commercial fallback |      ~Rp 0.5–2 juta | Quote required; use only if BMKG is insufficient |
| PetaBencana commercial licence |               Quote | Do not ship before agreement                     |
| Crowding reports/model         |               ~Rp 0 | DB + moderation; no provider                     |
| Transit schedule data          |              Rp 0–? | Request access; partnership costs unknown        |
| Existing VPS + Cloudflare      |    Rp 0 incremental | Uses existing 2 vCPU/4 GB box; monitor headroom  |
| R2 backups/monitoring          |         ~Rp 20–100k | Optional                                         |
| Mayar Starter                  |          Rp 0/month | Business Rp 349k at ~712 subs                    |
| Withdrawal                     | Rp 2,775/withdrawal | Budget one/month                                 |

### 4.4 Subscription economics

At QRIS + Starter, net per subscription is **Rp 46,697/month**.

| Active subs | Gross/month |  Mayar fee |              Live provider + weather + infra | Contribution before tax/marketing |
| ----------: | ----------: | ---------: | -------------------------------------------: | --------------------------------: |
|         100 |  Rp 4.90 jt | Rp 0.23 jt | ~Rp 4.0 jt (5-min peak); ~Rp 1.8 jt (30-min) |                    ~Rp 0.7–2.9 jt |
|       1,000 |  Rp 49.0 jt | Rp 2.30 jt |                                   ~Rp 4.0 jt |                         ~Rp 42 jt |
|       5,000 |   Rp 245 jt | Rp 11.5 jt |          ~Rp 8–12 jt (more corridors/cities) |                        ~Rp 221 jt |

Live provider cost per subscriber: **~Rp 30k at 100 subs** if running 5-min peak (use 30-min at this scale), **~Rp 3k at 1,000**, **~Rp 0.6k at 5,000**. The fixed snapshot cost is why a small subscriber base needs cost caps; the model gets healthy quickly.

The one-time All Maps product yields **Rp 77,262 net per QRIS sale** with no recurring provider cost. At 1,000 sales that is ~Rp 77 jt before tax. It funds the live layer and cities.

### 4.5 What this means for pricing

- **Rp 79,000 one-time** is sustainable for all maps in Pejuang Nafkah (including Phase 3 cities) as long as live data is not included. It is a permanent license, not a subscription.
- **Rp 49,000/month** is sustainable at scale; at <100 subs, cap polling at 30–60 minutes and keep a monthly provider budget.
- Do not bundle unlimited live data into the one-time product. The marginal provider cost would have no recurring revenue.
- Do not promise "live crowded" until an operator feed exists. Promise "live traffic/weather + estimated crowding", then upgrade when a partnership lands.

---

## 5. Product design consequences

### 5.1 Live snapshot, not live gameplay

The game is deterministic and offline-tolerant. Live data must be **frozen at the start of a run**:

1. **Briefing** (pre-run): corridor, time window, traffic delay, incidents, weather/nowcast, crowding estimate, confidence, source timestamps.
2. **Run** uses that frozen snapshot; no mid-run network dependency, no score advantage from a changing feed.
3. **Planner** (separate from the scored run): compare departures/routes, show "if you leave at 06:15 vs 06:30", and explain the trade-off. This is a planning aid, not navigation.
4. **Post-run**: "what changed" and "plan the real one" card, with a clear disclaimer.

This preserves fairness, determinism, and the "play on the train without signal" promise.

### 5.2 UI labels

- `Live` only for provider-fed traffic/weather/incidents, with `as of` time.
- `Estimasi` for crowding/transit delay, with confidence and a short explanation.
- `Data tidak tersedia` when a provider fails; never silently substitute fake live data.
- Attribution: TomTom, BMKG, Open-Meteo/PetaBencana when used.

### 5.3 Free vs paid

- **Free:** choose one route; all modes on that route; scheduled/estimated conditions; no live feed.
- **All Maps (Rp 79,000 once):** all current and Phase 3 city maps; no live feed.
- **Live (Rp 49,000/month):** all maps + live traffic/weather/incidents + estimated crowding + planner; active only while subscription is active. If it expires, maps revert to the free route unless All Maps was purchased separately.

### 5.4 Free route choice

Choose one route at onboarding. Give **one courtesy change within 14 days** (wrong choice/moved house), then require All Maps to switch. This is a concrete default; confirm with the user before implementation. All modes on the chosen route are free; only the route is limited.

---

## 6. Phase 2 and Phase 3 implications

**Phase 2** must deliver:

- accounts and Mayar one-time + subscription checkout;
- entitlement model (`maps_all`, `live`, `free_route`) and server enforcement;
- live snapshot worker + adapters (TomTom, BMKG), cache, budget caps, kill switch;
- live briefing + planner UI, labels/attribution, stale/offline behavior;
- admin/reconciliation and manual refund/cancel runbook;
- cost telemetry: provider calls, spend, cache hit rate, snapshot age.

**Phase 3** adds cities only after each city passes:

- route/station/transit data and licence;
- traffic coverage and incident quality;
- weather/nowcast coverage;
- local copy review;
- per-city cost and content budget;
- a plan for crowding (model + reports; no fake live).

Candidate order (not a commitment): **Bandung, Surabaya, Yogyakarta**. Each has different transit data availability; validate before promising.

---

## 7. Open questions / risks

1. **Mayar webhook signature** — not documented; API verification is mandatory. Ask Mayar support whether an IP allowlist or signing secret exists.
2. **TomTom game/derived-data terms** — confirm in writing before Phase 2; do not assume the standard API licence covers a commercial game.
3. **PetaBencana commercial licence** — quote/contract required; not in base budget.
4. **KRL/TransJakarta live crowding** — no public API; needs partnership. Do not market "live crowded" until signed.
5. **TransJakarta GTFS access** — portal requires login; request terms.
6. **Exchange-rate and provider price changes** — re-verify quarterly; costs are EUR/USD.
7. **Tax/PKP** — Mayar does not handle sales tax; accountant required.
8. **One-time includes future cities** — attractive but content-cost risky. This research assumes all Pejuang Nafkah maps, not future games/spin-offs. Confirm before publishing the promise.
9. **Cost caps** — a viral month or a provider price change can erase subscription margin; enforce daily/monthly budget and degrade gracefully.

---

## 8. Sources (retrieved 2026-10-19)

### Mayar

- [Pricing](https://mayar.id/pricing)
- [Fees](https://docs.mayar.id/mor/fees)
- [Merchant of Record introduction](https://docs.mayar.id/mor/introduction)
- [Membership (SaaS)](https://docs.mayar.id/features/productpage/saas)
- [Webhook](https://docs.mayar.id/integration/webhook)
- [Create invoice](https://docs.mayar.id/api-reference-v2/invoice/create)
- [Create payment request](https://docs.mayar.id/api-reference-v2/reqpayment/create)
- [Register membership member](https://docs.mayar.id/api-reference-v2/membership/register)
- [Create membership invoice](https://docs.mayar.id/api-reference-v2/membership/createinvoice)
- [Membership member detail](https://docs.mayar.id/api-reference-v2/membership/memberdetail)
- [Cancel membership](https://docs.mayar.id/api-reference-v2/membership/cancel)
- [Transaction detail](https://docs.mayar.id/api-reference-v2/transaction/detail)
- [API rate limit](https://docs.mayar.id/api-reference-v2/rate-limit)
- [Business verification](https://docs.mayar.id/businessverify)
- [Security](https://docs.mayar.id/mor/security)

### Traffic / weather / flood / transit

- [TomTom pricing](https://docs.tomtom.com/pricing)
- [TomTom Flow Segment Data](https://docs.tomtom.com/traffic-api/documentation/tomtom-maps/v1/traffic-flow/flow-segment-data)
- [TomTom Incident Details](https://docs.tomtom.com/traffic-api/documentation/tomtom-orbis-maps/v2/traffic-incidents/incident-details)
- [Google Routes billing](https://developers.google.com/maps/documentation/routes/usage-and-billing)
- [Google Maps Platform pricing](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Google Maps Platform terms](https://cloud.google.com/maps-platform/terms)
- [BMKG forecast data](https://data.bmkg.go.id/prakiraan-cuaca/)
- [BMKG nowcast data](https://data.bmkg.go.id/peringatan-dini-cuaca/)
- [Open-Meteo pricing](https://open-meteo.com/en/pricing)
- [Open-Meteo licence](https://open-meteo.com/en/licence)
- [PetaBencana API](https://docs.petabencana.id/routes.md)
- [PetaBencana commercial licence](https://docs.petabencana.id/informasi-lisensi-data/penggunaan-komersial-cc-by-4.0.md)
- [PetaBencana flood gauges](https://docs.petabencana.id/master-1/routes/floodgauges.md)
- [TransJakarta GTFS portal](https://gtfs.transjakarta.co.id/)
- [MobilityDatabase](https://mobilitydatabase.org/)

### Exchange rates

- [Wise EUR/IDR](https://wise.com/us/currency-converter/eur-to-idr-rate) (~20,190)
- [Wise USD/IDR](https://wise.com/us/currency-converter/usd-to-idr-rate) (~18,034)
- [Kontan USD/IDR market context, 2026-10-18](https://investasi.kontan.co.id/news/rupiah-masih-dibayangi-sentimen-msci-ini-proyeksi-untuk-senin-1910)
