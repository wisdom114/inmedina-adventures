import { useEffect, useRef, useState } from 'react'
import LetterBoxes from '../components/LetterBoxes.jsx'
import PhotoChallenge from '../components/PhotoChallenge.jsx'
import ScoreCounter from '../components/ScoreCounter.jsx'
import Timer from '../components/Timer.jsx'
import Ornament from '../components/Ornament.jsx'
import { POINTS, formatPoints } from '../data/scoring.js'

// Lowercase and strip spaces/punctuation so "Abu Hurairah" == "abu-hurairah".
function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9؀-ۿ]/g, '')
}

export default function ClueScreen({
  clue,
  number,
  total,
  teamName,
  score,
  startedAt,
  result,
  unlockedLetters = [],
  onHint,
  onCorrect,
  onSkipAnswer,
  onPhoto,
  onSkipPhoto,
  onNext,
}) {
  const format = clue.answerFormat
  const answerLetters = format ? format.replace(/[^A-Za-z]/g, '').toUpperCase() : ''
  const [letters, setLetters] = useState(() => Array(answerLetters.length).fill(''))
  const [answer, setAnswer] = useState('') // used only when a clue has no answerFormat
  const [wrong, setWrong] = useState(false)
  const [confirmSkip, setConfirmSkip] = useState(false)

  const isLast = number === total
  const answered = Boolean(result.answer) // 'correct' or 'skipped'
  const hasPhoto = Boolean(clue.photoChallenge)
  const photoDone = !hasPhoto || Boolean(result.photo)
  const typed = format ? letters.join('') : answer
  const ready = format ? letters.every(Boolean) : Boolean(answer.trim())

  // Once answered (or after a refresh), show the real answer in the boxes.
  const boxValues = answered ? [...answerLetters] : letters
  const boxStatus = result.answer || (wrong ? 'wrong' : 'idle')

  // Bring each newly revealed section (photo, then next steps) into view.
  const photoRef = useRef(null)
  const nextRef = useRef(null)
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const target = photoDone ? nextRef.current : photoRef.current
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [answered, photoDone])

  // Phrase box number for each gold letter position: { letterPosition: box }.
  const goldBoxes = Object.fromEntries(
    (clue.extractLetters || []).map(({ letter, box }) => [letter, box])
  )

  function checkAnswer(e) {
    e.preventDefault()
    if (!ready || answered) return
    const accepted = [...(clue.acceptedAnswers || []), ...(format ? [format] : [])]
    const ok =
      accepted.length === 0 || accepted.some((a) => normalize(a) === normalize(typed))
    setWrong(!ok)
    if (ok) onCorrect()
  }

  return (
    <main className="screen">
      <header className="clue-top">
        <span className="team-chip">{teamName}</span>
        <div className="clue-top-right">
          <Timer startedAt={startedAt} />
          <ScoreCounter score={score} />
        </div>
      </header>
      <div className="progress-row">
        <div className="progress" aria-hidden="true">
          <div className="progress-bar" style={{ width: `${((number - 1) / total) * 100}%` }} />
        </div>
        <span className="clue-count">
          Clue {number} / {total}
        </span>
      </div>

      <h2 className="clue-title">{clue.title}</h2>

      <section className="card card-manuscript">
        <p className="section-label">The Story</p>
        <p className="story">{clue.story}</p>
      </section>

      <Ornament />

      <section className="card card-manuscript card-task">
        <p className="section-label section-label-gold">Your Task</p>
        <p>{clue.task}</p>
        {clue.hint && (result.hintUsed || !answered) && (
          <div className="hint">
            {result.hintUsed ? (
              <p className="hint-text">💡 {clue.hint}</p>
            ) : (
              <button className="link-btn" onClick={onHint}>
                Need a hint? ({formatPoints(POINTS.hintUsed)} points)
              </button>
            )}
          </div>
        )}
      </section>

      <form className="card answer-form" onSubmit={checkAnswer}>
        {format ? (
          <div className="field">
            <span className="label">{clue.question || 'Your answer'}</span>
            <LetterBoxes
              format={format}
              values={boxValues}
              goldBoxes={goldBoxes}
              status={boxStatus}
              onChange={(next) => {
                setLetters(next)
                setWrong(false)
              }}
            />
            {!answered && Object.keys(goldBoxes).length > 0 && (
              <p className="lb-legend">
                <span className="lb-legend-swatch" /> Gold letters build the mystery phrase
              </p>
            )}
          </div>
        ) : (
          <label className="field">
            <span className="label">{clue.question || 'Your answer'}</span>
            <input
              type="text"
              value={answered ? clue.acceptedAnswers?.[0] || answer : answer}
              onChange={(e) => {
                setAnswer(e.target.value)
                setWrong(false)
              }}
              placeholder="Type your answer"
              disabled={answered}
              autoComplete="off"
              autoCapitalize="off"
            />
          </label>
        )}

        {wrong && !answered && <p className="feedback feedback-wrong">Not quite — try again.</p>}
        {result.answer === 'correct' && (
          <p className="feedback feedback-right">
            ✓ Correct! Masha’Allah. <span className="points-tag">+{POINTS.correctAnswer}</span>
          </p>
        )}
        {result.answer === 'skipped' && (
          <p className="feedback feedback-skipped">
            Answer skipped — here’s what it was.{' '}
            <span className="points-tag is-down">{formatPoints(POINTS.answerSkipped)}</span>
          </p>
        )}

        {result.answer === 'correct' && unlockedLetters.length > 0 && (
          <div className="unlocked">
            <p className="section-label section-label-gold">Mystery letters unlocked</p>
            <div className="unlocked-letters">
              {unlockedLetters.map((ch, i) => (
                <span className="letter-tile" key={i}>
                  {ch}
                </span>
              ))}
            </div>
          </div>
        )}

        {!answered && (
          <>
            <button type="submit" className="btn btn-green" disabled={!ready}>
              Check Answer
            </button>
            {confirmSkip ? (
              <div className="skip-confirm">
                <p>
                  Skip this answer? You’ll lose {Math.abs(POINTS.answerSkipped)} points and its
                  mystery letters.
                </p>
                <div className="skip-confirm-actions">
                  <button type="button" className="link-btn" onClick={() => setConfirmSkip(false)}>
                    Keep trying
                  </button>
                  <button type="button" className="link-btn is-danger" onClick={onSkipAnswer}>
                    Yes, skip
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="link-btn skip-link"
                onClick={() => setConfirmSkip(true)}
              >
                Skip this answer ({formatPoints(POINTS.answerSkipped)} points)
              </button>
            )}
          </>
        )}
      </form>

      {answered && hasPhoto && (
        <div ref={photoRef}>
          <PhotoChallenge
            text={clue.photoChallenge}
            result={result}
            onPhoto={onPhoto}
            onSkip={onSkipPhoto}
          />
        </div>
      )}

      {answered && photoDone && (
        <section className="card next-card slide-in" ref={nextRef}>
          {clue.navigation && (
            <div className="navigation">
              <p className="section-label">Where to next</p>
              <p>{clue.navigation}</p>
            </div>
          )}
          <button type="button" className="btn btn-gold" onClick={onNext}>
            {isLast ? 'Finish Adventure' : 'Next Clue →'}
          </button>
        </section>
      )}
    </main>
  )
}
