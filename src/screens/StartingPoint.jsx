import { useEffect, useRef } from 'react'
import Star from '../components/Star.jsx'
import Timer from '../components/Timer.jsx'

const START_TEXT =
  'Make your way to the front of the Green Dome. This is where the Prophet ﷺ rests. Take a moment here before you begin.'

const FIRST_NAVIGATION =
  'Face the Qibla — the direction of Makkah, to the south. Walk toward the far left corner of the courtyard and exit through Door 365. Once outside, find the light post and look for the green sign nearby. That is where your first clue begins.'

// Two steps on one screen:
//  1. before Start Hunt — the starting-point text and the Start Hunt button
//  2. after Start Hunt  — the timer is running and the directions to Clue 1
//     slide in, styled exactly like the "Where to next" shown after each clue
export default function StartingPoint({ teamName, notice, timer, onStart, onContinue }) {
  const started = Boolean(timer)
  const navRef = useRef(null)
  const wasStarted = useRef(started)

  // Bring the directions into view when they appear (not when reopening the app).
  useEffect(() => {
    if (started && !wasStarted.current) {
      navRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    wasStarted.current = started
  }, [started])

  return (
    <main className="screen">
      <header className="screen-header">
        <p className="eyebrow eyebrow-dark">Step 2 of 2</p>
        <h2>Your Adventure Begins</h2>
        {teamName && <p className="muted">Bismillah, {teamName}.</p>}
        {started && (
          <div className="start-timer">
            <Timer timer={timer} />
          </div>
        )}
      </header>

      {notice}

      <section className="card card-manuscript start-card">
        <Star size={44} className="start-star" />
        <p className="section-label">Your starting point</p>
        <p className="story">{START_TEXT}</p>
      </section>

      {!started ? (
        <>
          <p className="start-note">
            ⏱ Your timer starts when you tap Start Hunt. Only tap it once your team is together
            at the starting point.
          </p>
          <button className="btn btn-gold start-btn" onClick={onStart}>
            Start Hunt
          </button>
        </>
      ) : (
        <section className="card next-card slide-in" ref={navRef}>
          <div className="navigation">
            <p className="section-label">Where to next</p>
            <p>{FIRST_NAVIGATION}</p>
          </div>
          <button type="button" className="btn btn-gold" onClick={onContinue}>
            I’m at the location — let’s go
          </button>
        </section>
      )}
    </main>
  )
}
