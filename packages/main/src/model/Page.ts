import type { Rect } from "./Rect";

export interface Page {
	rects: Rect[];
}

export namespace Page {
	export function create(): Page {
		return {
			rects: [],
		};
	}

	export function addRect(page: Page, rect: Rect): Page {
		return {
			...page,
			rects: [...page.rects, rect],
		};
	}
}
