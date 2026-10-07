import { useEffect, useRef, useState } from 'react'
import clues, { MYSTERY_PHRASE } from './data/clues.js'
import { POINTS, clueScore } from './data/scoring.js'
import {
  supabase,
  supabaseConfigured,
  createGame,
  updateGame,
  loadActiveGame,
  submitToLeaderboard,
  signOut,
  displayName,
} from './lib/supabase.js'
import Star from './components/Star.jsx'
import Landing from './screens/Landing.jsx'
import AuthScreen from './screens/AuthScreen.jsx'
import HowItWorks from './screens/HowItWorks.jsx'
import TeamSetup from './screens/TeamSetup.jsx'
import StartingPoint from './screens/StartingPoint.jsx'
import ClueScreen from './screens/ClueScreen.jsx'
import Finish from './screens/Finish.jsx'

const STORAGE_PREFIX = 'inmedina-adventure-v3'
const PHRASE_LETTERS = MYSTERY_PHRASE.replace(/\s/g, '')
const SIGNED_IN_SCREENS = ['how', 'team', 'start', 'clue', 'finish']

// Arriving from the "confirm your email" link: Supabase puts tokens in the URL.
const ARRIVED_FROM_EMAIL_LINK = /access_token|type=signup/.test(window.location.hash)

const EMPTY_GAME = {
  team: null, // { id, name, members } — id is the Supabase games row
  clueIndex: 0,
  results: {},
  startedAt: null,
  finishedAt: null,
  leaderboard: 'idle', // idle | saving | saved | error
}

// Progress is cached on the phone per user, and saved to Supabase.
function storageKey(userId) {
  return `${STORAGE_PREFIX}:${userId}`
}

function loadLocal(userId) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId))) || null
  } catch {
    return null
  }
}

