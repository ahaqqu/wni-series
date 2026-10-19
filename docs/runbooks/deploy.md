# Deploy runbook

**Target:** netcup VPS, `/srv/wni`, Cloudflare Tunnel/edge, `wniseries.ahaqqu.com`.

## 0. Preconditions

- [ ] CI green on the commit (docs, lint, type, test, E2E, perf, security as applicable).
- [ ] Phase research brief/ADR current; volatile sources within freshness; benchmark/cost/security/WNI evidence linked.
- [ ] DB backup < 24 h old; restore drill current.
- [ ] Migration is expand/contract; no destructive change in this release.
- [ ] Mayar mode is correct (staging sandbox / production live); Live tier configured.
- [ ] Feature flags set for any risky behavior; payments can be disabled independently.
- [ ] `DEPLOY_ENABLED=true` and GitHub Environment approval configured.

## 1. Build

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm build            # platform + games
docker build -t ghcr.io/ahaqqu/wni-api:$SHA services/api
docker push ghcr.io/ahaqqu/wni-api:$SHA
```

## 2. Upload static release

```bash
rsync -az --delete apps/platform/dist/ deploy@host:/srv/wni/releases/$SHA/platform/
rsync -az --delete games/pejuang-nafkah/dist/ deploy@host:/srv/wni/releases/$SHA/play/pejuang-nafkah/
```

## 3. Migrate + swap + restart

```bash
ssh deploy@host
cd /srv/wni
docker compose run --rm migrate
ln -sfn releases/$SHA current
docker compose up -d api
curl -fsS https://wniseries.ahaqqu.com/api/readyz
```

## 4. Smoke test

- [ ] `/` loads; game page CTA works.
- [ ] `/play/pejuang-nafkah/` boots; one free run starts.
- [ ] `/api/healthz` + `/api/readyz` 200.
- [ ] Auth: Google (staging test account) + email OTP.
- [ ] Checkout: sandbox All Maps + Live open Mayar; callback API verification grants once.
- [ ] No new Sentry error spike; p95 latency normal.
- [ ] Cache headers correct: HTML short/no-cache, hashed assets immutable.

## 5. Cache purge

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE/purge_cache" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

Prefer cache tags/paths over purge-everything once configured.

## 6. Rollback

```bash
ssh deploy@host
cd /srv/wni
ln -sfn releases/$PREVIOUS_SHA current
docker compose up -d api
curl -fsS https://wniseries.ahaqqu.com/api/readyz
```

- If the migration was destructive/backward-incompatible: do **not** roll back the DB blindly; forward-fix and restore from backup only with a written decision.
- Purge cache after rollback.
- Record the rollback and cause in `status.md`.

## 7. After deploy

- [ ] Update `status.md` with release SHA, evidence, known issues.
- [ ] Check payment reconciliation (if payments live).
- [ ] Check backup age/disk.
- [ ] Announce in changelog if user-facing.

## First-time setup (one-off)

1. Create Cloudflare Tunnel; route `wniseries.ahaqqu.com` → `http://caddy:8080`.
2. Install Docker + Compose; create `/srv/wni/{releases,shared}`; deploy user; UFW deny inbound; Tailscale/SSH.
3. Write `/srv/wni/.env` (600) with production secrets.
4. Start `postgres`, run migrations, start `caddy`, `cloudflared`, `api`.
5. Configure Cloudflare WAF/rate limits, Access for `/admin`, cache rules, HSTS.
6. Configure Sentry, uptime, backup healthcheck, Cloudflare purge token.
7. Run the backup restore drill and a sandbox payment end-to-end.
