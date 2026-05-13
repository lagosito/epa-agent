import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-10-28.acacia' as any,
  typescript: true,
});

export const PRICE_PRO_MONTHLY = process.env.STRIPE_PRICE_PRO_MONTHLY ?? '';
export const PRICE_PRO_YEARLY = process.env.STRIPE_PRICE_PRO_YEARLY ?? '';

export function tierFromPriceId(priceId: string | null | undefined) {
  if (priceId === PRICE_PRO_MONTHLY) return 'pro_monthly';
  if (priceId === PRICE_PRO_YEARLY) return 'pro_yearly';
  return 'free';
}