function fromRemote(row) {
  return {
    team: { id: row.id, name: row.team_name, members: row.members || [] },
    clueIndex: Math.min(row.current_clue || 0, clues.length - 1),
    results: row.results || {},
    startedAt: row.started_at ? Date.parse(row.started_at) : null,
    finishedAt: row.finished_at ? Date.parse(row.finished_at) : null,
    leaderboard: 'idle',
    savedAt: Date.parse(row.updated_at) || 0,
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

function screenForGame(game) {
  if (!game.team) return 'team'
  if (game.finishedAt) return 'finish'
  return game.startedAt ? 'clue' : 'start'
}

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = still checking
  const [screen, setScreen] = useState('landing')
  const [authNotice, setAuthNotice] = useState('')
  const [game, setGame] = useState(EMPTY_GAME)
  const loadedFor = useRef(null) // user id whose game is being / has been loaded
  const [readyFor, setReadyFor] = useState(null) // user id once their game is loaded and routed

  const user = session?.user || null
  const { team, clueIndex, results, startedAt, finishedAt } = game

  // ── Auth session ──────────────────────────────────────────
  useEffect(() => {
    if (!supabase) {
      setSession(null)
      return
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  // ── Load this user's game when they sign in ───────────────
  useEffect(() => {
    if (session === undefined) return
    if (!user) {
      loadedFor.current = null
      setReadyFor(null)
      setGame(EMPTY_GAME)
      if (SIGNED_IN_SCREENS.includes(screen)) setScreen('landing')
      return
    }
    if (loadedFor.current === user.id) return
    loadedFor.current = user.id
    const userId = user.id
    // A session that arrives while the login / sign-up screen is open is a fresh login.
    const justSignedIn = screen === 'login' || screen === 'signup'

    async function loadAndRoute() {
      // The phone's cached copy…
      const local = loadLocal(userId)
      let chosen = null
      if (local?.game?.team) {
        // A leaderboard save interrupted by closing the page gets retried.
        const lb = local.game.leaderboard === 'saving' ? 'idle' : local.game.leaderboard
        chosen = { ...local.game, leaderboard: lb }
      }

      // …and Supabase, the source of truth. Use Supabase's unfinished game
      // unless the phone holds a newer copy of that same game.
      const row = await loadActiveGame()
      if (loadedFor.current !== userId) return // signed out meanwhile
      if (row) {
        const remote = fromRemote(row)
        const phoneIsNewer =
          chosen?.team?.id === row.id && (chosen.savedAt || 0) >= remote.savedAt
        if (!phoneIsNewer) chosen = remote
      }

      const fromEmailLink = ARRIVED_FROM_EMAIL_LINK && !justSignedIn
      if (ARRIVED_FROM_EMAIL_LINK) window.history.replaceState(null, '', window.location.pathname)

      // Decide where to open:
      //  • hunt in progress  → straight to the clue they were on
      //  • team set, not started → Starting Point
      //  • finished game still on the finish screen → stay there
      //  • just logged in / confirmed email → How It Works
      //  • otherwise → landing (or the pre-game screen they were on)
      let next
      if (chosen?.team && !chosen.finishedAt && chosen.startedAt) next = 'clue'
      else if (chosen?.team && !chosen.finishedAt) next = 'start'
      else if (chosen?.finishedAt && local?.screen === 'finish') next = 'finish'
      else if (justSignedIn || fromEmailLink) next = 'how'
      else next = ['how', 'team'].includes(local?.screen) ? local.screen : 'landing'

      if (next !== 'finish' && chosen?.finishedAt) chosen = null // finished: start fresh
      setGame(chosen || EMPTY_GAME)
      setScreen(next)
      setReadyFor(userId)
    }

    loadAndRoute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  // ── Cache on the phone ────────────────────────────────────
  useEffect(() => {
    if (!user || readyFor !== user.id) return
    try {
      localStorage.setItem(storageKey(user.id), JSON.stringify({ screen, game }))
    } catch {}
  }, [user, readyFor, screen, game])

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

  // ── Save progress to Supabase whenever it changes ────────
  useEffect(() => {
    if (!team?.id) return
    updateGame(team.id, {
      current_clue: clueIndex,
      results,
      points: finishedAt ? finalTotal : clueTotal,
      started_at: startedAt ? new Date(startedAt).toISOString() : null,
      finished_at: finishedAt ? new Date(finishedAt).toISOString() : null,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team?.id, clueIndex, results, startedAt, finishedAt])

  // ── Post the finished result to the leaderboard (once) ───
  useEffect(() => {
    if (screen !== 'finish' || !team?.id || !finishedAt || !startedAt) return
    if (game.leaderboard === 'saved' || game.leaderboard === 'saving') return
    setGame((g) => ({ ...g, leaderboard: 'saving' }))
    // Make sure the finish time is stored before posting the result.
    updateGame(team.id, {
      finished_at: new Date(finishedAt).toISOString(),
      points: finalTotal,
    })
      .then(() =>
        submitToLeaderboard({
          gameId: team.id,
          playerName: displayName(user),
          teamName: team.name,
          score: finalTotal,
          timeSeconds: Math.round((finishedAt - startedAt) / 1000),
        })
      )
      .then(() => setGame((g) => ({ ...g, leaderboard: 'saved' })))
      .catch((err) => {
        console.error('Could not save to leaderboard:', err.message)
        setGame((g) => ({ ...g, leaderboard: 'error' }))
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, team?.id, finishedAt, game.leaderboard === 'idle'])

  // ── Handlers ──────────────────────────────────────────────
  function patchGame(patch) {
    setGame((g) => ({ ...g, ...patch, savedAt: Date.now() }))
  }

  function updateResult(patch) {
    setGame((g) => ({
      ...g,
      savedAt: Date.now(),
      results: { ...g.results, [g.clueIndex]: { ...g.results[g.clueIndex], ...patch } },
    }))
  }

  function handleBegin() {
    setAuthNotice('')
    if (!user) setScreen('login')
    else if (team && !finishedAt) setScreen(screenForGame(game)) // resume
    else setScreen('how')
  }

  // After How It Works: resume an unfinished hunt, otherwise set up a team.
  function handleHowNext() {
    setScreen(team && !finishedAt ? screenForGame(game) : 'team')
  }

  async function handleTeamReady(name, members) {
    const id = await createGame(name, members) // throws on failure; TeamSetup shows it
    setGame({ ...EMPTY_GAME, team: { id, name, members }, savedAt: Date.now() })
    setScreen('start')
  }

  function handleStartHunt() {
    patchGame({ startedAt: Date.now() })
    setScreen('clue')
  }

  function handleNext() {
    const next = clueIndex + 1
    if (next >= clues.length) {
      patchGame({ finishedAt: Date.now() })
      setScreen('finish')
    } else {
      patchGame({ clueIndex: next })
    }
  }

  function handleRestart() {
    setGame(EMPTY_GAME)
    setScreen('landing')
  }

  async function handleSignOut() {
    await signOut()
    setScreen('landing')
  }

  const clue = clues[clueIndex]

  // Wait for the session, then for a signed-in user's saved game, so we can
  // open on the right screen without flashing another one first.
  if (session === undefined || (user && readyFor !== user.id)) {
    return (
      <div className="app app-loading" aria-busy="true">
        <Star size={56} className="loading-star" />
      </div>
    )
  }

  return (
    <div className="app">
      {screen === 'landing' && (
        <Landing
          userName={user ? displayName(user) : null}
          configError={!supabaseConfigured}
          onBegin={handleBegin}
          onSignOut={handleSignOut}
        />
      )}
      {(screen === 'login' || screen === 'signup') && (
        <AuthScreen
          key={screen}
          mode={screen}
          notice={authNotice}
          onBack={() => setScreen('landing')}
          onSwitch={() => {
            setAuthNotice('')
            setScreen(screen === 'login' ? 'signup' : 'login')
          }}
          onSignedUpNeedsConfirm={(email) => {
            setAuthNotice(
              `Almost there! We sent a confirmation link to ${email}. Open it on this device, then log in.`
            )
            setScreen('login')
          }}
        />
      )}
      {screen === 'how' && (
        <HowItWorks
          clueCount={clues.length}
          onBack={() => setScreen('landing')}
          onNext={handleHowNext}
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
          leaderboardStatus={game.leaderboard}
          onRetryLeaderboard={() => patchGame({ leaderboard: 'idle' })}
          onRestart={handleRestart}
        />
      )}
    </div>
  )
}
