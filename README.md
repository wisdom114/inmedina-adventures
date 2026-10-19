# InMedina Discovery Adventures

A mobile-first, browser-based scavenger hunt around Masjid al-Nabawi.
Built with React (Vite) and Supabase.

## Run it locally

1. Install Node.js (LTS) from https://nodejs.org
2. In this folder:
   ```
   npm install
   npm run dev
   ```
3. Open the URL it prints. The "Network" URL works on your phone if it's on the same Wi-Fi.

## Edit the clues

All 8 clues live in **`src/data/clues.js`**. Each clue has a `title`, `story`, `task`,
`question`, `answerFormat`, `acceptedAnswers`, `photoChallenge`, optional `bonus`, `extractLetters`, and
`navigation` (directions shown after a correct answer). Save the file and the app updates.

## Supabase (accounts, progress, leaderboard)

Players sign up / log in with email and password (Supabase Auth). Setup:

1. `.env` holds the Project URL and anon key (copy `.env.example` if it's missing).
   Restart `npm run dev` after changing it.
2. Supabase dashboard → **SQL Editor** → paste all of `supabase/schema.sql` → **Run**.
3. Supabase dashboard → **Authentication → URL Configuration**: set **Site URL** to
   where the app runs and add it under **Redirect URLs** (e.g. `http://localhost:5173`
   and your phone URL such as `http://192.168.8.89:5173`). The sign-up confirmation
   email links back there.

Tables:
- `games` — one row per hunt per user: team, members, current clue, per-clue
  results, points, start and finish times. Players can only see their own.
- `leaderboard` — one row per finished game: player name, team, score, time in
  seconds. Anyone can read it; rank by `score desc, time_seconds asc`.

## Payments (Stripe Checkout, $29 one-time)

Flow: landing → payment page → Stripe's hosted checkout → back to the app →
sign up / log in → the payment is linked to the account → hunt unlocked.
Cancelling at Stripe returns to the landing page.

The Stripe secret key lives only in Supabase Edge Functions (`supabase/functions/`),
never in the app:

| Function | What it does |
|---|---|
| `create-checkout` | Creates the $29 Checkout Session and returns Stripe's payment URL |
| `payment-status` | Confirms a payment with Stripe, records it, links it to the signed-in account (also by matching email) |
| `stripe-webhook` | Stripe calls it on payment completion, so payments are recorded even if the player closes the page |

Payments are stored in the `payments` table (players can read only their own).

### One-time setup

1. Run `supabase/schema.sql` in the Supabase SQL Editor (adds the `payments` table).
2. In Stripe (start in **Test mode**): Developers → API keys → copy the **Secret key** (`sk_test_…`).
3. Deploy the functions from this folder (the first command opens a browser to log in):
   ```
   npx supabase login
   npx supabase link --project-ref phnwiqvdnzczotjouvqn
   npx supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
   npx supabase functions deploy create-checkout
   npx supabase functions deploy payment-status
   npx supabase functions deploy stripe-webhook --no-verify-jwt
   ```
4. In Stripe: Developers → Webhooks → **Add endpoint**
   - URL: `https://phnwiqvdnzczotjouvqn.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
   - Copy the **Signing secret** (`whsec_…`) and run
     `npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx`
5. Test with card `4242 4242 4242 4242`, any future expiry, any CVC.

Going live: set `APP_URLS` to your public address
(`npx supabase secrets set APP_URLS=https://your-domain.com`), swap in the live
secret key and a live-mode webhook. Price and product text are in
`supabase/functions/_shared/payments.ts` (and `PRICE_LABEL` in `src/screens/PaymentScreen.jsx`).

## Project layout

```
src/
  data/clues.js        ← the hunt content
  data/scoring.js      ← point values
  screens/             ← Landing, AuthScreen, HowItWorks, TeamSetup,
                         StartingPoint, ClueScreen, Finish
  components/          ← letter boxes, photo challenge, timer, decorations
  lib/supabase.js      ← auth, saving progress, leaderboard
  index.css            ← colours and styles
supabase/schema.sql    ← database tables and security rules
```
