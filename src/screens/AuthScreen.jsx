import { useState } from 'react'
import { signIn, signUp } from '../lib/supabase.js'

const MIN_PASSWORD = 6

// Turn Supabase's technical messages into friendly ones.
function friendlyError(err) {
  const msg = err?.message || ''
  if (/invalid login credentials/i.test(msg)) return 'Email or password is incorrect.'
  if (/email not confirmed/i.test(msg))
    return 'Please confirm your email first — check your inbox for the link.'
  if (/already registered|already exists/i.test(msg))
    return 'An account with this email already exists. Try logging in instead.'
  if (/rate limit|too many/i.test(msg)) return 'Too many attempts. Please wait a minute and try again.'
  if (/password/i.test(msg)) return msg
  if (/fetch|network/i.test(msg)) return 'Could not reach the server. Check your connection.'
  return msg || 'Something went wrong. Please try again.'
}

export default function AuthScreen({
  mode,
  notice,
  onSwitch,
  onBack,
  onSignedUpNeedsConfirm,
}) {
  const isSignup = mode === 'signup'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const canSubmit =
    !busy &&
    email.trim() &&
    password.length >= (isSignup ? MIN_PASSWORD : 1) &&
    (!isSignup || name.trim())

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setBusy(true)
    setError('')
    try {
      if (isSignup) {
        const { needsConfirmation } = await signUp({
          name: name.trim(),
          email: email.trim(),
          password,
        })
        // With a session, the app notices the login and moves on by itself.
        if (needsConfirmation) onSignedUpNeedsConfirm(email.trim())
      } else {
        await signIn({ email: email.trim(), password })
      }
    } catch (err) {
      setError(friendlyError(err))
      setBusy(false)
    }
  }

  return (
    <main className="screen">
      <header className="screen-header">
        <button className="link-btn" onClick={onBack}>
          ← Back
        </button>
        <p className="eyebrow eyebrow-dark">{isSignup ? 'Create your account' : 'Welcome back'}</p>
        <h2>{isSignup ? 'Sign Up' : 'Log In'}</h2>
        <p className="muted">
          {isSignup
            ? 'Your progress, score and time will be saved to your account.'
            : 'Log in to continue your adventure.'}
        </p>
      </header>

      {notice && <p className="auth-notice">{notice}</p>}

      <form className="card form" onSubmit={handleSubmit} noValidate>
        {isSignup && (
          <label className="field">
            <span className="label">Your name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kareem"
              autoComplete="name"
              maxLength={60}
            />
          </label>
        )}

        <label className="field">
          <span className="label">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            autoCapitalize="off"
            inputMode="email"
          />
        </label>

        <label className="field">
          <span className="label">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignup ? `At least ${MIN_PASSWORD} characters` : 'Your password'}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />
        </label>

        {error && <p className="feedback feedback-wrong auth-error">{error}</p>}

        <button type="submit" className="btn btn-gold" disabled={!canSubmit}>
          {busy ? 'Please wait…' : isSignup ? 'Create Account' : 'Log In'}
        </button>
      </form>

      <p className="auth-switch">
        {isSignup ? 'Already have an account?' : 'New here?'}{' '}
        <button className="link-btn" onClick={onSwitch}>
          {isSignup ? 'Log in' : 'Create an account'}
        </button>
      </p>
    </main>
  )
}
