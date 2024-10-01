import type { Obj } from "./obj/Obj";
import type { PointObject } from "./obj/PointObject";

export interface Page {
	objects: Map<string, Obj>;
	points: Map<string, PointObject>;
	// Ordered list of objectIds. Later objects are rendered on top of earlier objects.
	objectIds: string[];
}

export namespace Page {
	export function create(): Page {
		return {
			objects: new Map(),
			points: new Map(),
			objectIds: [],
		};
	}
}
