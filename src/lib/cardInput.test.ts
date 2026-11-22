import { describe, expect, it } from "vitest";
import { parseAlternatives, parseCardInput, parseDeckName } from "./cardInput";

describe("parseDeckName", () => {
  it("trims whitespace", () => {
    expect(parseDeckName("  Unit 1  ")).toEqual({ ok: true, value: "Unit 1" });
  });

  it("rejects empty, blank, and missing names", () => {
    expect(parseDeckName("").ok).toBe(false);
    expect(parseDeckName("   ").ok).toBe(false);
    expect(parseDeckName(null).ok).toBe(false);
  });
});

describe("parseAlternatives", () => {
  it("splits on semicolons and trims", () => {
    expect(parseAlternatives(" a ; b;c ", "x")).toEqual(["a", "b", "c"]);
  });

  it("drops empty entries, duplicates, and copies of the main answer", () => {
    expect(parseAlternatives("a;;a; x ;", "x")).toEqual(["a"]);
  });

  it("returns an empty list for empty input", () => {
    expect(parseAlternatives("", "x")).toEqual([]);
  });
});

describe("parseCardInput", () => {
  const valid = {
    english: " What time is it? ",
    spanish: "¿Qué hora es?",
    alternatives: "¿Qué horas son?",
    notes: "",
  };

  it("returns cleaned values for valid input", () => {
    expect(parseCardInput(valid)).toEqual({
      ok: true,
      value: {
        english: "What time is it?",
        spanish: "¿Qué hora es?",
        alternatives: ["¿Qué horas son?"],
        notes: null, // empty notes are stored as null, not ""
      },
    });
  });

  it("requires english and spanish", () => {
    expect(parseCardInput({ ...valid, english: "  " }).ok).toBe(false);
    expect(parseCardInput({ ...valid, spanish: "" }).ok).toBe(false);
  });

  it("rejects non-string values (e.g. a tampered request)", () => {
    expect(parseCardInput({ ...valid, spanish: 42 }).ok).toBe(false);
  });

  it("rejects overly long text", () => {
    expect(parseCardInput({ ...valid, notes: "x".repeat(501) }).ok).toBe(false);
  });
});
