import Star from '../components/Star.jsx'
import Skyline from '../components/Skyline.jsx'
import Ornament from '../components/Ornament.jsx'

export default function Landing({ onBegin }) {
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
        <button className="btn btn-gold" onClick={onBegin}>
          Begin Adventure
        </button>
      </section>
    </main>
  )
}
