import { describe, expect, test } from "bun:test";
import { Line } from "./Line";

describe("Line", () => {
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
	])("isOverlap(%o, %o) === %o", (l1, l2, expected) => {
		expect(Line.isOverlap(l1, l2)).toBe(expected);
	});
});
