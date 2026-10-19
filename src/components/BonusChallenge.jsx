import { useState } from 'react'
import { POINTS } from '../data/scoring.js'
import { playCorrect } from '../lib/feedback.js'

// Optional bonus shown after a correct answer (e.g. explore the museum).
// The team writes one thing that amazed them and claims the points.
export default function BonusChallenge({ text, result, onClaim }) {
  const [note, setNote] = useState('')
  const claimed = Boolean(result.bonusClaimed)

  function claim(e) {
    e.preventDefault()
    if (!note.trim()) return
    playCorrect()
    onClaim(note.trim())
  }

  return (
    <section className="bonus-card slide-in" aria-label="Bonus challenge">
      <p className="bonus-label">
        ✦ Bonus <span className="bonus-points">+{POINTS.bonusChallenge} points</span>
      </p>
      <p className="bonus-text">{text}</p>

      {claimed ? (
        <div className="bonus-done">
          <p className="bonus-done-title">✓ Bonus claimed · +{POINTS.bonusChallenge}</p>
          {result.bonusNote && <p className="bonus-note">“{result.bonusNote}”</p>}
        </div>
      ) : (
        <form className="bonus-form" onSubmit={claim}>
          <label className="field">
            <span className="label">What amazed you?</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="One thing you discovered inside…"
              rows={2}
              maxLength={200}
            />
          </label>
          <button type="submit" className="btn btn-gold" disabled={!note.trim()}>
            Claim +{POINTS.bonusChallenge} Points
          </button>
        </form>
      )}
    </section>
  )
}
