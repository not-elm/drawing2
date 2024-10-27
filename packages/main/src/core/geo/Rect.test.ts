import { describe, expect, test } from "bun:test";
import { Line } from "./Line";
import { Rect } from "./Rect";

describe("overlap", () => {
    test.each([
        // Both line edge points are outside of the rect
        [Rect.of(0, 0, 1, 1), Line.of(-1, 0, 2, 1), true],

        // One of the line edge point is inside of the rect
        [Rect.of(0, 0, 2, 2), Line.of(-1, -1, 1, 1), true],

        // The line is completely inside of the rect
        [Rect.of(0, 0, 3, 3), Line.of(1, 1, 2, 2), true],
    ])("case %#", (rect, line, expected) => {
        expect(rect.isOverlappedWith(line)).toBe(expected);
    });
});
