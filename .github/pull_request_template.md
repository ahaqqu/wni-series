## What changed

<!-- One paragraph. Link the phase and requirement IDs (e.g., Phase 1 / KRL-01). -->

## Why

<!-- The user problem or gate this advances. -->

## Research gate (required for plans/implementation)

- [ ] Current research brief linked; ADR linked for the choice.
- [ ] Sources dated; volatile facts within freshness; two independent confirmations for fares/stations/schedules/rules.
- [ ] Latest tech checked against official versions/support/security; benchmarked on reference devices.
- [ ] Threat model/data map updated; security abuse cases covered.
- [ ] Performance/load evidence at 2× peak; cost model with worst case/caps/FX/date.
- [ ] Scaling/robustness: failure/degraded/rollback path; what breaks at 10× stated.
- [ ] WNI emotional/physical experience evidence (or approved gap); native/punch-down review.

## Verification (required)

- [ ] `pnpm verify` passes (or the phase subset is listed below)
- [ ] Tests added/updated for the new behavior
- [ ] Screenshots/video at 390×844 and 1440×900 (UI changes)
- [ ] Performance checked on a reference device (game/web changes)
- [ ] Security review: no client trust, authz, secrets, payment invariants
- [ ] Privacy review: no new personal data without a data-map/retention entry
- [ ] Accessibility: keyboard, screen reader, contrast, reduced motion
- [ ] Content: sources/dates/station order/fares/attribution (content changes)

Commands run:

```text
pnpm verify
```

Evidence path:

```text
artifacts/verification/<phase>/<date>/
artifacts/research/<phase>/<date>/
```

Research brief/ADR:

```text
docs/games/.../research/...md
docs/adr/NNNN-...md
```

## Risks / rollback

<!-- What could break? How do we roll back? Any migration/feature flag? -->

## Screenshots / clips

<!-- Drag files here. Redact emails, tokens, full IPs, and personal data. -->
