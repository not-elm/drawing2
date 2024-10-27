import { describe, expect, test } from "bun:test";
import { Line } from "./Line";

describe("overlap", () => {
    test.each([
        [Line.of(0, 0, 1, 1), Line.of(0, 1, 1, 0), true],

        // Not crossed
        [Line.of(0, 0, 1, 1), Line.of(0, 4, 1, 3), false],

        // Share the same point
        [Line.of(0, 0, 1, 1), Line.of(0, 2, 1, 1), true],

        // Parallel lines
        [Line.of(0, 0, 1, 1), Line.of(0, 1, 1, 2), false],

        // Same lines
        [Line.of(0, 0, 1, 1), Line.of(0, 0, 1, 1), true],
    ])("case %#", (line1, line2, expected) => {
        expect(line1.isOverlapWith(line2)).toBe(expected);
    });
});
