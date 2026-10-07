import { useEffect, useRef, useState } from 'react'
import { formatPoints } from '../data/scoring.js'

// Running score pill. Bumps and shows a floating "+10" / "−5" on every change.
export default function ScoreCounter({ score }) {
  const previous = useRef(score)
  const [change, setChange] = useState(null) // { delta, id }

  useEffect(() => {
    const delta = score - previous.current
    previous.current = score
    if (delta !== 0) setChange({ delta, id: Date.now() })
  }, [score])

  return (
    <div className="score" aria-live="polite">
      <span key={change?.id} className={`score-pill ${change ? 'is-bumping' : ''}`}>
        <span className="score-value">{score}</span>
        <span className="score-unit">pts</span>
      </span>
      {change && (
        <span
          key={`d${change.id}`}
          className={`score-delta ${change.delta > 0 ? 'is-up' : 'is-down'}`}
          aria-hidden="true"
        >
          {formatPoints(change.delta)}
        </span>
      )}
    </div>
  )
}
