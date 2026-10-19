# Backup & restore runbook

**Target:** RPO ≤6 h, RTO ≤2 h for v1. Quarterly restore drill.

## 1. What is backed up

- PostgreSQL: full logical dump every 6 h + nightly; encrypted.
- Object storage (R2): paid assets/manifests are reproducible from source; backups are the DB + release artifacts.
- Static releases: rebuildable from git; keep the last 5 release directories for instant rollback.
- Secrets: in a password manager + GitHub Environments; **not** in the DB backup.

## 2. Schedule

| Job                                     | Frequency    | Retention             |
| --------------------------------------- | ------------ | --------------------- |
| `pg_dump -Fc`                           | every 6 h    | 30 daily, 12 weekly   |
| Full verification (`pg_restore --list`) | daily        | log only              |
| Restore drill                           | quarterly    | report in `status.md` |
| Release retention                       | every deploy | last 5                |

Backups upload to a private R2 bucket (or offsite S3-compatible). Encrypt with `age` before upload; keep the private key offline + escrow.

## 3. Backup command (target)

```bash
#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
OUT=/srv/wni/shared/backups/wni-$STAMP.dump
docker compose exec -T postgres pg_dump -Fc -U wni -d wni > "$OUT"
age -r "$AGE_PUBLIC_KEY" -o "$OUT.age" "$OUT"
rclone copy "$OUT.age" r2:wni-private/db/
rm -f "$OUT"
curl -fsS "$HEALTHCHECK_URL" >/dev/null
```

- Verify `pg_restore --list "$OUT.age"` after decrypting in a temp dir.
- Alert if no successful backup in 8 h.

## 4. Restore

1. **Declare** the incident and stop writes (maintenance mode / stop API).
2. Provision a fresh Postgres volume or a throwaway DB.
3. Download + decrypt the latest good dump.
4. `pg_restore -d wni_restore --no-owner --clean --if-exists`.
5. Verify:
   - migrations table version
   - row counts: users, orders, entitlements, runs
   - payment invariants: no PAID without entitlement
   - a known test account can sign in (staging only)
6. Point the API at the restored DB; start; smoke test.
7. Reconcile payments and subscriptions since the backup timestamp with Mayar; repair with audit.
8. Communicate; postmortem.

## 5. Disaster recovery (new VPS)

1. Provision Ubuntu 24.04/Debian 13, 2 vCPU/4 GB, Docker.
2. Restore SSH/Tailscale access, UFW, unattended upgrades.
3. Clone repo at the last release SHA; recreate `/srv/wni/.env` from the password manager.
4. `docker compose up -d postgres`; restore latest dump; run migrations.
5. Start API, Caddy, cloudflared; switch DNS/Tunnel; purge cache.
6. Smoke: health, auth, game boot, checkout sandbox/status, one paid order lookup.
7. Verify backups resume; record RTO.

## 6. Drill evidence

- Date, operator, backup timestamp, restore target, row counts, duration, issues.
- Store in `artifacts/verification/ops/<date>/report.md` and update `status.md`.
- Never test restore over the production database.
