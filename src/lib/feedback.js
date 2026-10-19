// ─────────────────────────────────────────────────────────────
//  Answer feedback: short sounds made in code (Web Audio, nothing to
//  download) plus a haptic buzz on phones that support it.
//  Browsers only allow sound after the player taps something — these are
//  called from the Check Answer tap, so that's always the case.
// ─────────────────────────────────────────────────────────────

const VOLUME = 0.12 // keep it subtle

let audio = null
function ctx() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    audio = audio || new AudioCtx()
    if (audio.state === 'suspended') audio.resume()
    return audio
  } catch {
    return null
  }
}

// One soft note: quick fade in, smooth fade out (no clicks).
function tone(ac, { freq, start, duration, type = 'sine', volume = VOLUME, glideTo }) {
  const t0 = ac.currentTime + start
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + duration)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(gain).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

function vibrate(pattern) {
  try {
    navigator.vibrate?.(pattern) // Android; iPhones ignore this
  } catch {}
}

// Correct: a bright rising three-note chime (~0.65s).
export function playCorrect() {
  const ac = ctx()
  if (ac) {
    tone(ac, { freq: 783.99, start: 0, duration: 0.28 }) // G5
    tone(ac, { freq: 987.77, start: 0.09, duration: 0.3 }) // B5
    tone(ac, { freq: 1318.51, start: 0.18, duration: 0.45, volume: VOLUME * 0.9 }) // E6
  }
  vibrate(35)
}

// Wrong: a short, low, soft buzz that dips in pitch (~0.35s).
export function playWrong() {
  const ac = ctx()
  if (ac) {
    tone(ac, { freq: 196, start: 0, duration: 0.32, type: 'triangle', volume: VOLUME * 1.2, glideTo: 147 })
    tone(ac, { freq: 98, start: 0, duration: 0.32, type: 'sine', volume: VOLUME * 0.8, glideTo: 82 })
  }
  vibrate([60, 50, 60])
}
