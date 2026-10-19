# Incident runbook

## 1. Severity

| Sev    | Definition                                                                  | Response                                       |
| ------ | --------------------------------------------------------------------------- | ---------------------------------------------- |
| **P0** | Payment/entitlement corruption, data breach, site down, security exploit    | Immediate; freeze payments/deploy; notify user |
| **P1** | Auth broken, checkout unavailable, game unplayable for many, backup failure | Same day                                       |
| **P2** | Degraded performance, single-browser bug, leaderboard issue                 | 2 business days                                |
| **P3** | Cosmetic/content issue                                                      | Next release                                   |

## 2. First 15 minutes

1. **Acknowledge** in the incident log (time, detector, symptom, severity).
2. **Contain**:
   - payments: `FEATURE_PAYMENTS=false`; keep status polling for existing orders.
   - auth: revoke suspicious sessions; rotate secrets if compromised.
   - deploy: roll back to the last good release.
   - abuse: Cloudflare block/rate limit; disable signup if needed.
3. **Preserve** evidence: logs, request IDs, order IDs, callbacks, Sentry events. Do not edit records.
4. **Assess** personal data impact (what data, whose, how many, encryption).
5. **Notify** the user/owner; if P0, use the agreed contact channel.

## 3. Security incident

- Rotate exposed secrets immediately (Mayar key, OAuth secret, DB password, session secret, JWT key).
- Revoke all sessions if account takeover is possible.
- Check admin audit log; disable admin access if suspicious.
- Preserve forensic evidence; do not destroy logs.
- If personal data is involved, follow the PDP breach process (72 h notification when required).
- Consider law enforcement/legal counsel; do not speculate publicly.

## 4. Payment incident

- Freeze checkout if grants may be wrong.
- Reconcile orders/payment_events/entitlements; list affected users.
- Grant missing entitlements (audited) or revoke incorrect ones.
- Refund duplicate/incorrect charges per policy.
- Contact Mayar with account/merchant ID, order/member IDs, timestamps, and verification results.
- Communicate with affected users; no blame; provide a human contact.

## 5. Live-data provider incident

- Freeze the affected provider fetch; serve stale data with a `Stale` label; do not call per user.
- Check `provider_calls`, `provider_budgets`, snapshot age, and affected corridors.
- If the licence/terms are at risk, disable the layer via `FEATURE_LIVE_DATA=false`; maps/All Maps remain.
- Contact the provider with account ID, time window, endpoints, and error codes; preserve request IDs.
- Communicate to Live users if freshness/quality is materially affected.

## 6. Data breach (PDP)

1. Assess: data categories, number of subjects, cause, containment, risk.
2. If required, notify the DPA and affected data subjects **within 72 hours** of awareness, with:
   - description of the breach, when/how;
   - data categories and approximate number of subjects;
   - likely consequences;
   - measures taken/planned;
   - DPO/contact.
3. Document everything; do not delay notification to finish investigation.
4. Offer guidance (phishing, account security).
5. Postmortem + controls + test.

## 6. Communication

- Internal: incident channel, single incident lead, timestamped log.
- External: status page/changelog/support email; factual, no speculation, no PII.
- Support template: acknowledge, what we know, what we are doing, when the next update will be, how to reach a human.
- Postmortem within 5 days: timeline, root cause, impact, detection, response, prevention, owners, dates.

## 7. After

- [ ] Service restored and verified.
- [ ] Affected users/orders reconciled.
- [ ] Secrets rotated if needed.
- [ ] Runbook/test updated.
- [ ] `status.md` updated.
- [ ] Postmortem shared with the user.
