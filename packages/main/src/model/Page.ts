import type { Obj } from "./obj/Obj";

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
