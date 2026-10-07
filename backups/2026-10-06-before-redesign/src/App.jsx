import { useEffect, useState } from 'react'
import clues, { MYSTERY_PHRASE } from './data/clues.js'
import { POINTS, clueScore } from './data/scoring.js'
import { createTeam, markHuntStarted, saveProgress } from './lib/supabase.js'
import Landing from './screens/Landing.jsx'
import HowItWorks from './screens/HowItWorks.jsx'
import TeamSetup from './screens/TeamSetup.jsx'
import StartingPoint from './screens/StartingPoint.jsx'
import ClueScreen from './screens/ClueScreen.jsx'
import Finish from './screens/Finish.jsx'

const STORAGE_KEY = 'inmedina-adventure-v2'
const PHRASE_LETTERS = MYSTERY_PHRASE.replace(/\s/g, '')

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null
  } catch {
    return null
  }
}

// Pull this clue's letters out of its answer: { boxNumber: letter }.
function extractLetters(clue) {
  const word = (clue.answerFormat || '').toUpperCase().replace(/[^A-Z]/g, '')
  const found = {}
  for (const { letter, box } of clue.extractLetters || []) {
    if (word[letter - 1]) found[box] = word[letter - 1]
  }
  return found
}

export default function App() {
  // Restore progress so a phone refresh doesn't lose the team's place.
  const saved = loadSaved()
  const [screen, setScreen] = useState(saved?.screen || 'landing')
  const [team, setTeam] = useState(saved?.team || null)
  // Clamp in case clues were removed from clues.js since the last visit.
  const [clueIndex, setClueIndex] = useState(
    Math.min(saved?.clueIndex || 0, clues.length - 1)
  )
  // Per-clue results keyed by clue index — the single source for score and letters.
  const [results, setResults] = useState(saved?.results || {})
  // Timer: set only when the team taps Start Hunt; finishedAt when they finish.
  const [startedAt, setStartedAt] = useState(saved?.startedAt || null)
  const [finishedAt, setFinishedAt] = useState(saved?.finishedAt || null)

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ screen, team, clueIndex, results, startedAt, finishedAt })
      )
    } catch {}
  }, [screen, team, clueIndex, results, startedAt, finishedAt])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen, clueIndex])

  // Letters only come from clues answered correctly; skipped clues leave gaps.
  const letters = Object.assign(
    {},
    ...clues.map((clue, i) => (results[i]?.answer === 'correct' ? extractLetters(clue) : {}))
  )
  const phraseSolved = [...PHRASE_LETTERS].every((ch, i) => letters[i + 1] === ch)
  const clueTotal = clues.reduce((sum, _, i) => sum + clueScore(results[i]), 0)
  const finalTotal = clueTotal + (phraseSolved ? POINTS.mysteryPhrase : 0)

  function updateResult(patch) {
    setResults((prev) => ({ ...prev, [clueIndex]: { ...prev[clueIndex], ...patch } }))
  }

  async function handleTeamReady(name, members) {
    const id = await createTeam(name, members)
    setTeam({ id, name, members })
    setClueIndex(0)
    setResults({})
    setStartedAt(null)
    setFinishedAt(null)
    setScreen('start')
  }

  function handleStartHunt() {
    const now = Date.now()
    setStartedAt(now)
    markHuntStarted(team?.id, now)
    setScreen('clue')
  }

  function handleNext() {
    const next = clueIndex + 1
    if (next >= clues.length) {
      setFinishedAt(Date.now())
      saveProgress(team?.id, clues.length, { finished: true, points: finalTotal })
      setScreen('finish')
    } else {
      saveProgress(team?.id, next, { points: clueTotal })
      setClueIndex(next)
    }
  }

  function handleRestart() {
    setTeam(null)
    setClueIndex(0)
    setResults({})
    setStartedAt(null)
    setFinishedAt(null)
    setScreen('landing')
  }

  const clue = clues[clueIndex]

  return (
    <div className="app">
      {screen === 'landing' && <Landing onBegin={() => setScreen('how')} />}
      {screen === 'how' && (
        <HowItWorks
          clueCount={clues.length}
          onBack={() => setScreen('landing')}
          onNext={() => setScreen('team')}
        />
      )}
      {screen === 'team' && (
        <TeamSetup onBack={() => setScreen('how')} onReady={handleTeamReady} />
      )}
      {screen === 'start' && <StartingPoint teamName={team?.name} onStart={handleStartHunt} />}
      {screen === 'clue' && (
        <ClueScreen
          key={clueIndex}
          clue={clue}
          number={clueIndex + 1}
          total={clues.length}
          teamName={team?.name}
          score={clueTotal}
          startedAt={startedAt}
          result={results[clueIndex] || {}}
          unlockedLetters={(clue.extractLetters || []).map(({ box }) => extractLetters(clue)[box])}
          onHint={() => updateResult({ hintUsed: true })}
          onCorrect={() => updateResult({ answer: 'correct' })}
          onSkipAnswer={() => updateResult({ answer: 'skipped' })}
          onPhoto={(thumb) => updateResult({ photo: 'taken', thumb })}
          onSkipPhoto={() => updateResult({ photo: 'skipped' })}
          onNext={handleNext}
        />
      )}
      {screen === 'finish' && (
        <Finish
          team={team}
          clues={clues}
          results={results}
          phrase={MYSTERY_PHRASE}
          letters={letters}
          solved={phraseSolved}
          total={finalTotal}
          elapsed={startedAt && finishedAt ? finishedAt - startedAt : null}
          onRestart={handleRestart}
        />
      )}
    </div>
  )
}
