import { useState } from 'react'
import { formatElapsed } from './Timer.jsx'
import { elapsedMs } from '../lib/timer.js'

// Shown when a player comes back to an unfinished hunt. Lets them carry on,
// or — after a clear warning — throw it away and start a new game.
export default function ResumeBanner({ teamName, clueNumber, total, score, timer, onDismiss, onStartNew }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  const started = Boolean(timer)
  const progress = started
    ? `Clue ${clueNumber} of ${total} · ${score} pts · ⏱ ${formatElapsed(elapsedMs(timer))}`
    : 'Team set up — hunt not started yet'

  async function confirm() {
    setBusy(true)
    await onStartNew()
  }

  if (confirming) {
    return (
      <section className="resume-banner is-warning slide-in" role="alertdialog" aria-labelledby="resume-warn-title">
        <p id="resume-warn-title" className="resume-title">Start a new game?</p>
        <p>
          Your progress with <strong>{teamName}</strong> will be <strong>permanently lost</strong>:
        </p>
        <p className="resume-progress">{progress}</p>
        <p>This can’t be undone.</p>
        <div className="resume-actions">
          <button className="btn btn-gold" onClick={() => setConfirming(false)} disabled={busy}>
            Keep Playing
          </button>
          <button className="btn btn-danger" onClick={confirm} disabled={busy}>
            {busy ? 'Starting…' : 'Yes, Start New Game'}
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="resume-banner slide-in" aria-label="Welcome back">
      <button className="resume-close" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
      <p className="resume-title">Welcome back, {teamName}!</p>
      <p className="resume-progress">{progress}</p>
      <p className="resume-sub">
        {started ? 'Your hunt has been resumed where you left off.' : 'Pick up where you left off.'}
      </p>
      <button className="link-btn resume-new" onClick={() => setConfirming(true)}>
        Start a new game instead
      </button>
    </section>
  )
}
