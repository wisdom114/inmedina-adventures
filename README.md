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
`question`, `acceptedAnswers`, optional `hint`, `photoChallenge`, `extractBoxes`, and
`navigation` (directions shown after a correct answer). Save the file and the app updates.

## Connect Supabase (optional for now)

The app works without Supabase — teams just aren't saved. To save teams and progress:

1. Create a project at https://supabase.com
2. Open **SQL Editor**, paste in `supabase/schema.sql`, and run it.
3. Copy `.env.example` to `.env` and fill in your Project URL and anon key
   (Project Settings → API).
4. Restart `npm run dev`.

Each team is stored in the `teams` table with its name, members, current clue,
and start/finish times.

## Project layout

```
src/
  data/clues.js        ← the hunt content
  screens/             ← Landing, TeamSetup, ClueScreen, Finish
  components/Star.jsx  ← brand star mark
  lib/supabase.js      ← database connection
  index.css            ← colours and styles
supabase/schema.sql    ← database table
```
