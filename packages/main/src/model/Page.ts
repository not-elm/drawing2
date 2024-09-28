import type { Line } from "./Line";
import type { Shape } from "./Shape";

export interface Page {
	shapes: Map<string, Shape>;
	lines: Map<string, Line>;
}

export namespace Page {
	export function create(): Page {
		return {
			shapes: new Map(),
			lines: new Map(),
		};
	}
}
