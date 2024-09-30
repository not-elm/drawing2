import { assert } from "../lib/assert";
import { randomId } from "../lib/randomId";
import { Line } from "../model/Line";
import type { Obj } from "../model/Page";
import { Shape } from "../model/Shape";

export const ClipboardService = new (class {
	copy(objects: Obj[]): Promise<void> {
		const json = JSON.stringify({ objects });
		return navigator.clipboard.writeText(json);
	}

	async paste(): Promise<{
		objects: Obj[];
	}> {
		try {
			const json = await navigator.clipboard.readText();
			const data = JSON.parse(json) as { objects: Obj[] };

			for (const obj of data.objects) {
				assert(Shape.validate(obj) || Line.validate(obj));
				obj.id = randomId();
			}
			return data;
		} catch {
			return {
				objects: [],
			};
		}
	}
})();
