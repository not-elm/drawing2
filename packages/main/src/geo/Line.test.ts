import { describe, expect, test } from "bun:test";
import { isLineOverlapWithLine } from "./Line";

describe("isLineOverlapWithLine", () => {
	test.each([
		[{ x1: 0, y1: 0, x2: 1, y2: 1 }, { x1: 0, y1: 1, x2: 1, y2: 0 }, true],

		// Not crossed
		[{ x1: 0, y1: 0, x2: 1, y2: 1 }, { x1: 0, y1: 4, x2: 1, y2: 3 }, false],

		// Share the same point
		[{ x1: 0, y1: 0, x2: 1, y2: 1 }, { x1: 0, y1: 2, x2: 1, y2: 1 }, true],

		// Parallel lines
		[{ x1: 0, y1: 0, x2: 1, y2: 1 }, { x1: 0, y1: 1, x2: 1, y2: 2 }, false],

		// Same lines
		[{ x1: 0, y1: 0, x2: 1, y2: 1 }, { x1: 0, y1: 0, x2: 1, y2: 1 }, true],
	])("case %#", (line1, line2, expected) => {
		expect(isLineOverlapWithLine(line1, line2)).toBe(expected);
	});
});
