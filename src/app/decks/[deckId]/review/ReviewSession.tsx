"use client";

import Link from "next/link";
import { useReducer, useState } from "react";
import { SpanishInput } from "@/components/SpanishInput";
import { checkAnswer } from "@/lib/checkAnswer";
import {
  needsAiGrading,
  reviewReducer,
  startReview,
  summarize,
  type AnswerRecord,
  type ReviewCard,
} from "@/lib/review";
import { shuffle } from "@/lib/shuffle";
import { gradeAnswerAction } from "./actions";

type Props = {
  deckId: number;
  /** Already shuffled by the server. */
  cards: ReviewCard[];
};

export function ReviewSession({ deckId, cards }: Props) {
  // useReducer: all session state lives in one object, and the only way to
  // change it is dispatch(action) → reviewReducer (in src/lib/review.ts).
  const [state, dispatch] = useReducer(reviewReducer, cards, startReview);
  const [typed, setTyped] = useState("");

  async function submit() {
    const card = state.queue[state.index];
    dispatch({ type: "submit", typed });
    // Same decision the reducer makes: only ask the AI when the instant check isn't sure.
    const instant = checkAnswer(typed, [card.spanish, ...card.alternatives]);
    if (!needsAiGrading(typed, instant)) return;
    const result = await gradeAnswerAction(card.id, typed).catch(() => ({ ok: false as const }));
    dispatch(result.ok ? { type: "graded", grade: result.grade } : { type: "gradeFailed" });
  }

  if (state.phase === "done") {
    return (
      <Summary
        answers={state.answers}
        deckId={deckId}
        onRetry={(retry) => dispatch({ type: "start", cards: shuffle(retry) })}
        onRestart={() => dispatch({ type: "start", cards: shuffle(cards) })}
      />
    );
  }

  const card = state.queue[state.index];
  const last = state.answers.at(-1);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-zinc-500">
        Card {state.index + 1} of {state.queue.length}
      </p>

      <p className="text-3xl font-semibold">{card.english}</p>

      {state.phase === "answering" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex flex-col gap-2"
        >
          <SpanishInput
            name="answer"
            value={typed}
            onChange={setTyped}
            placeholder="Type it in Spanish…"
            autoFocus
          />
          <div className="flex items-center gap-3">
            <button className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
              Check
            </button>
            <span className="text-xs text-zinc-500">
              Enter → check · leave blank to see the answer
            </span>
          </div>
        </form>
      ) : state.phase === "grading" ? (
        <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p lang="es">
            <span className="text-sm text-zinc-500">You typed: </span>
            {typed}
          </p>
          <p className="animate-pulse text-sm text-zinc-500">Checking your answer…</p>
        </div>
      ) : (
        last && (
          <Feedback
            answer={last}
            onOverride={() => dispatch({ type: "override" })}
            onNext={() => {
              setTyped("");
              dispatch({ type: "next" });
            }}
          />
        )
      )}
    </div>
  );
}

const VERDICT_STYLE = {
  correct: "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950",
  almost: "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950",
  wrong: "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950",
};

function Feedback({
  answer,
  onOverride,
  onNext,
}: {
  answer: AnswerRecord;
  onOverride: () => void;
  onNext: () => void;
}) {
  const { verdict, reason, typed, expected, card, overridden, explanation, corrected, gradedBy } =
    answer;
  const showCorrected =
    verdict !== "correct" && corrected && corrected.trim() !== typed.trim();
  const otherAnswers = [card.spanish, ...card.alternatives].filter(
    (a) => a !== expected,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className={`flex flex-col gap-2 rounded-xl border p-4 ${VERDICT_STYLE[verdict]}`}>
        <p className="font-semibold">
          {verdict === "correct" && (overridden ? "✓ Marked correct" : "✓ Correct")}
          {verdict === "almost" &&
            (reason === "spelling"
              ? "≈ Almost: check the spelling"
              : reason === "accents"
                ? "≈ Almost: check the accents"
                : "≈ Almost")}
          {verdict === "wrong" && (typed.trim() ? "✗ Not quite" : "The answer is")}
        </p>
        {typed.trim() && verdict !== "correct" && (
          <p lang="es">
            <span className="text-sm text-zinc-500">You typed: </span>
            {typed}
          </p>
        )}
        {explanation && <p>{explanation}</p>}
        {showCorrected && (
          <p lang="es">
            <span className="text-sm text-zinc-500">Your answer, fixed: </span>
            <span className="font-medium">{corrected}</span>
          </p>
        )}
        <p lang="es" className="text-xl font-medium">
          {gradedBy === "ai" && <span className="text-sm font-normal text-zinc-500">Card answer: </span>}
          {expected}
        </p>
        {otherAnswers.length > 0 && (
          <p lang="es" className="text-sm text-zinc-600 dark:text-zinc-400">
            Also accepted: {otherAnswers.join(" · ")}
          </p>
        )}
        {card.notes && <p className="text-sm italic text-zinc-500">{card.notes}</p>}
        {gradedBy === "ai-failed" && (
          <p className="text-xs text-zinc-500">AI check unavailable, so this is the instant check only.</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* autoFocus: pressing Enter right after checking moves on */}
        <button
          autoFocus
          onClick={onNext}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Next →
        </button>
        {verdict !== "correct" && typed.trim() && (
          <button
            onClick={onOverride}
            className="rounded-lg px-4 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            I was right
          </button>
        )}
      </div>
    </div>
  );
}

function Summary({
  answers,
  deckId,
  onRetry,
  onRestart,
}: {
  answers: AnswerRecord[];
  deckId: number;
  onRetry: (cards: ReviewCard[]) => void;
  onRestart: () => void;
}) {
  const { passed, total, almost, wrong } = summarize(answers);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-zinc-500">Session complete</p>
        <p className="text-4xl font-bold">
          {passed} / {total}
        </p>
      </div>

      {wrong.length > 0 && (
        <AnswerList title={`Missed (${wrong.length})`} answers={wrong} />
      )}
      {almost.length > 0 && (
        <AnswerList title={`Almost: accents or spelling (${almost.length})`} answers={almost} />
      )}

      <div className="flex flex-wrap gap-3">
        {wrong.length > 0 && (
          <button
            autoFocus
            onClick={() => onRetry(wrong.map((a) => a.card))}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Review missed again ({wrong.length})
          </button>
        )}
        <button
          onClick={onRestart}
          className="rounded-lg border border-zinc-300 px-4 py-2 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Start over
        </button>
        <Link
          href={`/decks/${deckId}`}
          className="rounded-lg px-4 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Back to deck
        </Link>
      </div>
    </div>
  );
}

function AnswerList({ title, answers }: { title: string; answers: AnswerRecord[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-semibold">{title}</h2>
      <ul className="flex flex-col gap-2">
        {answers.map((a) => (
          <li
            key={a.card.id}
            className="flex flex-col rounded-lg border border-zinc-200 px-4 py-2 dark:border-zinc-800"
          >
            <span>{a.card.english}</span>
            <span lang="es" className="font-medium">
              {a.expected}
            </span>
            {a.typed.trim() && (
              <span lang="es" className="text-sm text-zinc-500">
                You typed: {a.typed}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
