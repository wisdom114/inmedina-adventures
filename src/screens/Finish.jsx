import Star from '../components/Star.jsx'
import Skyline from '../components/Skyline.jsx'
import Ornament from '../components/Ornament.jsx'
import { formatElapsed } from '../components/Timer.jsx'
import { POINTS, clueScore, clueScoreLines, formatPoints, maxScore } from '../data/scoring.js'

const CONFETTI_COUNT = 28

export default function Finish({
  team,
  clues,
  results,
  phrase,
  letters,
  solved,
  total,
  elapsed,
  onRestart,
}) {
  // Split the phrase into words, numbering boxes 1–19 across them.
  let boxNumber = 0
  const words = phrase.split(' ').map((word) =>
    [...word].map((ch) => {
      boxNumber += 1
      return { box: boxNumber, expected: ch, got: letters[boxNumber] || '' }
    })
  )

  return (
    <main className="finish">
      {solved && (
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: CONFETTI_COUNT }, (_, i) => (
            <span
              key={i}
              style={{
                left: `${(i * 37) % 100}%`,
                animationDelay: `${1.4 + (i % 7) * 0.18}s`,
                animationDuration: `${2.6 + (i % 5) * 0.4}s`,
              }}
            />
          ))}
        </div>
      )}

      <header className="hero">
        <Star size={52} className="hero-star" />
        <p className="eyebrow">Adventure Complete</p>
        <h1 className="hero-title finish-title">Masha’Allah, {team?.name || 'team'}!</h1>
        <Skyline className="hero-skyline" />
      </header>

      <div className="finish-body">
        <section className="mystery" aria-label="Mystery phrase">
          <p className="mystery-label">The Mystery Phrase</p>
          <div className="phrase">
            {words.map((word, w) => (
              <div className="phrase-word" key={w}>
                {word.map(({ box, expected, got }) => (
                  <span
                    key={box}
                    className={`phrase-box ${got ? (got === expected ? 'is-right' : 'is-wrong') : 'is-empty'}`}
                    style={{ animationDelay: `${box * 0.06}s` }}
                  >
                    {got}
                    <small>{box}</small>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        {solved ? (
          <div className="celebration">
            <p className="celebration-title">Phrase unlocked!</p>
            <p className="celebration-bonus">+{POINTS.mysteryPhrase} bonus points</p>
          </div>
        ) : (
          <p className="finish-note">
            Some letters are missing — skipped answers left gaps in the phrase.
          </p>
        )}

        <section className="breakdown" aria-label="Score breakdown">
          <div className="breakdown-total">
            <span className="breakdown-total-label">Final score</span>
            <span className="breakdown-total-value">
              {total}
              <small> / {maxScore(clues.length)}</small>
            </span>
          </div>
          {elapsed !== null && (
            <div className="breakdown-time">
              <span className="breakdown-total-label">Final time</span>
              <span className="breakdown-time-value">⏱ {formatElapsed(elapsed)}</span>
            </div>
          )}

          <ol className="breakdown-list">
            {clues.map((clue, i) => {
              const lines = clueScoreLines(results[i])
              const subtotal = clueScore(results[i])
              return (
                <li className="breakdown-clue" key={i}>
                  <div className="breakdown-head">
                    {results[i]?.thumb && (
                      <img className="breakdown-thumb" src={results[i].thumb} alt="" />
                    )}
                    <span className="breakdown-name">
                      <small>Clue {i + 1}</small>
                      {clue.title}
                    </span>
                    <span className={`breakdown-sub ${subtotal < 0 ? 'is-down' : ''}`}>
                      {formatPoints(subtotal)}
                    </span>
                  </div>
                  {lines.length > 0 && (
                    <ul className="breakdown-lines">
                      {lines.map((line) => (
                        <li key={line.label}>
                          <span>{line.label}</span>
                          <span className={line.points < 0 ? 'is-down' : ''}>
                            {formatPoints(line.points)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
            <li className="breakdown-clue">
              <div className="breakdown-head">
                <span className="breakdown-name">
                  <small>Bonus</small>
                  Mystery phrase {solved ? 'solved' : 'incomplete'}
                </span>
                <span className="breakdown-sub">
                  {formatPoints(solved ? POINTS.mysteryPhrase : 0)}
                </span>
              </div>
            </li>
          </ol>

          <div className="breakdown-grand">
            <span>Grand total</span>
            <span>{total} pts</span>
          </div>
        </section>

        <Ornament />
        <p className="finish-dua">
          May Allah accept your visit and bring you back to the city of the Prophet ﷺ again
          and again.
        </p>
        {team?.members?.length > 0 && (
          <p className="finish-members">{team.members.join(' · ')}</p>
        )}

        <button className="btn btn-outline" onClick={onRestart}>
          Start a New Adventure
        </button>
      </div>
    </main>
  )
}
