"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cards } from "@/db/schema";
import { MAX_TEXT_LENGTH } from "@/lib/cardInput";
import type { AiGrade } from "@/lib/review";
import { gradeAnswer, GraderUnavailableError } from "@/server/grader";

export type GradeResponse = { ok: true; grade: AiGrade } | { ok: false };

/**
 * Asks the AI grader about one answer. The card is loaded from the database
 * by id, so the browser can't change what the answer is compared against.
 * Never throws: on any problem the review screen keeps the instant verdict.
 */
export async function gradeAnswerAction(cardId: number, typed: string): Promise<GradeResponse> {
  if (!Number.isInteger(cardId) || typeof typed !== "string" || typed.length > MAX_TEXT_LENGTH) {
    return { ok: false };
  }
  const [card] = await db.select().from(cards).where(eq(cards.id, cardId));
  if (!card) return { ok: false };

  try {
    const { verdict, explanation, corrected } = await gradeAnswer(card, typed);
    return { ok: true, grade: { verdict, explanation, corrected } };
  } catch (error) {
    if (error instanceof GraderUnavailableError) {
      console.error("[grader]", error.message);
      return { ok: false };
    }
    throw error;
  }
}
