import { useEffect, useRef, useState } from 'react'
import clues, { MYSTERY_PHRASE } from './data/clues.js'
import { POINTS, clueScore } from './data/scoring.js'
import {
  supabase,
  supabaseConfigured,
  createGame,
  updateGame,
  deleteGame,
  loadActiveGame,
  submitToLeaderboard,
  checkPaymentStatus,
  signOut,
  displayName,
} from './lib/supabase.js'
import { HEARTBEAT_MS, elapsedMs, heartbeat, isRunning, newTimer, pause, resumeAfterReopen } from './lib/timer.js'
import Star from './components/Star.jsx'
import ResumeBanner from './components/ResumeBanner.jsx'
import Landing from './screens/Landing.jsx'
import AuthScreen from './screens/AuthScreen.jsx'
import PaymentScreen from './screens/PaymentScreen.jsx'
import HowItWorks from './screens/HowItWorks.jsx'
import TeamSetup from './screens/TeamSetup.jsx'
import StartingPoint from './screens/StartingPoint.jsx'
import ClueScreen from './screens/ClueScreen.jsx'
import Finish from './screens/Finish.jsx'
import Leaderboard from './screens/Leaderboard.jsx'

// v4: timer now stored as active play time; older cached games (and their start times) are dropped.
const STORAGE_PREFIX = 'inmedina-adventure-v4'
const PHRASE_LETTERS = MYSTERY_PHRASE.replace(/\s/g, '')
const SIGNED_IN_SCREENS = ['how', 'team', 'start', 'clue', 'finish']

// Arriving from the "confirm your email" link: Supabase puts tokens in the URL.
const ARRIVED_FROM_EMAIL_LINK = /access_token|type=signup/.test(window.location.hash)

// Returning from Stripe Checkout: ?checkout=success&session_id=… or ?checkout=cancelled.
// The session id is kept until the payment is linked to an account (sign-up may
// involve confirming an email first, which reloads the app).
const PENDING_CHECKOUT_KEY = 'inmedina-pending-checkout'
const CHECKOUT_RESULT = new URLSearchParams(window.location.search).get('checkout')
if (CHECKOUT_RESULT) {
  const sessionId = new URLSearchParams(window.location.search).get('session_id')
  if (CHECKOUT_RESULT === 'success' && sessionId) {
    try {
      localStorage.setItem(PENDING_CHECKOUT_KEY, sessionId)
    } catch {}
  }
  window.history.replaceState(null, '', window.location.pathname + window.location.hash)
}

function pendingCheckout() {
  try {
    return localStorage.getItem(PENDING_CHECKOUT_KEY)
  } catch {
    return null
  }
}

const EMPTY_GAME = {
  team: null, // { id, name, members, country } — id is the Supabase games row
  clueIndex: 0,
  results: {},
  startedAt: null, // wall-clock moment Start Hunt was tapped (for records only)
  finishedAt: null,
  timer: null, // active play time — see lib/timer.js. null until Start Hunt.
  headingToClue1: false, // Start Hunt tapped, still walking to the first clue
  leaderboard: 'idle', // idle | saving | saved | error
}

// Remove progress cached by older versions of the app (it held the old-style timer).
try {
  Object.keys(localStorage)
    .filter((k) => k.startsWith('inmedina-adventure') && !k.startsWith(STORAGE_PREFIX))
    .forEach((k) => localStorage.removeItem(k))
} catch {}

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
    team: { id: row.id, name: row.team_name, members: row.members || [], country: row.country || null },
    clueIndex: Math.min(row.current_clue || 0, clues.length - 1),
    results: row.results || {},
    startedAt: row.started_at ? Date.parse(row.started_at) : null,
    finishedAt: row.finished_at ? Date.parse(row.finished_at) : null,
    timer: row.timer || legacyTimer(row),
    leaderboard: 'idle',
    savedAt: Date.parse(row.updated_at) || 0,
  }
}

