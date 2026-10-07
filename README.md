# InMedina Discovery Adventures

A mobile-first, browser-based scavenger hunt around Masjid al-Nabawi.
Built with React (Vite) and Supabase.

## Run it locally

1. Install Node.js (LTS) from https://nodejs.org
2. In this folder:
   ```
   npm install
   npm run dev
   ```
3. Open the URL it prints. The "Network" URL works on your phone if it's on the same Wi-Fi.

## Edit the clues

All 8 clues live in **`src/data/clues.js`**. Each clue has a `title`, `story`, `task`,
`question`, `answerFormat`, `acceptedAnswers`, optional `hint`, `photoChallenge`, `extractLetters`, and
`navigation` (directions shown after a correct answer). Save the file and the app updates.

## Supabase (accounts, progress, leaderboard)

Players sign up / log in with email and password (Supabase Auth). Setup:

1. `.env` holds the Project URL and anon key (copy `.env.example` if it's missing).
   Restart `npm run dev` after changing it.
2. Supabase dashboard → **SQL Editor** → paste all of `supabase/schema.sql` → **Run**.
3. Supabase dashboard → **Authentication → URL Configuration**: set **Site URL** to
   where the app runs and add it under **Redirect URLs** (e.g. `http://localhost:5173`
   and your phone URL such as `http://192.168.8.89:5173`). The sign-up confirmation
   email links back there.

Tables:
- `games` — one row per hunt per user: team, members, current clue, per-clue
  results, points, start and finish times. Players can only see their own.
- `leaderboard` — one row per finished game: player name, team, score, time in
  seconds. Anyone can read it; rank by `score desc, time_seconds asc`.

## Project layout

```
src/
  data/clues.js        ← the hunt content
  data/scoring.js      ← point values
  screens/             ← Landing, AuthScreen, HowItWorks, TeamSetup,
                         StartingPoint, ClueScreen, Finish
  components/          ← letter boxes, photo challenge, timer, decorations
  lib/supabase.js      ← auth, saving progress, leaderboard
  index.css            ← colours and styles
supabase/schema.sql    ← database tables and security rules
```
