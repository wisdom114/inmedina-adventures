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

// ── Games (one row per hunt, owned by the signed-in user) ──

export async function createGame(teamName, members) {
  const { data, error } = await requireClient()
    .from('games')
    .insert({ team_name: teamName, members })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function updateGame(gameId, fields) {
  if (!gameId) return
  const { error } = await requireClient().from('games').update(fields).eq('id', gameId)
  if (error) console.error('Could not save progress:', error.message)
}

// The signed-in user's most recent unfinished hunt, if any.
export async function loadActiveGame() {
  const { data, error } = await requireClient()
    .from('games')
    .select('*')
    .is('finished_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error('Could not load saved game:', error.message)
    return null
  }
  return data
}

// ── Leaderboard ─────────────────────────────────────────────

export async function submitToLeaderboard({ gameId, playerName, teamName, score, timeSeconds }) {
  const { error } = await requireClient()
    .from('leaderboard')
    .upsert(
      {
        game_id: gameId,
        player_name: playerName,
        team_name: teamName,
        score,
        time_seconds: timeSeconds,
      },
      { onConflict: 'game_id', ignoreDuplicates: true }
    )
  if (error) throw error
}
