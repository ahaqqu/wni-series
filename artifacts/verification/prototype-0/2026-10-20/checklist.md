# Prototype 0 checklist — 2026-10-20

**Scope:** standalone Draft 0 push-and-hold mechanic; local only; non-canonical.

## Build and behavior

- [x] Research brief + ADR-0009 exist and are current for 2026-10-20.
- [x] `pnpm typecheck` passes in `games/pejuang-nafkah`.
- [x] `pnpm test` passes: 17/17 (`PA-SIM-01`…`PA-SIM-17`).
- [x] `pnpm build` passes; sizes recorded.
- [x] No page errors in the Chromium capture runs.
- [x] Mobile 390×844 and desktop 1280×900 screenshots captured.
- [x] WebGL context-loss card exists; reduced motion and hidden-tab pause exist.
- [x] Root `pnpm verify:docs` run for the final tree (66 files, 202 links, scaffold).
- [x] Root `pnpm verify` run for the final tree (docs/lint/typecheck, 17 game + 4 API tests, builds).

## Human / real-device

- [ ] One-hand play test on a real phone (390×844 class): hold/drag, gate cut, coffee, protect, board window.
- [ ] 5–8 commuter playtests: failure explanation, tension vs fatigue, door-read fairness, viral tone.
- [ ] Native Indonesian copy review (especially the viral/protect notices).
- [ ] Sensitivity review of the vulnerable-passenger/viral beat.
- [ ] Real-device FPS on low-end Android and iPhone; 30 fps floor.
- [ ] axe/accessibility and screen-reader pass.
- [ ] E2E trace or video of an uninterrupted run.
- [ ] Offline/service-worker check.
- [ ] No PII/network calls verified in the final build.

## Sign-off

- Tester: unassigned
- Device/browser used for this report: headless Chromium 1248 / SwiftShader (not a perf device)
- Verdict: **local prototype only; no release, no deploy, no canonical integration.**
