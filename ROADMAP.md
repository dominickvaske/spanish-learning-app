# Roadmap

A personal Spanish tutor that complements Babbel: Babbel teaches, this app gives practice.

Each milestone produces something usable. Don't start a milestone until the previous one works and is committed.

| # | Milestone | Done when… | Status |
|---|-----------|-----------|--------|
| 0 | **Setup**: git, Next.js skeleton, CLAUDE.md, roadmap | Home page loads at localhost:3000; first commit made | ✅ done |
| 1 | **Flashcards (no AI)**: create decks and cards, review them, accent-input shortcuts, stored in a database | I can add cards, restart the app, and they're still there | ✅ done |
| 2 | **AI grading**: answers are judged correct / acceptable alternative / wrong, with an explanation | The grader passes a hand-written test set of answers with known verdicts | ✅ done |
| 3 | **Attempt history + spaced repetition**: every answer is recorded; cards resurface on a schedule | The review queue shows only cards that are due | ⬜ |
| 4 | **Weak-spot drills**: detect patterns in misses and generate a short targeted exercise | After repeated misses on a topic, the app offers a drill for it | ⬜ |
| 5 | **Topic import**: paste a Babbel lesson topic; AI drafts cards; I approve or edit them | I can turn a lesson into a deck in under 2 minutes | ⬜ |
| 6 | **Conversation practice**: typed chat with inline corrections | A 10-message conversation with useful corrections | ⬜ |
| 7 | **Deploy**: auth, hosted DB, API cost limits | Usable from my phone; a friend could sign up | ⬜ |

## Decisions made

- **Accent input** (M1): typed sequences that convert as you type (`n~` → ñ, `e'` → é, `u"` → ü, `??` → ¿, `!!` → ¡). Backspace right after a conversion restores the literal text. On-screen buttons are a backup. Ctrl shortcuts were ruled out because browsers reserve Ctrl+N/T/W.

- **Review checking** (M1): ignores case, spacing, and punctuation. Accent-only mistakes (including ñ → n) and one small typo in answers of 8+ letters are "almost" and count as passing. Root verbs and other hints go in a card's notes, never in the answer. Saved alternatives are accepted. Until M2, "I was right" overrides a verdict without saving anything.
- **Database** (M1): SQLite through libSQL, with the Drizzle ORM. Locally it's a single file (`local.db`); for deployment the same code can point at a hosted libSQL database by changing `DATABASE_URL`.
- **Decks vs tags** (M1): each card belongs to exactly one deck (= its source, e.g. a Babbel lesson) and can have any number of tags (= what it's about). Cross-deck practice ("everything tagged ser_vs_estar") is a tag filter, not a second deck. Moving to many decks per card later would be a cheap migration.
- **AI grading** (M2): Claude Sonnet 5.5 at `medium` effort. Chosen by measurement: 27 test cases, 2 runs each, with every explanation checked by an Opus 5.5 judge against hand-written reference notes. Sonnet: 54/54 verdicts, 0 misleading explanations, ~$0.0033 per graded answer. Haiku 5.5 was cheaper ($0.00025) but gave 4 misleading explanations in 54, which a learner can't catch. Opus 5.5 cost twice as much and was no better. The AI is only called when the instant check doesn't say "correct". If the AI is unavailable, the instant verdict is used.
- **Tags moved to M4** (M1): tags only matter for weak-spot drills, so they get built when M4 defines what they need (and the AI may suggest them).
- **Answer history** (M3, planned): an `attempts` table (one row per answer). "Last correct" etc. are queries, not columns on cards. Attempts will carry AI-assigned *mistake* tags, separate from a card's *topic* tags; M4 looks for patterns in those.

## Open decisions

- (none right now)

## Parking lot (ideas for later, not now)

- Automated browser (end-to-end) tests with Playwright, committed to the repo. Needs `sudo npx playwright install-deps` once on WSL. (Claude's throwaway browser tests vanish when its scratch folder is cleared.)

- A "this explanation is wrong" button that saves the case, to grow the test set from real use.
- Show a card's notes *before* answering when they're a hint (e.g. "formal"), not only after.
- Multi-line version of SpanishInput (textarea) for conversation practice (M6)
- Grammar articles: short explanations of topics like object pronouns (lo/la/le/les, and le → se before lo/la), ser vs estar, and stem-changing verbs, linked from the decks and cards that practice them. If the AI drafts them, check them the way the grader was checked, since a learner can't catch a wrong rule. Could pair with M4 (drills could link to the article for their topic).
- (add ideas here instead of expanding the current milestone)
