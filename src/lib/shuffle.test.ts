import { describe, expect, it } from "vitest";
import { shuffle } from "./shuffle";

describe("shuffle", () => {
  it("returns the same items in some order", () => {
    const items = [1, 2, 3, 4, 5];
    expect(shuffle(items).toSorted()).toEqual(items);
  });

  it("does not modify the original array", () => {
    const items = [1, 2, 3];
    shuffle(items);
    expect(items).toEqual([1, 2, 3]);
  });

  it("is predictable with a fixed random source", () => {
    // random() = 0 always swaps each item with the first one
    expect(shuffle([1, 2, 3, 4], () => 0)).toEqual([2, 3, 4, 1]);
  });
});
