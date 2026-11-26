/**
 * The review session as a state machine:
 *
 *   answering --submit--> feedback --next--> answering (next card)
 *       |                    ^   |                 ...
 *       |   (instant check   |   override      after the last card: done
 *       |    not sure)       |
 *       +----> grading ------+  graded / gradeFailed
 *
 * The instant check (checkAnswer) runs first. Only when it doesn't say
 * "correct" does the session wait in "grading" for the AI grader.
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
  /** Who decided the verdict. "instant" = checkAnswer only; "ai-failed" = AI was asked but unavailable. */
  gradedBy: "instant" | "ai" | "ai-failed";
  /** From the AI grader. */
  explanation?: string;
  /** The learner's answer, minimally fixed by the AI grader. */
  corrected?: string;
};

/** The AI grader's answer, as the review screen receives it. */
export type AiGrade = { verdict: Verdict; explanation: string; corrected: string };

export type ReviewState = {
  queue: ReviewCard[];
  index: number;
  phase: "answering" | "grading" | "feedback" | "done";
  answers: AnswerRecord[];
};

export type ReviewAction =
  | { type: "submit"; typed: string }
  | { type: "graded"; grade: AiGrade }
  | { type: "gradeFailed" }
  | { type: "override" }
  | { type: "next" }
  | { type: "start"; cards: ReviewCard[] };

/** Should this answer go to the AI grader? Not when it's clearly right, or blank. */
export function needsAiGrading(typed: string, instant: CheckResult): boolean {
  return instant.verdict !== "correct" && typed.trim() !== "";
}

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
      const instant = checkAnswer(action.typed, [card.spanish, ...card.alternatives]);
      const { verdict, reason, expected } = instant;
      return {
        ...state,
        phase: needsAiGrading(action.typed, instant) ? "grading" : "feedback",
        answers: [
          ...state.answers,
          {
            card,
            typed: action.typed,
            verdict,
            reason,
            expected,
            overridden: false,
            gradedBy: "instant",
          },
        ],
      };
    }

    case "graded": {
      const last = state.answers.at(-1);
      if (state.phase !== "grading" || !last) return state;
      const { verdict, explanation, corrected } = action.grade;
      return {
        ...state,
        phase: "feedback",
        answers: [
          ...state.answers.slice(0, -1),
          { ...last, verdict, explanation, corrected, reason: undefined, gradedBy: "ai" },
        ],
      };
    }

    case "gradeFailed": {
      // Keep the instant check's verdict so the session can go on.
      const last = state.answers.at(-1);
      if (state.phase !== "grading" || !last) return state;
      return {
        ...state,
        phase: "feedback",
        answers: [...state.answers.slice(0, -1), { ...last, gradedBy: "ai-failed" }],
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
