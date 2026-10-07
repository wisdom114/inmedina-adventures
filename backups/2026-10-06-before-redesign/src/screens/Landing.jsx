import Star from '../components/Star.jsx'

export default function Landing({ onBegin }) {
  return (
    <main className="landing">
      <div className="landing-inner">
        <Star size={72} className="landing-star" />
        <p className="eyebrow">InMedina</p>
        <h1 className="landing-title">
          Discovery
          <br />
          Adventures
        </h1>
        <div className="divider" />
        <p className="landing-text">
          A guided scavenger hunt around Masjid al-Nabawi. Follow the clues, uncover
          the stories of the Prophet’s ﷺ city, and discover Medina together as a team.
        </p>
      </div>
      <div className="landing-actions">
        <button className="btn btn-gold" onClick={onBegin}>
          Begin Adventure
        </button>
      </div>
    </main>
  )
}
