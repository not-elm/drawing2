import type { Line } from "./Line";
import type { Shape } from "./Shape";

export interface Page {
	shapes: Map<string, Shape>;
	lines: Map<string, Line>;

	// Ordered list of object IDs. Later objects are rendered on top of earlier objects.
	objectIds: string[];
	schemaUpdatedAt: number;
}

export namespace Page {
	export function create(): Page {
		return {
			shapes: new Map(),
			lines: new Map(),
			objectIds: [],
			schemaUpdatedAt: Date.now(),
		};
	}
}
