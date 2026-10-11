import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

// ── Product & price (change here) ─────────────────────────────
export const PRODUCT_NAME = 'InMedina Discovery Adventures'
export const PRODUCT_DESCRIPTION = 'Masjid al-Nabawi Hunt - One-time payment for your team'
export const PRICE_CENTS = 2900 // $29.00
export const CURRENCY = 'usd'

export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  httpClient: Stripe.createFetchHttpClient(),
})

// Server-side Supabase client with full access (never sent to the browser).
export const admin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } },
)

// Save (or update) a paid Checkout Session in the payments table.
export async function recordPaidSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== 'paid') return
  const { error } = await admin.from('payments').upsert(
    {
      stripe_session_id: session.id,
      stripe_payment_intent:
        typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
      email: session.customer_details?.email?.toLowerCase() ?? null,
      amount_total: session.amount_total ?? 0,
      currency: session.currency ?? CURRENCY,
      status: 'paid',
      paid_at: new Date((session.created ?? Date.now() / 1000) * 1000).toISOString(),
    },
    { onConflict: 'stripe_session_id', ignoreDuplicates: false },
  )
  if (error) throw error
}
