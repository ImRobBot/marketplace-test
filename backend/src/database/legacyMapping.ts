import type { OrderStatus } from '../models/order';
import type { PaymentStatus } from '../models/payment';

interface LegacyState {
  order: OrderStatus;
  payment: PaymentStatus;
}

export function legacyOrderState(status: unknown): LegacyState {
  if (status === 'paid') return { order: 'paid', payment: 'paid' };
  if (status === 'cancelled') return { order: 'cancelled', payment: 'cancelled' };
  if (status === 'payment_failed') {
    return { order: 'payment_failed', payment: 'failed' };
  }
  return { order: 'pending_payment', payment: 'pending' };
}

export function toAmountCents(value: unknown): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`Invalid legacy order total: ${String(value)}`);
  }
  return Math.round(amount * 100);
}
