import { randomId } from "../lib/randomId";
import type { Obj } from "../model/Page";

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
