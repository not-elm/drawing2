import type { Line } from "./Line";
import type { Rect } from "./Rect";

export interface Page {
	rects: Rect[];
	lines: Line[];
}

export namespace Page {
	export function create(): Page {
		return {
			rects: [],
			lines: [],
		};
	}

	export function addRect(page: Page, rect: Rect): Page {
		return {
			...page,
			rects: [...page.rects, rect],
		};
	}

	export function addLine(page: Page, line: Line): Page {
		return {
			...page,
			lines: [...page.lines, line],
		};
	}
}
