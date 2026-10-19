# Runbook — daily drama

**Phase:** 2D (not implemented yet)
**Owner:** project owner
**Invariant:** the agent researches and drafts; **a human approves every card and the final pack**. There is no auto-publish path.

---

## 1. Daily timeline (Asia/Jakarta)

| Time                | What happens                                                            | If it fails                                 |
| ------------------- | ----------------------------------------------------------------------- | ------------------------------------------- |
| 00:00               | Research job starts; source snapshot, facts, risk screen, AI candidates | Last approved/evergreen pack remains; alert |
| ~00:30              | 3–10 candidates in the review queue (never public)                      | Alert; owner can retry                      |
| Any time            | Owner reviews, comments, regenerates, approves cards                    | No publish; fallback                        |
| After pack approval | Signed pack published to production; game picks it up                   | Rollback to previous pack                   |
| 06:00               | Soft warning if no pack is approved                                     | Do not auto-publish; fallback               |

The job is idempotent per `pack_date`. A late run still creates candidates; it never publishes.

## 2. Owner review checklist

- [ ] Sources are allowlisted; ≥2 independent sources for factual claims (or explicit single-source block).
- [ ] No names, faces, voices, usernames, precise locations, minors, victims, or active legal cases.
- [ ] No politics/religion/ethnicity, health misinformation, sexual content, self-harm, terrorism, communal conflict, or recent tragedy.
- [ ] The card is clearly fictionalised/composite; the `fictionalised` note is specific.
- [ ] At least 2 responses and one viable out; no unwinnable drama.
- [ ] Tone: bercanda dan santai, no punch-down; a serious beat gets warmth/silence.
- [ ] Share headline has no identifying detail.
- [ ] Preview on mobile; card fits, labels are visible.
- [ ] Comment for changes, regenerate, **re-approve** the new revision.
- [ ] Approve each card, then the final pack. Nothing publishes before both.

## 3. Publish

1. Confirm every included card is `approved` and the final preview matches the selected revisions.
2. Confirm `AUTO_PUBLISH_DAILY_DRAMA=false` and `FEATURE_DAILY_DRAMA=true`.
3. Approve the pack with 2FA. The server writes an approval record bound to the content hash.
4. Publish; verify the signed manifest, checksum, and game fetch.
5. Verify a run pins the new `packId`; old runs still replay on their old pack.
6. Update `status.md` with the pack ID and evidence.

## 4. Rollback / correction

- **Unpublish:** set the pack `retired`, publish the previous approved pack; purge CDN; verify game fallback.
- **Correction:** create a new pack version with `supersedes_pack_id`; never mutate the old one.
- **Harmful card:** disable by ID immediately (`FEATURE_DAILY_DRAMA=false` or kill list), preserve audit, notify owner, document in changelog.
- **PII/legal incident:** follow the privacy/incident runbooks; preserve logs, do not delete evidence, notify as required.

## 5. Failure handling

| Failure                         | Action                                          |
| ------------------------------- | ----------------------------------------------- |
| Source/API down                 | Skip source; if no candidates, fallback; alert  |
| Model down/timeout              | Retry bounded; fallback; no partial publish     |
| Owner unavailable               | Fallback; no auto-publish; skip day             |
| Candidate rejected              | Keep history; regenerate on comment; no publish |
| Pack signature/checksum invalid | Do not serve; fallback; alert                   |
| Game fetch fails                | Last verified pack/evergreen; no error screen   |
| Spend cap reached               | Stop generation; fallback; alert                |

## 6. Privacy/legal checks

- No personal data in source captures, prompts, candidates, or logs.
- Source registry has licence/terms; no social scraping.
- AI provider terms: no training on our content, retention/region approved.
- Approval/audit records retained; candidate retention 24 months, rejected 90 days.
- Transparency label present in game: fictionalised, AI-assisted, human-reviewed, not news.
- Correction/takedown path tested.

## 7. Kill switches

- `FEATURE_DAILY_DRAMA=false` — stop generation and serving new daily packs; game falls back.
- `AUTO_PUBLISH_DAILY_DRAMA=false` — must always be false; treat `true` as a security incident.
- Publish credential revocation — revoke the publish role/key; keep candidates/review intact.

## 8. Evidence to store

- Pack ID, content version, approval ID, checksums.
- Candidate/source counts, reject reasons, revision count, approval time.
- Owner approval records (no personal data of subjects).
- Screenshots/preview of the published pack.
- Fallback test and rollback test.
- Cost (sources/tokens/storage) for the day.
