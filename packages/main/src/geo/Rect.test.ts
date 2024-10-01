import { describe, expect, test } from "bun:test";
import { isRectOverlapWithLine } from "./Rect";

describe("isRectOverlapWithLine", () => {
	test.each([
		// Both line edge points are outside of the rect
		[
			{ x: 0, y: 0, width: 1, height: 1 },
			{ x1: -1, y1: 0, x2: 2, y2: 1 },
			true,
		],

		// One of the line edge point is inside of the rect
		[
			{ x: 0, y: 0, width: 2, height: 2 },
			{ x1: -1, y1: -1, x2: 1, y2: 1 },
			true,
		],

		// The line is completely inside of the rect
		[{ x: 0, y: 0, width: 3, height: 3 }, { x1: 1, y1: 1, x2: 2, y2: 2 }, true],
	])("case %#", (rect, line, expected) => {
		expect(isRectOverlapWithLine(rect, line)).toBe(expected);
	});
});
