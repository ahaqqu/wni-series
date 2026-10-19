# ADR-0003 — Mayar hosted checkout + SaaS membership

- **Status:** accepted
- **Date:** 2026-10-19
- **Owners:** WNI Series
- **Research brief:** [live-data/Mayar research](../games/pejuang-nafkah/research/2026-10-live-data-and-mayar.md)
- **Evidence:** fee table, invoice/payment-request APIs, SaaS membership APIs, webhook docs
- **Revalidate:** 30 days before checkout implementation; on fee/terms change; before KYC

## Context

A personal merchant needs QRIS/e-wallet/VA/card coverage, a one-time All Maps product, and a recurring Live product, without app-store fees or a large PCI scope. Mayar provides hosted checkout and SaaS membership, but its public webhook docs do not document a signature and Mayar does not process sales tax.

## Decision

Use **Mayar only** for payments: Invoice/Payment Request for All Maps Rp 79,000 once; SaaS membership/tier for Live Rp 49,000/month. Treat callbacks as untrusted triggers: re-fetch transaction/member state from Mayar, verify merchant/product/amount/customer, deduplicate, and grant idempotently. Manual refund/cancellation workflow; gross prices; tax confirmed before launch.

## Consequences

- Positive: hosted checkout, local methods, one-time + recurring, reduced PCI scope.
- Negative: no documented webhook signature; no public refund API; MoR does not process sales tax; API rate limit 50/min/key.
- Security: API re-fetch is mandatory; never grant from payload/redirect; secrets server-only; callback path secret + rate limit.
- Cost: QRIS + Starter ~2.2% one-time / ~4.7% Live; Business break-even ~712 subs.
- Operations: daily reconciliation, manual refunds, cancellation/expiry jobs.

## Alternatives considered

| Option               | Why rejected                                                |
| -------------------- | ----------------------------------------------------------- |
| Direct card capture  | PCI scope and fraud burden.                                 |
| Other local gateways | No written provider decision; Mayar covers one-time + SaaS. |
| App-store IAP        | Fees, platform control, wrong distribution model.           |

## Revalidation

Confirm KYC, product/tier IDs, payout, webhook signature/IP allowlist, and tax treatment before production. Recheck fees/terms quarterly.
