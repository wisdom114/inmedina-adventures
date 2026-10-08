// ─────────────────────────────────────────────────────────────
//  Hunt timer — counts ACTIVE play time only.
//
//  Stored with the game (phone cache + Supabase `games.timer`):
//    activeMs      play time banked from earlier sessions
//    runningSince  when the current session's clock started (null = paused/stopped)
//    lastSeenAt    last moment the app was confirmed open (heartbeat)
//
//  • Start Hunt     → brand-new timer: 0 banked, running from now
//  • Browser closed → the clock is paused at the last heartbeat
//  • App reopened   → time up to that heartbeat is banked, clock resumes from now
//  • Finished       → everything banked, runningSince = null, never ticks again
// ─────────────────────────────────────────────────────────────

export const HEARTBEAT_MS = 5000

export function newTimer(now = Date.now()) {
  return { activeMs: 0, runningSince: now, lastSeenAt: now }
}

export function elapsedMs(timer, now = Date.now()) {
  if (!timer) return 0
  const running = timer.runningSince ? Math.max(0, now - timer.runningSince) : 0
  return (timer.activeMs || 0) + running
}

export function isRunning(timer) {
  return Boolean(timer?.runningSince)
}

// Mark the app as still open (called every few seconds while playing).
export function heartbeat(timer, now = Date.now()) {
  return isRunning(timer) ? { ...timer, lastSeenAt: now } : timer
}

// Stop the clock at `at`, banking the time played up to then.
export function pause(timer, at = Date.now()) {
  if (!isRunning(timer)) return timer
  return { activeMs: elapsedMs(timer, Math.max(at, timer.runningSince)), runningSince: null, lastSeenAt: at }
}

// App reopened: bank play time up to the last moment it was seen open
// (time while closed doesn't count), then keep going from now.
export function resumeAfterReopen(timer, now = Date.now()) {
  if (!isRunning(timer)) return timer
  const paused = pause(timer, timer.lastSeenAt || timer.runningSince)
  return { ...paused, runningSince: now, lastSeenAt: now }
}
