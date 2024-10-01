import type { LineObject } from "./obj/LineObject";
import type { ShapeObject } from "./obj/ShapeObject";

export type Obj = ShapeObject | LineObject;

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
