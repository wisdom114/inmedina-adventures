import { useEffect, useState } from 'react'

// 47:23 — minutes keep counting past 60 (e.g. 75:02).
export function formatElapsed(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// Elapsed time is always worked out from real timestamps — never from a stored
// running total:
//   • running:  now − startedAt  (so a resumed game shows the true time since Start Hunt)
//   • finished: finishedAt − startedAt, frozen, with no ticking at all
export default function Timer({ startedAt, finishedAt = null }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    setNow(Date.now()) // a new start time shows correctly straight away (00:00 for a new game)
    if (!startedAt || finishedAt) return // nothing to tick
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [startedAt, finishedAt])

  if (!startedAt) return null
  const elapsed = (finishedAt ?? now) - startedAt
  return (
    <span className="timer" aria-label="Elapsed time">
      <span aria-hidden="true">⏱</span> {formatElapsed(elapsed)}
    </span>
  )
}
