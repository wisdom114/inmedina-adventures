import { useState } from 'react'
import Star from '../components/Star.jsx'
import Ornament from '../components/Ornament.jsx'
import { startCheckout } from '../lib/supabase.js'

export const PRICE_LABEL = '$29'

export default function PaymentScreen({ clueCount, userName, onBack, onLogin }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handlePay() {
    setBusy(true)
    setError('')
    try {
      const url = await startCheckout()
      window.location.assign(url) // Stripe's secure payment page
    } catch (err) {
      console.error('Could not start checkout:', err)
      setError('We couldn’t open the payment page. Please check your connection and try again.')
      setBusy(false)
    }
  }

  return (
    <main className="screen">
      <header className="screen-header">
        <button className="link-btn" onClick={onBack} disabled={busy}>
          ← Back
        </button>
        <p className="eyebrow eyebrow-dark">Your adventure</p>
        <h2>Checkout</h2>
      </header>

      <section className="card card-manuscript pay-card">
        <Star size={44} className="start-star" />
        <p className="pay-product">InMedina Discovery Adventures</p>
        <p className="pay-hunt">Masjid al-Nabawi Hunt</p>
        <p className="pay-note">One-time payment for your team</p>

        <Ornament />

        <ul className="pay-includes">
          <li>{clueCount} locations around Masjid al-Nabawi, each with its story</li>
          <li>Mystery phrase, photo challenges and live leaderboard</li>
          <li>Play at your own pace — progress saved to your account</li>
        </ul>

        <div className="pay-total">
          <span>Total</span>
          <span className="pay-price">
            {PRICE_LABEL} <small>USD</small>
          </span>
        </div>
        <p className="pay-small">One-time payment · not a subscription</p>
      </section>

      {error && <p className="feedback feedback-wrong">{error}</p>}

      <button className="btn btn-gold pay-btn" onClick={handlePay} disabled={busy}>
        {busy ? 'Opening secure payment…' : `Pay ${PRICE_LABEL} with Stripe`}
      </button>
      <p className="pay-secure">🔒 Secure payment by Stripe. We never see your card details.</p>

      {userName ? (
        <p className="pay-account">
          Paying as <strong>{userName}</strong>
        </p>
      ) : (
        <p className="pay-account">
          Already paid?{' '}
          <button className="link-btn" onClick={onLogin} disabled={busy}>
            Log in
          </button>
        </p>
      )}
    </main>
  )
}
