import { useEffect, useState } from 'react'

// 47:23 — minutes keep counting past 60 (e.g. 75:02).
export function formatElapsed(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// Live elapsed time since the team tapped Start Hunt. Based on the saved
// start timestamp, so it keeps the right time across page refreshes.
export default function Timer({ startedAt }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!startedAt) return null
  return (
    <span className="timer" aria-label="Elapsed time">
      <span aria-hidden="true">⏱</span> {formatElapsed(now - startedAt)}
    </span>
  )
}
