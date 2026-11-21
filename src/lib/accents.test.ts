import { describe, expect, it } from "vitest";
import { findAccentReplacement } from "./accents";

describe("findAccentReplacement", () => {
  it("converts n~ to ñ", () => {
    expect(findAccentReplacement("n~")).toEqual({
      sequence: "n~",
      replacement: "ñ",
    });
  });

  it("only looks at the END of the text", () => {
    expect(findAccentReplacement("el nin~")).toEqual({
      sequence: "n~",
      replacement: "ñ",
    });
  });

  it("converts every accented vowel", () => {
    expect(findAccentReplacement("a'")?.replacement).toBe("á");
    expect(findAccentReplacement("e'")?.replacement).toBe("é");
    expect(findAccentReplacement("i'")?.replacement).toBe("í");
    expect(findAccentReplacement("o'")?.replacement).toBe("ó");
    expect(findAccentReplacement("u'")?.replacement).toBe("ú");
  });

  it("keeps uppercase letters uppercase", () => {
    expect(findAccentReplacement("E'")?.replacement).toBe("É");
    expect(findAccentReplacement("N~")?.replacement).toBe("Ñ");
  });

  it("handles ü and the inverted punctuation", () => {
    expect(findAccentReplacement('pingu"')?.replacement).toBe("ü");
    expect(findAccentReplacement("??")?.replacement).toBe("¿");
    expect(findAccentReplacement("!!")?.replacement).toBe("¡");
  });

  it("returns null when the text does not end with a sequence", () => {
    expect(findAccentReplacement("hola")).toBeNull();
    expect(findAccentReplacement("n~a")).toBeNull(); // sequence not at the end
    expect(findAccentReplacement("x~")).toBeNull(); // x has no tilde form
  });

  it("returns null for text too short to contain a sequence", () => {
    expect(findAccentReplacement("")).toBeNull();
    expect(findAccentReplacement("n")).toBeNull();
  });
});
