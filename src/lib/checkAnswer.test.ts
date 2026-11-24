import { describe, expect, it } from "vitest";
import { checkAnswer, editDistance, normalize, stripAccents } from "./checkAnswer";

const QUE_HORA = ["¿Qué hora es?", "¿Qué horas son?"];

describe("normalize", () => {
  it("lowercases, drops punctuation, and collapses spaces", () => {
    expect(normalize("  ¿Qué   HORA es?! ")).toBe("qué hora es");
    expect(normalize("Sí, claro.")).toBe("sí claro");
  });

  it("keeps accents", () => {
    expect(normalize("Año")).toBe("año");
  });
});

describe("stripAccents", () => {
  it("removes accents, tildes, and diaeresis", () => {
    expect(stripAccents("qué año pingüino")).toBe("que ano pinguino");
  });

  it("treats both Unicode spellings of é the same", () => {
    const composed = "é"; // é as one character
    const decomposed = "é"; // e + combining accent
    expect(stripAccents(composed)).toBe(stripAccents(decomposed));
  });
});

describe("checkAnswer", () => {
  it("accepts an exact match", () => {
    expect(checkAnswer("¿Qué hora es?", QUE_HORA)).toEqual({
      verdict: "correct",
      expected: "¿Qué hora es?",
    });
  });

  it("ignores case, punctuation, and extra spaces", () => {
    expect(checkAnswer("  qué HORA es", QUE_HORA).verdict).toBe("correct");
  });

  it("accepts an alternative and reports which one matched", () => {
    expect(checkAnswer("que horas son", QUE_HORA)).toEqual({
      verdict: "almost",
      reason: "accents",
      expected: "¿Qué horas son?",
    });
    expect(checkAnswer("qué horas son", QUE_HORA).verdict).toBe("correct");
  });

  it("is 'almost' when only accents are missing", () => {
    expect(checkAnswer("que hora es", QUE_HORA)).toEqual({
      verdict: "almost",
      reason: "accents",
      expected: "¿Qué hora es?",
    });
  });

  it("is 'almost' when accents are on the wrong letter", () => {
    expect(checkAnswer("qúe hora es", QUE_HORA).verdict).toBe("almost");
  });

  it("is 'almost' for a missing tilde on ñ", () => {
    expect(checkAnswer("Feliz ano", ["Feliz año"]).verdict).toBe("almost");
  });

  it("is 'wrong' for a different word, and shows the main answer", () => {
    expect(checkAnswer("¿Qué día es?", QUE_HORA)).toEqual({
      verdict: "wrong",
      expected: "¿Qué hora es?",
    });
  });

  it("is 'wrong' for a blank answer", () => {
    expect(checkAnswer("   ", QUE_HORA).verdict).toBe("wrong");
    expect(checkAnswer("?", QUE_HORA).verdict).toBe("wrong");
  });
});

describe("editDistance", () => {
  it("counts single-letter edits", () => {
    expect(editDistance("gato", "gato")).toBe(0);
    expect(editDistance("gato", "pato")).toBe(1); // replace
    expect(editDistance("gato", "gatos")).toBe(1); // insert
    expect(editDistance("gatos", "gato")).toBe(1); // delete
    expect(editDistance("olivdamos", "olvidamos")).toBe(1); // swap
    expect(editDistance("", "abc")).toBe(3);
  });
});

describe("checkAnswer typo tolerance", () => {
  it("is 'almost' (spelling) for one swapped pair of letters", () => {
    expect(checkAnswer("No olivdamos nada", ["No olvidamos nada."])).toEqual({
      verdict: "almost",
      reason: "spelling",
      expected: "No olvidamos nada.",
    });
  });

  it("allows a typo and missing accents together", () => {
    expect(checkAnswer("Añade sal, perejil y maix", ["Añade sal, perejil y maíz."]).reason).toBe("spelling");
  });

  it("is 'wrong' for two or more typos", () => {
    expect(checkAnswer("No olivdamos nadda", ["No olvidamos nada."]).verdict).toBe("wrong");
  });

  it("gives short answers no typo tolerance", () => {
    expect(checkAnswer("perro", ["pero"]).verdict).toBe("wrong");
  });

  it("does not forgive a missing word", () => {
    expect(
      checkAnswer("Mezcla las papas con la mayonesa y queso", [
        "Mezcla las papas con la mayonesa y el queso.",
      ]).verdict,
    ).toBe("wrong");
  });
});
