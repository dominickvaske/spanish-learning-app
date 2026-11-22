# Roadmap

A personal Spanish tutor that complements Babbel: Babbel teaches, this app gives practice.

Each milestone produces something usable. Don't start a milestone until the previous one works and is committed.

| # | Milestone | Done when… | Status |
|---|-----------|-----------|--------|
| 0 | **Setup**: git, Next.js skeleton, CLAUDE.md, roadmap | Home page loads at localhost:3000; first commit made | ✅ done |
| 1 | **Flashcards (no AI)**: create decks and cards, review them, accent-input shortcuts, stored in a database | I can add cards, restart the app, and they're still there | 🟡 in progress |
| 2 | **AI grading**: answers are judged correct / acceptable alternative / wrong, with an explanation | The grader passes a hand-written test set of answers with known verdicts | ⬜ |
| 3 | **Attempt history + spaced repetition**: every answer is recorded; cards resurface on a schedule | The review queue shows only cards that are due | ⬜ |
| 4 | **Weak-spot drills**: detect patterns in misses and generate a short targeted exercise | After repeated misses on a topic, the app offers a drill for it | ⬜ |
| 5 | **Topic import**: paste a Babbel lesson topic; AI drafts cards; I approve or edit them | I can turn a lesson into a deck in under 2 minutes | ⬜ |
| 6 | **Conversation practice**: typed chat with inline corrections | A 10-message conversation with useful corrections | ⬜ |
| 7 | **Deploy**: auth, hosted DB, API cost limits | Usable from my phone; a friend could sign up | ⬜ |

## Decisions made

- **Accent input** (M1): typed sequences that convert as you type (`n~` → ñ, `e'` → é, `u"` → ü, `??` → ¿, `!!` → ¡). Backspace right after a conversion restores the literal text. On-screen buttons are a backup. Ctrl shortcuts were ruled out because browsers reserve Ctrl+N/T/W.

- **Database** (M1): SQLite through libSQL, with the Drizzle ORM. Locally it's a single file (`local.db`); for deployment the same code can point at a hosted libSQL database by changing `DATABASE_URL`.
- **Decks vs tags** (M1): each card belongs to exactly one deck (= its source, e.g. a Babbel lesson) and can have any number of tags (= what it's about). Cross-deck practice ("everything tagged ser_vs_estar") is a tag filter, not a second deck. Moving to many decks per card later would be a cheap migration.
- **Answer history** (M3, planned): an `attempts` table (one row per answer). "Last correct" etc. are queries, not columns on cards. Attempts will carry AI-assigned *mistake* tags, separate from a card's *topic* tags; M4 looks for patterns in those.

## Open decisions

- (none right now)

## Parking lot (ideas for later, not now)

- Multi-line version of SpanishInput (textarea) for conversation practice (M6)
- (add ideas here instead of expanding the current milestone)
