// ─────────────────────────────────────────────────────────────
//  Scoring rules — change the numbers here and the whole app follows.
// ─────────────────────────────────────────────────────────────
import clues from './clues.js'

export const POINTS = {
  correctAnswer: 10,
  photoTaken: 5,
  letterRevealed: -3, // each letter filled in by "Reveal a letter"
  answerSkipped: -10,
  bonusChallenge: 10, // optional bonus on clues that have one (e.g. the museum)
  mysteryPhrase: 25,
}

// The most letters a team can reveal on one clue with "Reveal a letter".
export const MAX_REVEALS_PER_CLUE = 3

// Each clue's result looks like:
//   { answer: 'correct' | 'skipped', revealedIdx: [0, 1], photo: 'taken' | 'skipped', thumb,
//     bonusClaimed: true, bonusNote: 'what amazed them' }
// Returns the list of score lines for that clue.
export function clueScoreLines(result = {}) {
  const lines = []
  if (result.answer === 'correct') lines.push({ label: 'Correct answer', points: POINTS.correctAnswer })
  if (result.answer === 'skipped') lines.push({ label: 'Answer skipped', points: POINTS.answerSkipped })
  const reveals = result.revealedIdx?.length || 0
  if (reveals) {
    lines.push({
      label: reveals === 1 ? 'Letter revealed' : `Letters revealed (${reveals})`,
      points: reveals * POINTS.letterRevealed,
    })
  }
  // Games saved before "Reveal a letter" replaced hints keep their old hint deduction.
  if (result.hintUsed) lines.push({ label: 'Hint used', points: -5 })
  if (result.photo === 'taken') lines.push({ label: 'Photo challenge', points: POINTS.photoTaken })
  if (result.bonusClaimed) lines.push({ label: 'Bonus challenge', points: POINTS.bonusChallenge })
  return lines
}

export function clueScore(result) {
  return clueScoreLines(result).reduce((sum, line) => sum + line.points, 0)
}

// Every answer and photo, every bonus challenge, and the mystery phrase.
export function maxScore(clueCount = clues.length) {
  const bonuses = clues.filter((c) => c.bonus).length
  return (
    clueCount * (POINTS.correctAnswer + POINTS.photoTaken) +
    bonuses * POINTS.bonusChallenge +
    POINTS.mysteryPhrase
  )
}

export function formatPoints(n) {
  return n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0'
}
