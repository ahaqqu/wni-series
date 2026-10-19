# Payments runbook (Mayar)

**Scope:** one-time All Maps (Rp 79,000), Live subscription (Rp 49,000/month), refunds, cancellation, reconciliation, and payment incidents.

> **P0:** Mayar's public webhook docs do **not** document a signature. A callback is a trigger, not proof. The server must fetch the transaction/member from Mayar's API before granting or extending anything.

## 1. Products and configuration

| Product   | SKU               | Mayar primitive                        |    Price (gross) | Entitlement                      |
| --------- | ----------------- | -------------------------------------- | ---------------: | -------------------------------- |
| All Maps  | `pn-all-maps`     | Invoice / Payment Request              |        Rp 79,000 | `maps_all` (permanent)           |
| Live      | `pn-live-monthly` | Membership (SaaS) tier, 1-month period |  Rp 49,000/month | `maps_all` + `live` while active |
| Cosmetics | `pn-cosmetic-*`   | Invoice                                | Rp 15,000–25,000 | cosmetic key                     |

Required server env: `MAYAR_ENV`, `MAYAR_API_KEY`, `MAYAR_PRODUCT_ID_ALL_MAPS`, `MAYAR_PRODUCT_ID_LIVE`, `MAYAR_TIER_ID_LIVE`, `MAYAR_WEBHOOK_PATH_SECRET`, `MAYAR_RETURN_URL`.

Sandbox base: `https://api.mayar.io/hl/v2`. Production: `https://api.mayar.id/hl/v2`. Rate limit: **50 requests/minute per API key**; queue/cache.

## 2. One-time All Maps

1. Create our order with server-side price 79,000 and unique `orderRef`.
2. Call Mayar `POST /invoices/create` with `items`, customer, `extraData: { orderId, userId, sku }`.
3. Store the returned invoice/transaction ID and link; redirect the user.
4. On `payment.received` (or return), **call** `GET /transactions/{id}`.
5. Verify:
   - merchant/account is ours;
   - status is paid;
   - amount is 79,000;
   - customer/email maps to our user;
   - `extraData.orderId` matches our order.
6. In one DB transaction: mark order `PAID`, grant `maps_all`, append audit/outbox.
7. Duplicate/replayed event: no-op 200. Forged event: API check fails → no grant.

Do not use `redirectUrl` params, `paymentUrl` query params, or the webhook payload as the grant source.

## 3. Live subscription

1. Create/reuse a local subscription row (`PENDING`).
2. Create/reuse a Mayar SaaS member (`POST /memberships/members/create`) with product/tier/customer.
3. Create a membership invoice (`POST /memberships/members/{memberId}/invoice/create`); redirect to `membershipBillUrl`.
4. On `membership.newMemberRegistered`/`payment.received`, call `GET /memberships/members/{memberId}?productId=...`.
5. Verify product/tier, customer, status (`active`), `expiredAt`/`nextPayment`, and amount.
6. Grant `maps_all` + `live` until `current_period_end`; store provider IDs.
7. Renewal: re-fetch member detail; extend. Expiry: `memberExpired` → revoke `live` at period end; keep `maps_all` if owned separately.
8. Cancel: call `POST /memberships/members/{memberId}/cancel`; set `cancel_at_period_end`; keep access until `expiredAt`. Do not revoke immediately unless the user explicitly terminates and support approves.
9. Grace period: use Mayar tier grace (recommended 0–3 days); document the exact value. Never grant indefinitely.

## 4. Entitlements

- `maps_all`: permanent, one active row per user/game. Source: one-time order, or Live subscription while active (but expiry must not revoke an independently purchased `maps_all`).
- `live`: time-bound; source subscription; `expires_at` = period end.
- `free_route`: chosen corridor; one courtesy change within 14 days; further changes require `maps_all`.
- Entitlement grant/revoke and order/subscription updates are transactional and audited.
- Paid content manifests require entitlement; the client flag is never trusted.

## 5. Reconciliation

Run daily and before payouts:

- orders `PENDING` older than 5 min → query Mayar invoice/transaction; update or expire.
- subscriptions `ACTIVE` → member detail; compare `expiredAt`/status; fix drift.
- entitlements without a paid source or active period → alert; revoke after review.
- Mayar paid transaction without our order → manual review; never auto-grant.
- settlement/payout report vs paid orders → mismatch ticket.
- alert on: paid without entitlement, entitlement without source, amount mismatch, repeated verification failures, subscription expiry not processed.

## 6. Refunds and chargebacks

Mayar has no public refund API. Manual workflow:

1. Verify order/subscription, reason, and refund eligibility.
2. Process bank transfer/approved Mayar mechanism; record proof reference.
3. Revoke one-time entitlement after refund (or at the agreed effective date).
4. For subscription, cancel and decide effective date; no partial-month refund by default except statutory/goodwill.
5. Add audit entry, send receipt/refund email, update reconciliation.
6. Chargeback: freeze entitlement, preserve evidence (API results, receipts, access logs), respond to Mayar/bank; flag repeat abuse.

## 7. Tax and MoR

- Mayar is a Merchant of Record for checkout but **does not process sales tax**; we remain responsible.
- Prices are gross. If PKP, PPN 11% is included; if not, no PPN. Accountant sign-off required.
- Receipts: order ID, SKU, gross amount, tax (if applicable), support email.
- Keep gross/net/tax columns separate in reporting.

## 8. Fees (planning, 2026-10-19)

- QRIS 0.7%; e-wallet 1.5%; VA Rp 4,000; card 2.6% + Rp 2,000; withdrawal Rp 2,775.
- Admin: invoice/payment request 1.5% Starter; subscription 4% Starter / 3% Business. Business plan Rp 349k/month.
- Net at QRIS+Starter: All Maps Rp 77,262; Live Rp 46,697/month. Re-check before launch.

## 9. Incidents

- **Mayar outage:** checkout shows retry; existing entitlements unaffected; do not create duplicate orders.
- **Verification failing:** stop grants, keep webhook events, alert, contact Mayar with transaction IDs/timestamps.
- **Suspected forgery:** rate-limit/block source, preserve payload hash, verify no grants occurred, rotate webhook path secret if exposed.
- **Wrong entitlement:** audit order/subscription, correct in a transaction, notify user.
- **Secret leak:** rotate Mayar API key, revoke webhook config, audit orders, notify if personal data affected.

## 10. Go-live checklist

- [ ] Mayar KYC approved; production keys in secret manager.
- [ ] Sandbox one-time + subscription E2E; renewal/expiry/cancel tested.
- [ ] Webhook forged/replay tests pass; API re-fetch mandatory.
- [ ] Refund/chargeback runbook tested.
- [ ] Reconciliation clean for 7 days in staging; alerts fire.
- [ ] Tax/PSE/terms/privacy/refund/cancellation published.
- [ ] Support template + one real low-value transaction verified before public launch.
