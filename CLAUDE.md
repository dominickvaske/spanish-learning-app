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
- Database: SQLite via libSQL (`@libsql/client`) + Drizzle ORM. Schema in `src/db/schema.ts`; migrations in `drizzle/` (generated, committed, never hand-edited after being applied). Only server code may import `src/db` (enforced by `server-only`).
- AI: Claude API via `@anthropic-ai/sdk`, called **only from server-side code** (`src/server/`). The key is `SPANISH_APP_ANTHROPIC_KEY` in `.env.local` (gitignored). It's deliberately *not* `ANTHROPIC_API_KEY`, because the owner's shell already sets that to a different key, and Next.js never overrides an existing env var. The key must never reach the browser.

## Commands

- `npm run dev`: start the dev server at http://localhost:3000
- `npm run lint`: check the code with ESLint
- `npm test`: run unit tests (Vitest) in watch mode
- `npm run db:generate -- --name <what_changed>`: after editing the schema, generate a migration (review the SQL!)
- `npm run db:migrate`: apply pending migrations to `local.db`
- `npm run db:studio`: browse the database in a web UI
- `npm run eval:grader`: score the AI grader against `evals/grader-cases.json` (~$0.10 per run on Sonnet, plus ~$0.15 with `--judge`). Options: `--model`, `--effort`, `--runs 3` (consistency), `--verbose` (read every explanation), `--only <id>`, `--judge` (an Opus judge checks every explanation against the case's `why`, ~0.5¢ per case). Re-run it, with `--runs 2 --judge`, after any change to the grader's prompt, model, or effort.
- `npm run build`: production build (also type-checks everything)

## Layout

- `src/app/`: pages and routes. The folder structure is the URL structure (`src/app/review/page.tsx` → `/review`).
- `src/components/`: reusable UI pieces (e.g. `SpanishInput`).
- `src/db/queries.ts`: read queries. `src/app/<route>/actions.ts`: Server Actions (writes), which validate input with `src/lib/` helpers.
- `src/server/grader.ts`: the AI grader (prompt, model, structured output). Server-only.
- `evals/`: test set and script for the AI grader.
- `src/lib/`: plain TypeScript logic with no UI. Keep it pure and unit-test it (`*.test.ts` next to the file).

## Next.js gotchas in this project

- `cacheComponents: true` is on. A page that reads the database needs a `loading.tsx` (or `<Suspense>`) **and** `await connection()` before the query. Otherwise the build either errors or bakes a frozen snapshot of the data into the page. Check `npm run build` output: data pages should show ◐ or ƒ, not ○.
- `params` is a Promise: `const { id } = await params`.
- After a write, call `revalidatePath("/decks", "layout")` so the pages show the new data.
