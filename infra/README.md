# infra

Production scaffolding for the netcup VPS + Cloudflare edge. Nothing here is deployed yet.

| Path                            | Purpose                                          |
| ------------------------------- | ------------------------------------------------ |
| `caddy/Caddyfile`               | Origin routing and security headers              |
| `compose/compose.yaml`          | Caddy + cloudflared + API + PostgreSQL + migrate |
| `cloudflared/README.md`         | Tunnel setup, Access, WAF, Mayar webhook notes   |
| `systemd/wni-backup.*`          | 6-hourly encrypted backup timer                  |
| `../scripts/backup-postgres.sh` | Backup/upload/prune script                       |

## First-time sequence

1. Cloudflare Tunnel + DNS (`wniseries.ahaqqu.com`).
2. VPS hardening, Docker, `/srv/wni` layout, secrets file.
3. Copy `caddy/Caddyfile` and `compose/compose.yaml` to `/srv/wni/`.
4. Start Postgres; run migrations; start API/Caddy/cloudflared.
5. Add backup timer + rclone remote; run a restore drill.
6. Configure WAF/rate limits/Access; run a sandbox payment end-to-end.

See [deploy runbook](../docs/runbooks/deploy.md) and [architecture.md](../docs/games/pejuang-nafkah/architecture.md) §14.
