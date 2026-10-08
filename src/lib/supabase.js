import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(url && key)
export const supabase = supabaseConfigured ? createClient(url, key) : null

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured. Add your keys to the .env file.')
  return supabase
}

// ── Auth ────────────────────────────────────────────────────

export async function signUp({ name, email, password }) {
  const { data, error } = await requireClient().auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      // Where the confirmation email link sends people back to.
      emailRedirectTo: window.location.origin,
    },
  })
  if (error) throw error
  // No session means the project requires email confirmation first.
  return { needsConfirmation: !data.session }
}

export async function signIn({ email, password }) {
  const { error } = await requireClient().auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut() {
  await requireClient().auth.signOut()
}

export function displayName(user) {
  return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Player'
}

// If the database hasn't been updated with a newer column yet (supabase/schema.sql
// not re-run), Supabase rejects the whole save. Run the save, and if a column is
// missing, drop just that field and try again so everything else still saves.
async function saveWithMissingColumnFallback(fields, run) {
  let payload = { ...fields }
  for (let attempt = 0; attempt < 4; attempt++) {
    const result = await run(payload)
    const missing = result.error?.message?.match(/'(\w+)' column/)?.[1]
    if (!missing || !(missing in payload)) return result
    console.warn(`Database is missing the "${missing}" column — re-run supabase/schema.sql.`)
    const { [missing]: _dropped, ...rest } = payload
    payload = rest
  }
  return run(payload)
}

// ── Games (one row per hunt, owned by the signed-in user) ──

export async function createGame(teamName, members, country) {
  const db = requireClient()
  const { data, error } = await saveWithMissingColumnFallback(
    { team_name: teamName, members, country },
    (row) => db.from('games').insert(row).select('id').single()
  )
  if (error) throw error
  return data.id
}

export async function updateGame(gameId, fields) {
  if (!gameId) return
  const db = requireClient()
  const { error } = await saveWithMissingColumnFallback(fields, (row) =>
    Object.keys(row).length ? db.from('games').update(row).eq('id', gameId) : { error: null }
  )
  if (error) console.error('Could not save progress:', error.message)
}

// Player chose "Start a new game instead": remove the unfinished game for good.
// Returns true if it was deleted.
export async function deleteGame(gameId) {
  if (!gameId) return false
  const { data, error } = await requireClient().from('games').delete().eq('id', gameId).select('id')
  if (error) {
    console.error('Could not delete game:', error.message)
    return false
  }
  if (!data?.length) {
    console.warn('Game not deleted — re-run supabase/schema.sql to allow players to delete their games.')
    return false
  }
  return true
}

// Returns { ok, game }. game is the hunt to resume: the signed-in user's LATEST game, only if it isn't finished.
// Older unfinished games (abandoned before a newer one was started) are never
// resumed — otherwise an old game and its old start time could come back.
export async function loadActiveGame() {
  const { data, error } = await requireClient()
    .from('games')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error('Could not load saved game:', error.message)
    return { ok: false, game: null } // offline etc. — caller falls back to the phone's copy
  }
  return { ok: true, game: data && !data.finished_at ? data : null }
}

// ── Leaderboard ─────────────────────────────────────────────

export async function submitToLeaderboard({
  gameId,
  playerName,
  teamName,
  country,
  score,
  timeSeconds,
  completedAt,
}) {
  const db = requireClient()
  const { error } = await saveWithMissingColumnFallback(
    {
      game_id: gameId,
      player_name: playerName,
      team_name: teamName,
      country,
      score,
      time_seconds: timeSeconds,
      completed_at: new Date(completedAt).toISOString(),
    },
    (row) =>
      db.from('leaderboard').upsert(row, { onConflict: 'game_id', ignoreDuplicates: true })
  )
  if (error) throw error
}

export const LEADERBOARD_SIZE = 20

// Top scores: highest score first, fastest time breaks ties, earliest finish next.
// Public — works without logging in.
export async function fetchLeaderboard() {
  const { data, error } = await requireClient()
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .order('time_seconds', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(LEADERBOARD_SIZE)
  if (error) throw error
  return data
}

// Calls onChange whenever a score is added; onLive(true/false) reports the connection.
// Returns an unsubscribe function.
export function subscribeToLeaderboard(onChange, onLive) {
  const db = requireClient()
  const channel = db
    .channel('leaderboard-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard' }, onChange)
    .subscribe((status) => onLive?.(status === 'SUBSCRIBED'))
  return () => db.removeChannel(channel)
}
