// Stripe calls this when a payment completes, so the payment is recorded
// even if the player closes the page before returning to the app.
// Deploy with JWT verification OFF (Stripe doesn't send a Supabase login token);
// requests are verified with the Stripe signature instead.
import Stripe from 'npm:stripe@17'
import { recordPaidSession, stripe } from '../_shared/payments.ts'

const cryptoProvider = Stripe.createSubtleCryptoProvider()

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature ?? '',
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
      undefined,
      cryptoProvider,
    )
  } catch (err) {
    console.error('Webhook signature check failed:', err instanceof Error ? err.message : err)
    return new Response('Invalid signature', { status: 400 })
  }

  try {
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      await recordPaidSession(event.data.object as Stripe.Checkout.Session)
    }
    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    console.error('Could not record payment:', err)
    return new Response('Error recording payment', { status: 500 }) // Stripe will retry
  }
})
