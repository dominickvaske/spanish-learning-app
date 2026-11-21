@AGENTS.md

# Spanish Practice App

An AI-powered Spanish practice app that complements Babbel. See @ROADMAP.md for milestones and current status.

## How we work (important)

The owner is learning software engineering through this project. They are strong in Go and Python, know SQL, and are new to TypeScript, React, and Next.js.

- Work one roadmap milestone at a time, in small steps. Don't build ahead.
- Explain new TypeScript, React, and Next.js concepts by comparing them to Go or Python.
- Stop and ask the owner for design decisions; lay out the trade-offs and give a recommendation.
- Write boilerplate and config. For small, self-contained pieces with high learning value, offer to let the owner write them (and give hints, not answers).
- Never commit or push unless asked. The owner makes the commits.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Database: TBD in milestone 1 (leaning toward SQLite + Drizzle)
- AI: Claude API, called **only from server-side code**. The API key lives in `.env.local` (gitignored) and must never reach the browser.

## Commands

- `npm run dev`: start the dev server at http://localhost:3000
- `npm run lint`: check the code with ESLint
- `npm run build`: production build (also type-checks everything)

## Layout

- `src/app/`: pages and routes. The folder structure is the URL structure (`src/app/review/page.tsx` → `/review`).
