# Privacy request runbook

**Contact:** `wniseries@gmail.com`
**Target:** acknowledge within 2 business days; complete within 14 days (max 30, with notice).

## 1. Verify identity

- Request from the account’s verified email, or
- Signed-in account request with re-authentication.
- Do not disclose account data to an unverified third party.
- Log the request ID, date, type, verification method (no unnecessary ID copies).

## 2. Request types

| Type                  | Action                                                                                                                         | Notes                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Access/export         | Generate JSON/CSV of profile, saves, runs, orders, subscriptions, entitlements, live planner inputs, live reports; secure link | Redact internal notes/secrets and provider keys              |
| Rectification         | Update display name/avatar/locale; email change requires re-auth                                                               | Keep audit                                                   |
| Deletion              | Soft-delete → revoke sessions → 30-day grace → hard-delete/anonymize                                                           | Retain orders/tax records as legally required; tell the user |
| Portability           | Export machine-readable copy                                                                                                   | Same as access                                               |
| Objection/restriction | Stop marketing/analytics; restrict processing where applicable                                                                 | Confirm in writing                                           |
| Automated decision    | Explain leaderboard validation/anti-cheat outcome                                                                              | Human review on request                                      |

## 3. Deletion checklist

- [ ] Verify identity.
- [ ] Revoke all sessions/devices.
- [ ] Mark account deleted; disable login.
- [ ] Delete/minimize profile, saves, runs, avatars, telemetry identifiers, live planner inputs/reports.
- [ ] Retain orders/payment/tax records with a documented legal basis; disassociate where possible.
- [ ] Notify processors (Resend/Sentry/Mayar) per their retention; remove from marketing lists; cancel active Live subscription if the user requests account deletion.
- [ ] Confirm to the user; record completion.
- [ ] Hard-delete after the grace period; verify backup expiry (≤30 days).

## 4. Breach overlap

If the request reveals a breach or unauthorized access, switch to [incident.md](incident.md) immediately. Do not promise confidentiality you cannot keep; preserve evidence.

## 5. Log

Keep a privacy request register (no sensitive payloads):

| ID  | Date | Type | Verified | Status | Completed | Notes |
| --- | ---- | ---- | -------- | ------ | --------- | ----- |

Review quarterly; ensure no request exceeds the deadline without a documented reason.
