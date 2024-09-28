import type { Line } from "./Line";
import type { Rect } from "./Rect";

export interface Page {
	rects: Map<string, Rect>;
	lines: Map<string, Line>;
}

export namespace Page {
	export function create(): Page {
		return {
			rects: new Map(),
			lines: new Map(),
		};
	}
}
