import Star from '../components/Star.jsx'
import Skyline from '../components/Skyline.jsx'
import Ornament from '../components/Ornament.jsx'

export default function Landing({ userName, configError, onBegin, onSignOut }) {
  return (
    <main className="landing">
      <header className="hero">
        <Star size={64} className="hero-star" />
        <p className="eyebrow">InMedina</p>
        <h1 className="hero-title">
          Discovery
          <br />
          Adventures
        </h1>
        <Skyline className="hero-skyline" />
      </header>

      <section className="landing-body">
        <Ornament />
        <p className="landing-text">
          A guided scavenger hunt around Masjid al-Nabawi. Follow the clues, uncover the stories
          of the Prophet’s ﷺ city, and discover Medina together as a team.
        </p>

        <div className="landing-actions">
          {configError && (
            <p className="feedback feedback-wrong">
              The app isn’t connected to its database yet (missing Supabase keys).
            </p>
          )}
          <button className="btn btn-gold" onClick={onBegin} disabled={configError}>
            Begin Adventure
          </button>
          {userName && (
            <p className="landing-account">
              Signed in as <strong>{userName}</strong> ·{' '}
              <button className="link-btn" onClick={onSignOut}>
                Sign out
              </button>
            </p>
          )}
        </div>
      </section>
    </main>
  )
}
