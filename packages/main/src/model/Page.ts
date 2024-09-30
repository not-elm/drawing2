import type { Line } from "./Line";
import type { Shape } from "./Shape";

export type Obj = Shape | Line;

export interface Page {
	objects: Map<string, Obj>;
	// Ordered list of objectIds. Later objects are rendered on top of earlier objects.
	objectIds: string[];
}

export namespace Page {
	export function create(): Page {
		return {
			objects: new Map(),
			objectIds: [],
		};
	}
}

export function isShape(object: Obj) {
	return "width" in object;
}
