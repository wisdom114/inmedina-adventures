// Starts a Stripe Checkout payment ($29, one-time) and returns its URL.
// The app sends the player there; Stripe sends them back afterwards.
import { corsHeaders, json } from '../_shared/cors.ts'
import { CURRENCY, PRICE_CENTS, PRODUCT_DESCRIPTION, PRODUCT_NAME, stripe } from '../_shared/payments.ts'

// Only send players back to the app's own addresses.
// APP_URLS = comma-separated list, e.g. "https://hunt.inmedina.com,http://localhost:5173"
function allowedReturnUrl(origin: string | undefined) {
  if (!origin) return null
  const allowed = (Deno.env.get('APP_URLS') ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  if (allowed.includes(origin)) return origin
  // Local development (computer or phone on the same Wi-Fi) is always allowed.
  if (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)) {
    return origin
  }
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { origin } = await req.json().catch(() => ({}))
    const base = allowedReturnUrl(origin)
    if (!base) return json({ error: 'This address is not allowed to take payments.' }, 400)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // one-time, not a subscription
      allow_promotion_codes: true, // shows an "Add promotion code" field on Stripe's checkout page
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: PRICE_CENTS,
            product_data: { name: PRODUCT_NAME, description: PRODUCT_DESCRIPTION },
          },
        },
      ],
      success_url: `${base}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/?checkout=cancelled`,
    })
    return json({ url: session.url })
  } catch (err) {
    console.error('create-checkout failed:', err)
    return json({ error: 'Could not start the payment. Please try again.' }, 500)
  }
})
