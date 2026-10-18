/**
 * Paywuz.id payment adapter.
 *
 * Production flow:
 *  1. POST /api/payments/checkout  { method, amount, title }
 *  2. Server calls Paywuz REST → returns { reference, checkout_url | qr_payload }
 *  3. User pays via QRIS / GoPay / OVO / VA
 *  4. Paywuz webhook → POST /api/payments/webhook → unlocks entitlement
 *
 * Without VITE_PAYWUZ_ENDPOINT the adapter runs a local demo confirmation
 * so the full game pass can be exercised offline.
 */

export type PayMethod = 'qris' | 'gopay' | 'ovo' | 'va';

export interface CheckoutInput {
  method: PayMethod;
  amount: number;
  title?: string;
  endpoint?: string;
}

export interface CheckoutResult {
  ok: boolean;
  ref?: string;
  message: string;
  demo?: boolean;
}

export async function createPaywuzCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const endpoint = input.endpoint ?? (import.meta.env.VITE_PAYWUZ_ENDPOINT as string | undefined);

  if (endpoint) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: 'paywuz',
          method: input.method,
          amount: input.amount,
          currency: 'IDR',
          title: input.title ?? 'WNI Pejuang Nafkah — Full Game Pass',
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        reference?: string;
        checkout_url?: string;
        message?: string;
      };
      if (res.ok && data.ok !== false) {
        return {
          ok: true,
          ref: data.reference ?? data.checkout_url ?? 'PAYWUZ',
          message: 'OK',
        };
      }
      return { ok: false, message: data.message ?? 'Checkout gagal' };
    } catch {
      return { ok: false, message: 'Network error ke Paywuz' };
    }
  }

  await new Promise((r) => setTimeout(r, 900));
  return {
    ok: true,
    ref: `DEMO-${Date.now().toString(36).toUpperCase()}`,
    message: 'OK',
    demo: true,
  };
}

export function formatIdr(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}
