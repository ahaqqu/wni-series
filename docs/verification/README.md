# Verification & evidence

This is the operational contract for “done”. It applies to every phase and every game in WNI Series.

## 1. The rule

> A gate is green only when it has been **run on the current commit**, its **evidence is stored**, and a human/agent has **inspected the result**. A skipped or disabled gate is a failed gate.

**Research is a gate.** A detailed plan or implementation without a current research brief/ADR and the evidence in [the protocol](../games/pejuang-nafkah/research/PROTOCOL.md) is not ready to start.

## 2. Test tiers

| Tier            | Command (target)        | Evidence                                                                 |
| --------------- | ----------------------- | ------------------------------------------------------------------------ |
| Research        | manual + PR review      | brief, ADR, source log, benchmark, cost/security/UX notes; freshness     |
| Docs & scaffold | `pnpm verify:docs`      | console output, link report                                              |
| Unit            | `pnpm test`             | coverage summary, failing test names                                     |
| Contract        | `pnpm test:contract`    | schema/route coverage                                                    |
| Integration     | `pnpm test:integration` | Postgres/Mayar mock logs (redacted)                                      |
| E2E             | `pnpm test:e2e`         | Playwright HTML report, trace, screenshots, video                        |
| Payment sandbox | `pnpm test:payments`    | Mayar order/member IDs, API verification, DB assertions (redacted)       |
| Live data       | `pnpm test:live`        | fixture snapshots, source/freshness/confidence, cost-cap and stale tests |
| Performance     | `pnpm test:perf`        | Lighthouse JSON, FPS CSV, renderer.info                                  |
| Security        | `pnpm test:security`    | audit, gitleaks, ZAP, authz matrix                                       |
| Accessibility   | `pnpm test:a11y`        | axe JSON + manual checklist                                              |
| Content         | `pnpm verify:content`   | schema/station/fare/door-side/attribution report                         |
| Deploy          | CI deploy workflow      | smoke output, release SHA, rollback proof                                |

Today the docs/scaffold and landing/API build/test tiers are active. Game/E2E/payment/live tiers become active with their phases. Do not invent a passing test.

## 3. Evidence folder

```text
artifacts/verification/<phase>/<YYYY-MM-DD>/
  report.md            # commit SHA, commands, results, known issues, next step
  research/            # brief/ADR links, source log, benchmark JSON, redacted UX notes
  checklist.md         # manual sign-off, device names, testers
  screenshots/         # 390×844, 1440×900, key states
  video/               # 30–90 s gameplay/payment flow
  traces/              # Playwright trace.zip
  performance/         # Lighthouse JSON, FPS CSV, renderer.info
  security/            # redacted reports
  payment/             # redacted order IDs/callbacks
  db/                  # query assertions, no PII
```

- Generated files are gitignored; `report.md` and `checklist.md` may be committed.
- Redact emails, tokens, full IPs, session cookies, and personal data.
- Include `git rev-parse HEAD` and the content version in `report.md`.
- Link the CI run and the PR.

## 4. Agent self-verification protocol

1. Read the phase scope in `plan.md`, the relevant MUSTs in `specs.md`, the architecture section, and the current research brief/ADR.
2. Check source freshness; if a fact/price/version/licence is stale, stop and re-run the research gate.
3. Write the smallest vertical slice and its acceptance criteria before coding.
4. Add/adjust tests first for the new behavior.
5. Implement without expanding scope silently.
6. Run the phase command set; capture evidence.
7. **Look** at screenshots/video and read the perf profile. A green test does not prove the game feels right.
8. Fix and repeat. If a product decision is missing, stop and ask.
9. Update `status.md` with what changed, evidence links, known issues, next step.
10. Self-review: security, privacy, accessibility, performance, cost, content accuracy, source freshness.
11. Do not claim done without evidence; never weaken a gate to pass.

## 5. Gate checklist (copy per phase)

- [ ] Research brief/ADR current; sources within freshness; no unverified volatile fact.
- [ ] All MUST requirements in scope pass.
- [ ] Unit/contract/integration/E2E green.
- [ ] No P0/P1 bugs; no console errors; no unhandled rejections.
- [ ] Performance budgets met on reference devices; 2× peak/load evidence where applicable.
- [ ] Security: no critical/high; authz/payment tests pass.
- [ ] Privacy: no new data without a map/retention entry.
- [ ] Accessibility: axe + manual keyboard/screen reader.
- [ ] Content: sources, dates, station order, fares, attribution.
- [ ] Cost: provider price/FX/date, worst case, caps, unit economics.
- [ ] Scaling/robustness: failure/degraded/rollback path; what breaks at 10× stated.
- [ ] WNI experience: physical/emotional evidence or approved gap; native/punch-down review.
- [ ] Visual evidence at mobile + desktop.
- [ ] `status.md` updated; report/checklist committed.

## 6. Reference devices & conditions

| Class           | Example                                  | Use                           |
| --------------- | ---------------------------------------- | ----------------------------- |
| Low-end Android | Redmi 13C / Galaxy A15, 4 GB RAM         | 30 fps floor, boot, memory    |
| Mid Android     | Pixel 7a / Galaxy A55                    | 60 fps target, thermal        |
| iPhone          | iPhone 12/13 Safari                      | WebKit, memory, PWA           |
| Desktop         | MacBook M1 / Windows GTX 1650            | Layout, keyboard, high preset |
| Network         | 4G 1.6 Mbps, 150 ms RTT; 3G for fallback | Load budgets                  |
| CPU             | 4× slowdown (Playwright/CDP)             | Long tasks, input latency     |

Document the exact device/OS/browser in `checklist.md`.

## 7. Security test minimum (Phase 5)

- Price tamper, SKU tamper, amount tamper.
- Webhook invalid signature, wrong merchant, wrong amount, unknown order, duplicate, replay, out-of-order, failed-after-paid.
- IDOR across orders/saves/runs/devices.
- CSRF/origin, session fixation/rotation/logout/revoke.
- OTP brute force, resend abuse, reuse, expiry, enumeration.
- Admin without role, with role, Cloudflare Access bypass attempt.
- XSS in display name/support content; SQLi attempt; SSRF via URL fields.
- Rate limits on auth/checkout/webhook/support/leaderboard.
- CSP report-only → enforced; no inline script; no secrets in bundle.
- Dependency audit, gitleaks, ZAP baseline, authz matrix.

## 8. What “evidence” is not

- A screenshot from an older commit.
- “It works on my machine.”
- A test that was skipped to pass.
- A manual click-through with no record.
- A payment screenshot from the sandbox presented as production.
- A performance claim without a device, profile, and measurement.
