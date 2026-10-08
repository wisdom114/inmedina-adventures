import { useCallback, useEffect, useRef, useState } from 'react'
import Star from '../components/Star.jsx'
import Ornament from '../components/Ornament.jsx'
import { formatElapsed } from '../components/Timer.jsx'
import { countryByCode, flagEmoji } from '../data/countries.js'
import { maxScore } from '../data/scoring.js'
import { LEADERBOARD_SIZE, fetchLeaderboard, subscribeToLeaderboard } from '../lib/supabase.js'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Public top-20 board. Updates live as new results come in.
export default function Leaderboard({ clueCount, currentUserId, onBack }) {
  const [rows, setRows] = useState(null) // null = loading
  const [error, setError] = useState('')
  const [live, setLive] = useState(false)
  const [freshIds, setFreshIds] = useState(() => new Set())
  const knownIds = useRef(null)

  const load = useCallback(async () => {
    try {
      const data = await fetchLeaderboard()
      // Briefly highlight rows that weren't there before (live updates).
      if (knownIds.current) {
        const added = data.filter((r) => !knownIds.current.has(r.id)).map((r) => r.id)
        if (added.length) {
          setFreshIds(new Set(added))
          setTimeout(() => setFreshIds(new Set()), 2500)
        }
      }
      knownIds.current = new Set(data.map((r) => r.id))
      setRows(data)
      setError('')
    } catch (err) {
      console.error('Could not load leaderboard:', err.message)
      setError('Couldn’t load the leaderboard. Check your connection.')
    }
  }, [])

  useEffect(() => {
    load()
    let refetchTimer
    const unsubscribe = subscribeToLeaderboard(() => {
      clearTimeout(refetchTimer)
      refetchTimer = setTimeout(load, 300) // batch bursts of new scores
    }, setLive)
    return () => {
      clearTimeout(refetchTimer)
      unsubscribe()
    }
  }, [load])

  const outOf = maxScore(clueCount)

  return (
    <main className="screen leaderboard-screen">
      <header className="screen-header">
        <button className="link-btn" onClick={onBack}>
          ← Back
        </button>
        <p className="eyebrow eyebrow-dark">Top {LEADERBOARD_SIZE}</p>
        <h2>Leaderboard</h2>
        <p className="muted">
          Highest score wins · fastest time breaks ties
          {live && (
            <span className="live-badge">
              <span className="live-dot" aria-hidden="true" /> Live
            </span>
          )}
        </p>
      </header>

      {error && (
        <div className="card lb-message">
          <p className="feedback feedback-wrong">{error}</p>
          <button className="btn btn-green" onClick={load}>
            Try Again
          </button>
        </div>
      )}

      {!error && rows === null && <p className="lb-loading">Loading the leaderboard…</p>}

      {!error && rows?.length === 0 && (
        <section className="card card-manuscript lb-empty">
          <Star size={48} className="start-star" />
          <p className="lb-empty-title">No scores yet</p>
          <p>Be the first to complete the adventure and claim the top spot.</p>
        </section>
      )}

      {!error && rows?.length > 0 && (
        <ol className="lb-list" aria-label="Leaderboard">
          {rows.map((r, i) => {
            const rank = i + 1
            const country = countryByCode(r.country)
            const mine = currentUserId && r.user_id === currentUserId
            const classes = [
              'lb-row',
              rank <= 3 ? `is-top is-top-${rank}` : '',
              mine ? 'is-mine' : '',
              freshIds.has(r.id) ? 'is-fresh' : '',
            ]
            return (
              <li key={r.id} className={classes.join(' ')}>
                <span className="lb-rank" aria-label={`Rank ${rank}`}>
                  {rank}
                </span>
                <span className="lb-main">
                  <span className="lb-team">
                    <span className="lb-flag" aria-hidden="true">
                      {country ? country.flag : flagEmoji(r.country)}
                    </span>
                    <span className="lb-team-name">{r.team_name}</span>
                    {mine && <span className="lb-you">You</span>}
                  </span>
                  <span className="lb-meta">
                    {country ? country.name : 'Unknown country'} · {formatDate(r.completed_at || r.created_at)}
                  </span>
                </span>
                <span className="lb-stats">
                  <span className="lb-score">
                    {r.score}
                    <small>/{outOf}</small>
                  </span>
                  <span className="lb-time">⏱ {formatElapsed(r.time_seconds * 1000)}</span>
                </span>
              </li>
            )
          })}
        </ol>
      )}

      <Ornament />
    </main>
  )
}
