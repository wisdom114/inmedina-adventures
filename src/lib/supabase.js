import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// If keys aren't set yet, supabase is null and the app runs without saving.
export const supabase = url && key ? createClient(url, key) : null

export async function createTeam(teamName, members) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('teams')
    .insert({ name: teamName, members })
    .select('id')
    .single()
  if (error) {
    console.error('Could not save team:', error.message)
    return null
  }
  return data.id
}

// Called when the team taps Start Hunt — the official start of their timer.
export async function markHuntStarted(teamId, startedAt) {
  if (!supabase || !teamId) return
  const { error } = await supabase
    .from('teams')
    .update({ started_at: new Date(startedAt).toISOString() })
    .eq('id', teamId)
  if (error) console.error('Could not save start time:', error.message)
}

export async function saveProgress(teamId, clueIndex, { finished = false, points } = {}) {
  if (!supabase || !teamId) return
  const update = { current_clue: clueIndex }
  if (finished) update.completed_at = new Date().toISOString()
  if (points !== undefined) update.points = points
  const { error } = await supabase.from('teams').update(update).eq('id', teamId)
  if (error) console.error('Could not save progress:', error.message)
}
