/**
 * Runs the AI grader against the hand-checked test set and prints a score.
 * Costs real money (small): every case is one API call.
 *
 *   npm run eval:grader                         # default model/effort
 *   npm run eval:grader -- --model claude-opus-5-5 --effort low
 *   npm run eval:grader -- --verbose            # show every explanation
 *   npm run eval:grader -- --judge              # also have a stronger model check every explanation (~1.5c per case)
 */

import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { GRADER_EFFORT, GRADER_MODEL, gradeAnswer, type GradableCard } from "../src/server/grader";
import { judge, JUDGE_MODEL, type Judgment } from "./judge.mjs";

type Case = GradableCard & {
  id: string;
  typed: string;
  expected: "correct" | "almost" | "wrong";
  gray?: boolean;
  why: string;
};

// $ per million tokens (input, output). Update if prices change.
const PRICES: Record<string, [number, number]> = {
  "claude-haiku-5-5": [0.1, 0.5],
  "claude-sonnet-5-5": [2, 10],
  "claude-opus-5-5": [4, 20],
};

const { values } = parseArgs({
  options: {
    model: { type: "string", default: GRADER_MODEL },
    effort: { type: "string", default: GRADER_EFFORT },
    only: { type: "string" }, // run a single case by id
    verbose: { type: "boolean", default: false }, // print every explanation
    runs: { type: "string", default: "1" }, // repeat each case N times to measure consistency
    judge: { type: "boolean", default: false }, // check explanations with a stronger model
  },
});
const model = values.model!;
const effort = values.effort as "low" | "medium" | "high";

const { cases } = JSON.parse(readFileSync("evals/grader-cases.json", "utf8")) as { cases: Case[] };
const filtered = values.only ? cases.filter((c) => c.id === values.only) : cases;
const runs = Number(values.runs);
const selected = Array.from({ length: runs }, () => filtered).flat();

async function runOne(c: Case) {
  const start = Date.now();
  try {
    const grade = await gradeAnswer(c, c.typed, { model, effort });
    const ms = Date.now() - start;
    let judgment: (Judgment & { usage: { inputTokens: number; outputTokens: number } }) | undefined;
    let judgeError: string | undefined;
    if (values.judge) {
      try {
        judgment = await judge(c, grade);
      } catch (error) {
        judgeError = String(error);
      }
    }
    return { c, grade, ms, judgment, judgeError };
  } catch (error) {
    return { c, error: String(error), ms: Date.now() - start };
  }
}

// A few at a time, to be gentle on rate limits.
const results: Awaited<ReturnType<typeof runOne>>[] = [];
for (let i = 0; i < selected.length; i += 5) {
  results.push(...(await Promise.all(selected.slice(i, i + 5).map(runOne))));
}

let passed = 0;
let inTok = 0;
let outTok = 0;
const severityCount = { none: 0, minor: 0, misleading: 0 };
let correctedBad = 0;
let judgeIn = 0;
let judgeOut = 0;
for (const r of results) {
  if ("error" in r) {
    console.log(`ERROR ${r.c.id}: ${r.error}`);
    continue;
  }
  const ok = r.grade.verdict === r.c.expected;
  if (ok) passed++;
  inTok += r.grade.usage.inputTokens;
  outTok += r.grade.usage.outputTokens;
  const mark = ok ? "PASS" : "FAIL";
  console.log(`${mark} ${r.c.id}${r.c.gray ? " (gray)" : ""}  expected=${r.c.expected} got=${r.grade.verdict}  ${r.ms}ms`);
  const j = r.judgment;
  if (j) {
    severityCount[j.explanationSeverity]++;
    if (!j.correctedOk) correctedBad++;
    judgeIn += j.usage.inputTokens;
    judgeOut += j.usage.outputTokens;
    if (j.explanationSeverity !== "none" || !j.correctedOk) {
      console.log(`      JUDGE: explanation ${j.explanationSeverity}${j.correctedOk ? "" : ", corrected NOT ok"}: ${j.problems.join(" / ")}`);
    }
  }
  if (r.judgeError) console.log(`      JUDGE ERROR: ${r.judgeError}`);
  const flagged = j && (j.explanationSeverity === "misleading" || !j.correctedOk);
  if (!ok || values.verbose || flagged) {
    console.log(`      typed:     ${r.c.typed}`);
    console.log(`      AI says:   ${r.grade.explanation}`);
    console.log(`      corrected: ${r.grade.corrected}`);
    console.log(`      test says: ${r.c.why}`);
  }
}

const [pin, pout] = PRICES[model] ?? [NaN, NaN];
const cost = (inTok * pin + outTok * pout) / 1e6;
const times = results.map((r) => r.ms).sort((a, b) => a - b);
if (runs > 1) {
  console.log(`\nCases that were not right every time (out of ${runs} runs):`);
  for (const c of filtered) {
    const mine = results.filter((r) => r.c.id === c.id && "grade" in r && r.grade?.verdict === c.expected).length;
    if (mine < runs) console.log(`  ${c.id}: ${mine}/${runs}`);
  }
}
console.log(`\n${model} (effort ${effort}): ${passed}/${selected.length} correct`);
console.log(
  `tokens in/out: ${inTok}/${outTok}  ≈ $${cost.toFixed(4)} total, $${(cost / selected.length).toFixed(5)} per answer`,
);
console.log(`latency median ${times[Math.floor(times.length / 2)]}ms, max ${times.at(-1)}ms`);
if (values.judge) {
  const [jin, jout] = PRICES[JUDGE_MODEL];
  console.log(
    `explanations (judged by ${JUDGE_MODEL}): ${severityCount.none} accurate, ${severityCount.minor} minor issues, ${severityCount.misleading} MISLEADING; corrected answers not ok: ${correctedBad}`,
  );
  console.log(`judge cost ≈ $${((judgeIn * jin + judgeOut * jout) / 1e6).toFixed(3)}`);
}
