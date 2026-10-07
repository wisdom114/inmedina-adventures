import { POINTS, formatPoints, maxScore } from '../data/scoring.js'

const RULES = [
  ['Stay together', 'all team members must visit every location together'],
  ['Read the story first', 'before looking for the answer'],
  ['Gold boxes matter', 'do not skip them, they build the mystery phrase'],
  ['Take your photo', 'before leaving each location'],
  ['Be respectful', 'you are in and around Masjid al-Nabawi, move calmly and with adab'],
  ['No cheating', 'all answers are physically at the locations, do not search online'],
  ['If you get stuck', 'you can use a hint or skip but points will be deducted'],
]

export default function HowItWorks({ clueCount, onBack, onNext }) {
  const scoring = [
    ['Correct answer', POINTS.correctAnswer],
    ['Photo challenge completed', POINTS.photoTaken],
    ['Hint revealed', POINTS.hintUsed],
    ['Answer skipped', POINTS.answerSkipped],
    ['Mystery phrase correct', POINTS.mysteryPhrase],
  ]

  return (
    <main className="screen">
      <header className="screen-header">
        <button className="link-btn" onClick={onBack}>
          ← Back
        </button>
        <p className="eyebrow eyebrow-dark">Before you begin</p>
        <h2>How It Works</h2>
      </header>

      <section className="card">
        <p className="section-label">What is this?</p>
        <p>
          You will visit {clueCount} real locations around Masjid al-Nabawi in Medina. At each
          location you will read a story, find a hidden detail, and answer a clue. All answers
          are physically observable at the location — do not search online.
        </p>
      </section>

      <section className="card card-task">
        <p className="section-label section-label-gold">The Mystery Phrase</p>
        <div className="how-gold-demo" aria-hidden="true">
          <span className="how-gold-box">
            <small>7</small>M
          </span>
          <span className="how-arrow">→</span>
          <span className="how-phrase-box">
            <small>7</small>M
          </span>
        </div>
        <p>
          Throughout the hunt, some answer boxes are highlighted in gold. As you complete each
          clue, the letters from those gold boxes are automatically collected. When you finish
          all {clueCount} clues, your mystery phrase will be revealed on the final screen. If it
          is correct you will receive a bonus {POINTS.mysteryPhrase} points.
        </p>
      </section>

      <section className="card">
        <p className="section-label">The Rules</p>
        <ul className="how-rules">
          {RULES.map(([title, text]) => (
            <li key={title}>
              <strong>{title}</strong> — {text}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <p className="section-label">Scoring</p>
        <ul className="how-scoring">
          {scoring.map(([label, points]) => (
            <li key={label}>
              <span>{label}</span>
              <span className={`how-points ${points < 0 ? 'is-down' : ''}`}>
                {formatPoints(points)}
              </span>
            </li>
          ))}
          <li className="how-max">
            <span>Maximum possible score</span>
            <span>{maxScore(clueCount)} points</span>
          </li>
        </ul>
        <p className="how-tiebreak">
          <strong>Tiebreaker:</strong> if two teams tie on score, the team with the faster time
          wins.
        </p>
      </section>

      <button className="btn btn-green" onClick={onNext}>
        Next
      </button>
    </main>
  )
}
