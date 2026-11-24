/**
 * The review session as a state machine:
 *
 *   answering --submit--> feedback --next--> answering (next card)
 *                            |                 ...
 *                         override         after the last card: done
 *
 * Every change goes through `reviewReducer(state, action) -> newState`.
 * It's a pure function (no UI, no database), so it's easy to test.
 */

import { checkAnswer, type CheckResult, type Verdict } from "./checkAnswer";

/** Only the card fields the review screen needs. */
export type ReviewCard = {
  id: number;
  english: string;
  spanish: string;
  alternatives: string[];
  notes: string | null;
};

export type AnswerRecord = {
  card: ReviewCard;
  typed: string;
  verdict: Verdict;
  reason?: CheckResult["reason"];
  expected: string;
  /** True if the user clicked "I was right". */
  overridden: boolean;
};

export type ReviewState = {
  queue: ReviewCard[];
  index: number;
  phase: "answering" | "feedback" | "done";
  answers: AnswerRecord[];
};

export type ReviewAction =
  | { type: "submit"; typed: string }
  | { type: "override" }
  | { type: "next" }
  | { type: "start"; cards: ReviewCard[] };

export function startReview(cards: ReviewCard[]): ReviewState {
  return {
    queue: cards,
    index: 0,
    phase: cards.length > 0 ? "answering" : "done",
    answers: [],
  };
}

export function reviewReducer(
  state: ReviewState,
  action: ReviewAction,
): ReviewState {
  switch (action.type) {
    case "start":
      return startReview(action.cards);

    case "submit": {
      if (state.phase !== "answering") return state;
      const card = state.queue[state.index];
      const { verdict, reason, expected } = checkAnswer(action.typed, [
        card.spanish,
        ...card.alternatives,
      ]);
      return {
        ...state,
        phase: "feedback",
        answers: [
          ...state.answers,
          { card, typed: action.typed, verdict, reason, expected, overridden: false },
        ],
      };
    }

    case "override": {
      const last = state.answers.at(-1);
      if (state.phase !== "feedback" || !last || last.verdict === "correct") {
        return state;
      }
      return {
        ...state,
        answers: [
          ...state.answers.slice(0, -1),
          { ...last, verdict: "correct", overridden: true },
        ],
      };
    }

    case "next": {
      if (state.phase !== "feedback") return state;
      const index = state.index + 1;
      return {
        ...state,
        index,
        phase: index < state.queue.length ? "answering" : "done",
      };
    }
  }
}

/** Groups a finished session's answers for the summary screen. */
export function summarize(answers: AnswerRecord[]) {
  const by = (v: Verdict) => answers.filter((a) => a.verdict === v);
  const almost = by("almost");
  const correct = by("correct");
  return {
    correct,
    almost,
    wrong: by("wrong"),
    /** "almost" counts as passing: only accents or one small typo. */
    passed: correct.length + almost.length,
    total: answers.length,
  };
}
