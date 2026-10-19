# Runbooks

Operational procedures for the WNI Series platform. They are written for a small team and an agent that must be able to execute and verify safely.

| Runbook                                  | Use when                                                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [deploy.md](deploy.md)                   | Releasing platform/game/API, rolling back, purging cache                                                                       |
| [payments.md](payments.md)               | Configuring Mayar, one-time/subscription callbacks, API verification, reconciliation, refunds, cancellation, payment incidents |
| [live-data.md](live-data.md)             | TomTom/BMKG feeds, snapshot cache, cost caps, kill switch, provider incidents                                                  |
| [daily-drama.md](daily-drama.md)         | Daily research/draft, owner approval, publish/rollback/correction, no-auto-publish evidence                                    |
| [backup-restore.md](backup-restore.md)   | Backups, restore drills, disaster recovery                                                                                     |
| [incident.md](incident.md)               | Outage, security incident, data breach, payment incident                                                                       |
| [privacy-request.md](privacy-request.md) | Access/export/delete/rectify requests                                                                                          |

## Rules

- Production changes require a green CI run and, until the pipeline is proven, a second pair of eyes.
- Never paste secrets, full emails, tokens, or IPs into tickets/logs.
- Every destructive action has a backup and a rollback.
- After an incident, write a postmortem and link it from `status.md`.
