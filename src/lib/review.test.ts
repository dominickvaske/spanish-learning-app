import { describe, expect, it } from "vitest";
import {
  reviewReducer,
  startReview,
  summarize,
  type ReviewCard,
  type ReviewState,
} from "./review";

const card = (id: number, english: string, spanish: string): ReviewCard => ({
  id,
  english,
  spanish,
  alternatives: [],
  notes: null,
});

const CARDS = [
  card(1, "Good morning", "Buenos días"),
  card(2, "Thank you", "Gracias"),
];

/** Apply several actions in a row, like a user would. */
function run(state: ReviewState, ...actions: Parameters<typeof reviewReducer>[1][]) {
  return actions.reduce(reviewReducer, state);
}

describe("review session", () => {
  it("starts on the first card, answering", () => {
    const s = startReview(CARDS);
    expect(s.phase).toBe("answering");
    expect(s.queue[s.index].id).toBe(1);
  });

  it("an empty deck is immediately done", () => {
    expect(startReview([]).phase).toBe("done");
  });

  it("a clearly correct answer goes straight to feedback (no AI)", () => {
    const s = run(startReview(CARDS), { type: "submit", typed: "Buenos días" });
    expect(s.phase).toBe("feedback");
    expect(s.answers[0]).toMatchObject({ verdict: "correct", gradedBy: "instant" });
  });

  it("a blank answer goes straight to feedback as wrong (no AI)", () => {
    const s = run(startReview(CARDS), { type: "submit", typed: "  " });
    expect(s.phase).toBe("feedback");
    expect(s.answers[0].verdict).toBe("wrong");
  });

  it("an unsure answer waits for the AI grader", () => {
    const s = run(startReview(CARDS), { type: "submit", typed: "buenos dias" });
    expect(s.phase).toBe("grading");
    expect(s.answers[0].verdict).toBe("almost"); // instant verdict, for now
  });

  it("graded replaces the verdict with the AI's", () => {
    const s = run(
      startReview(CARDS),
      { type: "submit", typed: "Buen día" },
      { type: "graded", grade: { verdict: "correct", explanation: "Also natural.", corrected: "Buen día" } },
    );
    expect(s.phase).toBe("feedback");
    expect(s.answers[0]).toMatchObject({
      verdict: "correct",
      explanation: "Also natural.",
      gradedBy: "ai",
    });
  });

  it("gradeFailed keeps the instant verdict and moves on", () => {
    const s = run(startReview(CARDS), { type: "submit", typed: "Buen día" }, { type: "gradeFailed" });
    expect(s.phase).toBe("feedback");
    expect(s.answers[0]).toMatchObject({ verdict: "wrong", gradedBy: "ai-failed" });
  });

  it("can't move on or override while grading", () => {
    const grading = run(startReview(CARDS), { type: "submit", typed: "x" });
    expect(reviewReducer(grading, { type: "next" })).toBe(grading);
    expect(reviewReducer(grading, { type: "override" })).toBe(grading);
  });

  it("next moves to the following card, then to done", () => {
    const s1 = run(startReview(CARDS), { type: "submit", typed: "x" }, { type: "gradeFailed" }, { type: "next" });
    expect(s1.phase).toBe("answering");
    expect(s1.index).toBe(1);

    const s2 = run(s1, { type: "submit", typed: "Gracias" }, { type: "next" });
    expect(s2.phase).toBe("done");
  });

  it("override turns the last answer into a correct one", () => {
    const s = run(startReview(CARDS), { type: "submit", typed: "Buen día" }, { type: "gradeFailed" }, { type: "override" });
    expect(s.answers[0]).toMatchObject({ verdict: "correct", overridden: true });
  });

  it("ignores actions that don't fit the current phase", () => {
    const start = startReview(CARDS);
    expect(reviewReducer(start, { type: "next" })).toBe(start); // can't skip without answering
    expect(reviewReducer(start, { type: "override" })).toBe(start);
    const fb = run(start, { type: "submit", typed: "x" });
    expect(reviewReducer(fb, { type: "submit", typed: "again" })).toBe(fb); // no double submit
    expect(reviewReducer(start, { type: "gradeFailed" })).toBe(start); // no grade without a submit
  });

  it("start resets with a new set of cards", () => {
    const done = run(startReview(CARDS), { type: "submit", typed: "x" }, { type: "gradeFailed" }, { type: "next" });
    const s = reviewReducer(done, { type: "start", cards: [CARDS[1]] });
    expect(s).toEqual(startReview([CARDS[1]]));
  });
});

describe("summarize", () => {
  it("counts almost as passing and lists wrong answers", () => {
    const s = run(
      startReview(CARDS),
      { type: "submit", typed: "buenos dias" },
      { type: "graded", grade: { verdict: "almost", explanation: "Accent.", corrected: "buenos días" } },
      { type: "next" },
      { type: "submit", typed: "De nada" },
      { type: "graded", grade: { verdict: "wrong", explanation: "Different meaning.", corrected: "Gracias" } },
      { type: "next" },
    );
    const sum = summarize(s.answers);
    expect(sum).toMatchObject({ passed: 1, total: 2 });
    expect(sum.almost.map((a) => a.card.id)).toEqual([1]);
    expect(sum.wrong.map((a) => a.card.id)).toEqual([2]);
  });
});
