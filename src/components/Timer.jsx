import { useEffect, useState } from 'react'
import { elapsedMs, isRunning } from '../lib/timer.js'

// 47:23 — minutes keep counting past 60 (e.g. 75:02).
export function formatElapsed(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// Shows the hunt's active play time (see lib/timer.js). Ticks only while the
// timer is running; a stopped timer shows its final time and never changes.
export default function Timer({ timer }) {
  const [now, setNow] = useState(() => Date.now())
  const running = isRunning(timer)

  useEffect(() => {
    setNow(Date.now())
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [running, timer?.runningSince, timer?.activeMs])

  if (!timer) return null
  return (
    <span className="timer" aria-label="Elapsed time">
      <span aria-hidden="true">⏱</span> {formatElapsed(elapsedMs(timer, now))}
    </span>
  )
}
