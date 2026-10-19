# Security policy

## Reporting a vulnerability

Email **`wniseries@gmail.com`** with:

- a description of the issue and impact;
- reproduction steps / proof of concept;
- affected URL, account type, and timestamp;
- whether personal data or payments are involved;
- your preferred contact and credit name.

Please do **not** open a public issue, post details on social media, or test against other users’ accounts/data. Do not run destructive load tests or automated scanners against production without written permission.

## What we care about most

- Payment tampering, forged/replayed Mayar callbacks (verified via API), double grants, refund fraud.
- Entitlement bypass or paid-content leakage.
- Account takeover, OTP abuse, session/CSRF flaws.
- IDOR on orders, saves, runs, devices, privacy requests.
- XSS, CSP bypass, supply-chain compromise.
- Any exposure of personal data (email, IP, order history, support content, subscription IDs, live planner inputs).
- Provider-key exposure (Mayar, TomTom, BMKG) or live-data budget bypass.
- Admin/Cloudflare Access bypass.

## Response targets

| Severity                                  | Acknowledge     | Triage/update   |
| ----------------------------------------- | --------------- | --------------- |
| Critical (payments/data/account takeover) | 24 h            | 72 h            |
| High                                      | 2 business days | 5 business days |
| Medium/low                                | 5 business days | next release    |

We will confirm scope, keep you updated, and credit you if you want. We do not currently run a paid bounty.

## Safe harbour

Good-faith research that respects this policy, avoids privacy violations, avoids service disruption, and gives us reasonable time to fix will not be pursued legally by us. This does not bind third parties or override applicable law.

## Supported scope

- `https://wniseries.ahaqqu.com` and its `/api`, `/play`, `/checkout` surfaces owned by WNI Series.
- Out of scope: Cloudflare/Mayar/Google/Resend infrastructure itself, social engineering, physical attacks, spam, DoS, third-party sites.

## Our commitments

- No secrets in client bundles or logs.
- Server-side prices, entitlements, and leaderboard validation.
- Payment callbacks treated as untrusted and verified against Mayar’s API; idempotent grants; no payload-based entitlement.
- Least-privilege admin access with audit.
- Encryption in transit; encrypted backups; data minimisation.
- 72-hour breach notification when required by Indonesian PDP law.
- Dependency/secret scanning and a documented incident runbook.

## Do not

- Access, modify, or exfiltrate other users’ data.
- Use real payment instruments you do not own.
- Pivot from a finding into a sustained intrusion.
- Publicly disclose before a fix is available.

Thank you for helping keep players and their data safe.
