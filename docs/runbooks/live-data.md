# Live-data runbook (TomTom + BMKG)

**Scope:** Phase 2 Live subscription: traffic/incidents, weather/nowcast, snapshot cache, cost caps, kill switch, provider incidents.

## 1. Sources and licences

| Source         | Data                          | Access                           | Attribution                           |
| -------------- | ----------------------------- | -------------------------------- | ------------------------------------- |
| TomTom Traffic | flow segment + incidents      | commercial API key, server only  | “Traffic © TomTom”                    |
| BMKG           | 3-hour forecast + nowcast/CAP | public, no key, 60 req/min/IP    | “Cuaca © BMKG”                        |
| Open-Meteo     | fallback precipitation        | commercial key only              | “Weather data by Open-Meteo.com”      |
| PetaBencana    | flood reports/gauges          | commercial CC BY agreement first | “Data oleh PetaBencana.id, CC BY 4.0” |

No source may be enabled without a `data_sources` row containing licence, attribution, terms URL, and retrieval date.

## 2. Refresh and cache

- TomTom flow: every 5 min during 06:00–10:00 and 16:00–21:00; every 30 min otherwise. One bbox for incidents.
- BMKG forecast: cache by `adm4` + issuance; nowcast: 10 min.
- Cache key: corridor + source set + time bucket. Single-flight; advisory lock.
- Serve latest snapshot + `asOf`/`expiresAt`; mark `Stale` after expiry.
- Never call a provider per user or per page view.

## 3. Budget and kill switch

- `provider_budgets` per month/provider; `LIVE_PROVIDER_MONTHLY_BUDGET_IDR` hard cap.
- Alerts at 80% and 100%; at 100%, stop fetching and serve stale/estimated data.
- `FEATURE_LIVE_DATA=false`: `/api/v1/live/*` returns `503` with `Retry-After`; free/All Maps unaffected.
- Review calls/spend/cache-hit/freshness weekly in beta.

## 4. Provider failure

- **TomTom 429/5xx:** exponential backoff; keep last snapshot; alert; do not retry per user.
- **BMKG failure:** keep last forecast; weather label `Stale`; traffic can still work.
- **Snapshot worker missed:** surface age; never silently relabel stale as live.
- **Bad data:** flag corridor, exclude from planner if confidence low, log provider/asOf, open incident.

## 5. Subscription/access

- Live endpoints require active `live`; check entitlement server-side.
- On subscription expiry/cancel, stop serving fresh snapshots; keep cached read-only? No — return `403`/upgrade prompt after period end.
- Free/All Maps users see authored/scheduled conditions, not a fake live layer.
- Crowding/transit delay are `Estimasi` with confidence; true live occupancy requires an operator feed.

## 6. Privacy

- Planner uses a corridor/origin/destination chosen from a list; no GPS permission.
- Live reports are opt-in, pseudonymous, rate-limited, moderated; no precise location.
- Logs contain corridor/asOf/source/status, not user email or precise coordinates.

## 7. Cost review template

| Item                       | Value |
| -------------------------- | ----- |
| Active corridors           |       |
| Flow calls / incidents     |       |
| Provider spend             |       |
| Cache hit rate             |       |
| Snapshot freshness p95     |       |
| Subscribers / cost per sub |       |
| Action (throttle/expand)   |       |

## 8. Go-live checklist

- [ ] Provider licences/terms signed; source registry complete.
- [ ] Budget row + alerts + kill switch tested.
- [ ] Snapshot freshness/stale/failure tests pass.
- [ ] Live entitlement expiry/cancel tested.
- [ ] Labels/attribution visible; no “live crowded” claim.
- [ ] On-call contact and provider support case path documented.