// Games saved before the timer column existed only have start/finish times.
function legacyTimer(row) {
  if (!row.started_at) return null
  const start = Date.parse(row.started_at)
  if (row.finished_at) return { activeMs: Date.parse(row.finished_at) - start, runningSince: null, lastSeenAt: null }
  return { activeMs: 0, runningSince: start, lastSeenAt: Date.parse(row.updated_at) || start }
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
  if (!game.startedAt) return 'start'
  return game.headingToClue1 ? 'start' : 'clue' // still on the way to Clue 1?
}

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = still checking
  const [screen, setScreen] = useState('landing')
  const [authNotice, setAuthNotice] = useState('')
  const [game, setGame] = useState(EMPTY_GAME)
  const loadedFor = useRef(null) // user id whose game is being / has been loaded
  const [readyFor, setReadyFor] = useState(null) // user id once their game is loaded and routed
  const [resumed, setResumed] = useState(false) // show the "Welcome back" banner
  const [leaderboardBack, setLeaderboardBack] = useState('landing') // screen to return to
  // Payment: null = unknown, true/false once checked for the signed-in player.
  const [paid, setPaid] = useState(null)
  const [paymentNotice, setPaymentNotice] = useState(
    CHECKOUT_RESULT === 'cancelled' ? 'Payment cancelled — you have not been charged.' : ''
  )
  const [signupEmail, setSignupEmail] = useState('') // pre-filled from Stripe checkout
  const [checkingPayment, setCheckingPayment] = useState(CHECKOUT_RESULT === 'success')
  const paymentCheckedFor = useRef(undefined)

  const user = session?.user || null
  const { team, clueIndex, results, startedAt, finishedAt, timer } = game
  const gameRef = useRef(game)
  gameRef.current = game

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

      // …and Supabase, the source of truth for which game is current.
      const { ok, game: row } = await loadActiveGame()
      if (loadedFor.current !== userId) return // signed out meanwhile
      if (row) {
        // Resume Supabase's game unless the phone holds a newer copy of that same game.
        const remote = fromRemote(row)
        const phoneIsNewer =
          chosen?.team?.id === row.id && (chosen.savedAt || 0) >= remote.savedAt
        if (!phoneIsNewer) chosen = remote
      } else if (ok && chosen && !chosen.finishedAt) {
        // Supabase says there's no game to resume, so the phone's unfinished copy
        // is an old, superseded game — never resume it (or its old start time).
        chosen = null
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
      if (chosen?.team && !chosen.finishedAt && chosen.startedAt)
        next = chosen.headingToClue1 ? 'start' : 'clue'
      else if (chosen?.team && !chosen.finishedAt) next = 'start'
      else if (chosen?.finishedAt && local?.screen === 'finish') next = 'finish'
      else if (justSignedIn || fromEmailLink) next = 'how'
      else next = ['how', 'team'].includes(local?.screen) ? local.screen : 'landing'

      if (next !== 'finish' && chosen?.finishedAt) chosen = null // finished: start fresh
      // Reopened mid-hunt: the clock was paused while the app was closed.
      if (chosen && !chosen.finishedAt && chosen.timer) {
        chosen = { ...chosen, timer: resumeAfterReopen(chosen.timer) }
      }
      setGame(chosen || EMPTY_GAME)
      setScreen(next)
      setResumed(next === 'clue' || next === 'start')
      setReadyFor(userId)
    }

    loadAndRoute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  // ── Payment status ────────────────────────────────────────
  // Runs on load and whenever someone signs in/out: confirms a just-completed
  // Stripe payment, links payments to the signed-in account, and records
  // whether this account has paid.
  useEffect(() => {
    if (session === undefined || !supabase) return
    if (user && readyFor !== user.id) return // wait until their game has been loaded and routed
    const who = user?.id ?? 'signed-out'
    if (paymentCheckedFor.current === who) return
    paymentCheckedFor.current = who

    const sessionId = pendingCheckout()
    if (!user && !sessionId) {
      setPaid(null)
      setCheckingPayment(false)
      return
    }
    checkPaymentStatus(sessionId)
      .then((res) => {
        if (user) setPaid(Boolean(res.has_paid))
        // Forget the checkout once it's linked to this account, or if Stripe says it wasn't paid.
        if (sessionId && ((user && res.has_paid) || !res.paid)) {
          localStorage.removeItem(PENDING_CHECKOUT_KEY)
        }
        if (sessionId && res.paid) {
          if (!user) {
            // Paid but no account yet → create one.
            setSignupEmail(res.email || '')
            setPaymentNotice('✓ Payment successful! Create your account to start your adventure.')
            setScreen('signup')
          } else if (CHECKOUT_RESULT === 'success') {
            // Already signed in when paying → straight on.
            setPaymentNotice('')
            setScreen((s) => (s === 'landing' || s === 'payment' ? 'how' : s))
          }
        }
      })
      .catch((err) => {
        console.error('Could not check payment:', err)
        if (user) setPaid(false)
      })
      .finally(() => setCheckingPayment(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, readyFor])

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

  // Every answered clue adds its gold letters — skipped clues too, since the answer is revealed.
  const letters = Object.assign(
    {},
    ...clues.map((clue, i) => (results[i]?.answer ? extractLetters(clue) : {}))
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
      timer,
    })
    // (Heartbeats are saved separately below, so they don't trigger a full save every 5s.)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team?.id, clueIndex, results, startedAt, finishedAt, timer?.activeMs, timer?.runningSince])

  // ── Timer heartbeat: remember the app is still open ──────
  // If the browser is closed, the clock pauses at the last heartbeat.
  useEffect(() => {
    // Runs on the clue screens and on the Starting Point once the hunt has started.
    if ((screen !== 'clue' && screen !== 'start') || !team?.id || !isRunning(timer)) return
    let beats = 0
    const id = setInterval(() => {
      setGame((g) => ({ ...g, timer: heartbeat(g.timer), savedAt: Date.now() }))
      beats += 1
      if (beats % 6 === 0) updateGame(team.id, { timer: heartbeat(gameRef.current.timer) }) // ~30s
    }, HEARTBEAT_MS)
    // Closing / leaving the page: stamp the exact moment into the phone's cache.
    function onPageHide() {
      try {
        const key = storageKey(user.id)
        const cached = JSON.parse(localStorage.getItem(key))
        if (cached?.game?.timer) {
          cached.game.timer = heartbeat(cached.game.timer)
          cached.game.savedAt = Date.now()
          localStorage.setItem(key, JSON.stringify(cached))
        }
      } catch {}
    }
    window.addEventListener('pagehide', onPageHide)
    return () => {
      clearInterval(id)
      window.removeEventListener('pagehide', onPageHide)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, team?.id, timer?.runningSince])

  // ── Post the finished result to the leaderboard (once) ───
  useEffect(() => {
    if (screen !== 'finish' || !team?.id || !finishedAt || !timer) return
    if (game.leaderboard === 'saved' || game.leaderboard === 'saving') return
    setGame((g) => ({ ...g, leaderboard: 'saving' }))
    // Make sure the finish time is stored before posting the result.
    updateGame(team.id, {
      finished_at: new Date(finishedAt).toISOString(),
      points: finalTotal,
      timer,
    })
      .then(() =>
        submitToLeaderboard({
          gameId: team.id,
          playerName: displayName(user),
          teamName: team.name,
          country: team.country,
          score: finalTotal,
          timeSeconds: Math.round(elapsedMs(timer) / 1000), // active play time
          completedAt: finishedAt,
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

  // "Start Your Adventure": resume a hunt in progress; otherwise paid players
  // go to How It Works, everyone else to the payment page.
  function handleBegin() {
    setAuthNotice('')
    setPaymentNotice('')
    if (user && team && !finishedAt) {
      setScreen(screenForGame(game)) // resume
      setResumed(true)
    } else if (user && paid) {
      setScreen('how')
    } else {
      setScreen('payment')
    }
  }

  // After How It Works: resume an unfinished hunt; otherwise set up a team
  // (a new hunt needs a payment on this account).
  function handleHowNext() {
    if (team && !finishedAt) {
      setScreen(screenForGame(game))
      setResumed(true)
    } else if (!paid) {
      setScreen('payment')
    } else {
      setScreen('team')
    }
  }

  // "Start a new game instead" (after the player confirmed the warning).
  async function handleStartNewGame() {
    await deleteGame(team?.id)
    setGame(EMPTY_GAME)
    setResumed(false)
    setScreen('how')
  }

  async function handleTeamReady(name, members, country) {
    const id = await createGame(name, members, country) // throws on failure; TeamSetup shows it
    setGame({ ...EMPTY_GAME, team: { id, name, members, country }, savedAt: Date.now() })
    setResumed(false)
    setScreen('start')
  }

  function handleStartHunt() {
    // Every new hunt gets a brand-new timer, so it always begins at 00:00.
    setResumed(false)
    const now = Date.now()
    patchGame({ startedAt: now, finishedAt: null, timer: newTimer(now), headingToClue1: true })
    // Stay on the Starting Point: it now shows the directions to Clue 1.
  }

  // "I'm at the location — let's go" on the Starting Point.
  function handleArrivedAtClue1() {
    setResumed(false)
    patchGame({ headingToClue1: false })
    setScreen('clue')
  }

  function handleNext() {
    const next = clueIndex + 1
    if (next >= clues.length) {
      // Stop the clock for good: bank the play time and stop running.
      const now = Date.now()
      setGame((g) => ({ ...g, finishedAt: now, timer: pause(g.timer, now), savedAt: now }))
      setScreen('finish')
    } else {
      setResumed(false) // banner only on the clue they came back to
      patchGame({ clueIndex: next })
    }
  }

  function handleRestart() {
    setGame(EMPTY_GAME)
    setResumed(false)
    setScreen('landing')
  }

  function openLeaderboard() {
    setLeaderboardBack(screen)
    setScreen('leaderboard')
  }

  async function handleSignOut() {
    await signOut()
    setScreen('landing')
  }

  const clue = clues[clueIndex]

  const resumeBanner = resumed && team && !finishedAt ? (
    <ResumeBanner
      teamName={team.name}
      clueNumber={clueIndex + 1}
      total={clues.length}
      score={clueTotal}
      timer={timer}
      onDismiss={() => setResumed(false)}
      onStartNew={handleStartNewGame}
    />
  ) : null

  // Wait for the session, then for a signed-in user's saved game, so we can
  // open on the right screen without flashing another one first.
  if (session === undefined || (user && readyFor !== user.id) || checkingPayment) {
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
          notice={paymentNotice}
          beginLabel={user && team && !finishedAt ? 'Continue Your Adventure' : 'Start Your Adventure'}
          onBegin={handleBegin}
          onLogin={() => {
            setPaymentNotice('')
            setScreen('login')
          }}
          onLeaderboard={openLeaderboard}
          onSignOut={handleSignOut}
        />
      )}
      {(screen === 'login' || screen === 'signup') && (
        <AuthScreen
          key={screen}
          mode={screen}
          notice={authNotice || paymentNotice}
          initialEmail={signupEmail}
          onBack={() => setScreen('landing')}
          onSwitch={() => {
            setAuthNotice('') // the payment-success message stays
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
      {screen === 'payment' && (
        <PaymentScreen
          clueCount={clues.length}
          userName={user ? displayName(user) : null}
          onBack={() => setScreen('landing')}
          onLogin={() => setScreen('login')}
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
      {screen === 'start' && (
        <StartingPoint
          teamName={team?.name}
          notice={resumeBanner}
          timer={timer}
          onStart={handleStartHunt}
          onContinue={handleArrivedAtClue1}
        />
      )}
      {screen === 'clue' && (
        <ClueScreen
          key={clueIndex}
          clue={clue}
          number={clueIndex + 1}
          total={clues.length}
          teamName={team?.name}
          score={clueTotal}
          timer={timer}
          notice={resumeBanner}
          result={results[clueIndex] || {}}
          unlockedLetters={(clue.extractLetters || []).map(({ box }) => extractLetters(clue)[box])}
          onHint={() => updateResult({ hintUsed: true })}
          onCorrect={() => updateResult({ answer: 'correct' })}
          onSkipAnswer={() => updateResult({ answer: 'skipped' })}
          onPhoto={(thumb) => updateResult({ photo: 'taken', thumb })}
          onSkipPhoto={() => updateResult({ photo: 'skipped' })}
          onClaimBonus={(note) => updateResult({ bonusClaimed: true, bonusNote: note })}
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
          elapsed={timer ? elapsedMs(timer) : null}
          leaderboardStatus={game.leaderboard}
          onRetryLeaderboard={() => patchGame({ leaderboard: 'idle' })}
          onLeaderboard={openLeaderboard}
          onRestart={handleRestart}
        />
      )}
      {screen === 'leaderboard' && (
        <Leaderboard
          clueCount={clues.length}
          currentUserId={user?.id}
          onBack={() => setScreen(leaderboardBack)}
        />
      )}
    </div>
  )
}
