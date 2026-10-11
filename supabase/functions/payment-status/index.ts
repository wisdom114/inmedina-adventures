// Checks payments and links them to the player's account.
//
// POST { session_id? }   (Authorization: the player's login token, if signed in)
//  • session_id given → confirm with Stripe that it was paid, and record it.
//    If signed in, attach that payment to this account (unless another account
//    already claimed it).
//  • signed in → also attach any unclaimed payment made with this account's
//    (confirmed) email — covers players who closed the page after paying.
// Returns { paid, email, has_paid }
//   paid     – the given session was paid
//   email    – email used at checkout (to pre-fill sign-up)
//   has_paid – this account has a payment (unlocks the hunt)
import { corsHeaders, json } from '../_shared/cors.ts'
import { admin, recordPaidSession, stripe } from '../_shared/payments.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { session_id: sessionId } = await req.json().catch(() => ({}))

    // Who is asking? (null when signed out — the anon key is not a user)
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    const { data: userData } = token ? await admin.auth.getUser(token) : { data: { user: null } }
    const user = userData?.user ?? null

    let paid = false
    let email: string | null = null

    if (typeof sessionId === 'string' && sessionId.startsWith('cs_')) {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      paid = session.payment_status === 'paid'
      email = session.customer_details?.email ?? null
      if (paid) {
        await recordPaidSession(session)
        if (user) {
          await admin
            .from('payments')
            .update({ user_id: user.id, claimed_at: new Date().toISOString() })
            .eq('stripe_session_id', session.id)
            .is('user_id', null)
        }
      }
    }

    let hasPaid = false
    if (user) {
      if (user.email && user.email_confirmed_at) {
        await admin
          .from('payments')
          .update({ user_id: user.id, claimed_at: new Date().toISOString() })
          .is('user_id', null)
          .eq('status', 'paid')
          .eq('email', user.email.toLowerCase())
      }
      const { count } = await admin
        .from('payments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'paid')
      hasPaid = (count ?? 0) > 0
    }

    return json({ paid, email, has_paid: hasPaid })
  } catch (err) {
    console.error('payment-status failed:', err)
    return json({ error: 'Could not check the payment.' }, 500)
  }
})
