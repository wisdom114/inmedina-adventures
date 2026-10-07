// ─────────────────────────────────────────────────────────────
//  Scoring rules — change the numbers here and the whole app follows.
// ─────────────────────────────────────────────────────────────

export const POINTS = {
  correctAnswer: 10,
  photoTaken: 5,
  hintUsed: -5,
  answerSkipped: -10,
  mysteryPhrase: 25,
}

// Each clue's result looks like:
//   { answer: 'correct' | 'skipped', hintUsed: true, photo: 'taken' | 'skipped', thumb }
// Returns the list of score lines for that clue.
export function clueScoreLines(result = {}) {
  const lines = []
  if (result.answer === 'correct') lines.push({ label: 'Correct answer', points: POINTS.correctAnswer })
  if (result.answer === 'skipped') lines.push({ label: 'Answer skipped', points: POINTS.answerSkipped })
  if (result.hintUsed) lines.push({ label: 'Hint used', points: POINTS.hintUsed })
  if (result.photo === 'taken') lines.push({ label: 'Photo challenge', points: POINTS.photoTaken })
  return lines
}

export function clueScore(result) {
  return clueScoreLines(result).reduce((sum, line) => sum + line.points, 0)
}

export function maxScore(clueCount) {
  return clueCount * (POINTS.correctAnswer + POINTS.photoTaken) + POINTS.mysteryPhrase
}

export function formatPoints(n) {
  return n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0'
}
