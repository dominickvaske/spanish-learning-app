/**
 * Explanation judge for the grader eval.
 *
 * A stronger model checks each grader explanation (and corrected answer)
 * against the test case's hand-written reference reasoning (`why`).
 * The judge can be wrong too, so flagged items should still be read by a person.
 */

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Grade, GradableCard } from "../src/server/grader";

export const JUDGE_MODEL = "claude-opus-5-5";

export const JudgmentSchema = z.object({
  /** none = accurate; minor = imprecise wording that wouldn't mislead; misleading = teaches something false */
  explanationSeverity: z.enum(["none", "minor", "misleading"]),
  /** Is `corrected` valid Spanish for the prompt (or unchanged when the answer was correct)? */
  correctedOk: z.boolean(),
  /** Each specific problem, quoted. Empty if none. */
  problems: z.array(z.string()),
});
export type Judgment = z.infer<typeof JudgmentSchema>;

const JUDGE_SYSTEM = `You are an expert Spanish teacher reviewing feedback that an automated grader gave to a learner (English speaker, A2-B1 level). Your job is to catch feedback that would teach the learner something false.

You get the flashcard, what the learner typed, a reference note written by a teacher (the ground truth about this case), and the grader's verdict, explanation, and corrected answer.

Judge the explanation:
- misleading: states a grammar rule, word meaning, form name (e.g. calling a tú form "usted"), or fact about the learner's answer that is false, or would leave the learner with a wrong idea.
- minor: imprecise or awkward wording (e.g. "tilde" for an accent mark, third person instead of "you", leaked reasoning) that would not mislead a learner about Spanish.
- none: accurate.

Judge corrected: true if it is correct, natural Spanish for the English prompt that stays close to the learner's answer, or (for a correct answer) the learner's answer unchanged. False otherwise.

The grader's verdict itself is scored separately; only judge the explanation and corrected answer. A different but defensible view on a judgment-call case is not misleading. List each concrete problem in problems, quoting the words at fault.`;

let client: Anthropic | null = null;

export async function judge(
  c: GradableCard & { typed: string; why: string; expected: string },
  grade: Grade,
): Promise<Judgment & { usage: { inputTokens: number; outputTokens: number } }> {
  client ??= new Anthropic({ apiKey: process.env.SPANISH_APP_ANTHROPIC_KEY, timeout: 120_000 });
  const content = [
    "<card>",
    `English prompt: ${c.english}`,
    `Reference answer: ${c.spanish}`,
    `Other accepted answers: ${c.alternatives.join(" | ") || "(none)"}`,
    `Notes: ${c.notes ?? "(none)"}`,
    "</card>",
    `<learner_answer>${c.typed}</learner_answer>`,
    `<teacher_reference>Expected verdict: ${c.expected}. ${c.why}</teacher_reference>`,
    "<grader_feedback>",
    `Verdict: ${grade.verdict}`,
    `Explanation: ${grade.explanation}`,
    `Corrected: ${grade.corrected}`,
    "</grader_feedback>",
  ].join("\n");

  const response = await client.messages.parse({
    model: JUDGE_MODEL,
    max_tokens: 8000,
    system: JUDGE_SYSTEM,
    messages: [{ role: "user", content }],
    output_config: { effort: "high", format: zodOutputFormat(JudgmentSchema) },
  });
  if (!response.parsed_output) {
    throw new Error(`Judge gave no usable output (stop_reason: ${response.stop_reason})`);
  }
  return {
    ...response.parsed_output,
    usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
  };
}
