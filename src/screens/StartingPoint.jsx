import Star from '../components/Star.jsx'

export default function StartingPoint({ teamName, notice, onStart }) {
  return (
    <main className="screen">
      <header className="screen-header">
        <p className="eyebrow eyebrow-dark">Step 2 of 2</p>
        <h2>Your Adventure Begins</h2>
        {teamName && <p className="muted">Bismillah, {teamName}.</p>}
      </header>

      {notice}

      <section className="card card-manuscript start-card">
        <Star size={44} className="start-star" />
        <p className="section-label">Your starting point</p>
        <p className="story">
          Make your way to the front of the Green Dome. Face the Qibla — the direction of Makkah,
          to the south. Walk toward the far left corner of the courtyard and exit through Door
          365. Once outside, find the light post and look for the green sign nearby. That is
          where your first clue begins.
        </p>
      </section>

      <p className="start-note">
        ⏱ Your timer starts when you tap Start Hunt. Only tap it once your team is together at
        the starting point.
      </p>

      <button className="btn btn-gold start-btn" onClick={onStart}>
        Start Hunt
      </button>
    </main>
  )
}
