import { useEffect, useState } from 'react'
import Ornament from '../components/Ornament.jsx'
import HeroArch from '../components/HeroArch.jsx'
import { formatElapsed } from '../components/Timer.jsx'
import clues from '../data/clues.js'
import { countryByCode, flagEmoji } from '../data/countries.js'
import { maxScore } from '../data/scoring.js'
import { fetchLeaderboard, subscribeToLeaderboard } from '../lib/supabase.js'
import { PRICE_LABEL } from './PaymentScreen.jsx'
import { MAX_MEMBERS } from './TeamSetup.jsx'

const HERO_IMAGE = '/images/landing-hero.webp'
const PREVIEW_SIZE = 3

// Top teams, live — a taste of the full leaderboard.
function LeaderboardPreview({ onOpen }) {
  const [rows, setRows] = useState(null)

  useEffect(() => {
    let alive = true
    const load = () =>
      fetchLeaderboard()
        .then((data) => alive && setRows(data.slice(0, PREVIEW_SIZE)))
        .catch(() => alive && setRows([]))
    load()
    const unsubscribe = subscribeToLeaderboard(load)
    return () => {
      alive = false
      unsubscribe()
    }
  }, [])

  return (
    <section className="lp-board" aria-label="Top teams">
      <div className="lp-board-head">
        <p className="lp-section-title">🏆 Top Teams</p>
        <button className="link-btn lp-board-all" onClick={onOpen}>
          View all →
        </button>
      </div>

      {rows === null && <p className="lp-board-empty">Loading…</p>}
      {rows?.length === 0 && (
        <p className="lp-board-empty">
          Be the first to complete the adventure and claim the top spot.
        </p>
      )}
      {rows?.length > 0 && (
        <ol className="lp-board-list">
          {rows.map((r, i) => {
            const country = countryByCode(r.country)
            return (
              <li key={r.id} className={`lp-board-row is-top-${i + 1}`}>
                <span className="lp-rank">{i + 1}</span>
                <span className="lp-team">
                  <span aria-hidden="true">{country ? country.flag : flagEmoji(r.country)}</span>
                  <span className="lp-team-name">{r.team_name}</span>
                </span>
                <span className="lp-score">
                  {r.score}
                  <small>/{maxScore()}</small>
                </span>
                <span className="lp-time">⏱ {formatElapsed(r.time_seconds * 1000)}</span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

export default function Landing({
  userName,
  configError,
  notice,
  beginLabel = 'Start Your Adventure',
  onBegin,
  onLogin,
  onLeaderboard,
  onSignOut,
}) {
  return (
    <main className="lp">
      {/* ── Hero: the photo, with an arch and palms rising from the bottom ── */}
      <header className="lp-hero">
        <img className="lp-hero-img" src={HERO_IMAGE} alt="" />
        <div className="lp-hero-shade" aria-hidden="true" />
        <div className="lp-arch">
          <HeroArch className="lp-arch-svg" />
          <div className="lp-arch-text">
            <h1 className="lp-title">
              <span className="lp-title-brand">InMedina</span>
              <span className="lp-title-main">Discovery</span>
              <span className="lp-title-sub">Adventures</span>
            </h1>
            <span className="lp-title-rule" aria-hidden="true">
              <i />◇<i />
            </span>
          </div>
        </div>
      </header>

      <p className="lp-tagline">Explore · Discover · Connect</p>
      <p className="lp-strapline">A scavenger hunt through the blessed city of Medina</p>

      {/* ── Call to action, just below the photo ── */}
      <div className="lp-actions">
        {notice && <p className="landing-notice">{notice}</p>}
        {configError && (
          <p className="feedback feedback-wrong">
            The app isn’t connected to its database yet (missing Supabase keys).
          </p>
        )}
        <button className="btn btn-gold lp-cta" onClick={onBegin} disabled={configError}>
          {beginLabel}
        </button>
        {userName ? (
          <p className="lp-account">
            Signed in as <strong>{userName}</strong> ·{' '}
            <button className="link-btn" onClick={onSignOut}>
              Sign out
            </button>
          </p>
        ) : (
          <p className="lp-account">
            Already have an account?{' '}
            <button className="link-btn" onClick={onLogin} disabled={configError}>
              Log in
            </button>
          </p>
        )}
      </div>

      {/* ── What you get ── */}
      <section className="lp-stats" aria-label="About the adventure">
        <div className="lp-stat">
          <span className="lp-stat-value">{clues.length}</span>
          <span className="lp-stat-label">Locations</span>
        </div>
        <div className="lp-stat">
          <span className="lp-stat-value lp-stat-icon" aria-hidden="true">
            📜
          </span>
          <span className="lp-stat-label">Hidden Stories</span>
        </div>
        <div className="lp-stat">
          <span className="lp-stat-value">{PRICE_LABEL}</span>
          <span className="lp-stat-label">Per Team</span>
          <span className="lp-stat-note">up to {MAX_MEMBERS} players</span>
        </div>
      </section>

      <Ornament className="lp-ornament" />

      {/* ── Leaderboard ── */}
      <div className="lp-board-wrap">
        {!configError && <LeaderboardPreview onOpen={onLeaderboard} />}
        <button className="btn btn-outline lp-board-btn" onClick={onLeaderboard} disabled={configError}>
          🏆 View Leaderboard
        </button>
      </div>
    </main>
  )
}
