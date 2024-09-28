import { assert } from "../lib/assert";
import { randomId } from "../lib/randomId";
import { Line } from "../model/Line";
import { Shape } from "../model/Shape";

export const ClipboardService = new (class {
	copy(shapes: Shape[], lines: Line[]): Promise<void> {
		const json = JSON.stringify({ shapes, lines });
		return navigator.clipboard.writeText(json);
	}

	async paste(): Promise<{
		shapes: Shape[];
		lines: Line[];
	}> {
		try {
			const json = await navigator.clipboard.readText();
			const data = JSON.parse(json);

			assert(
				data.shapes.every(Shape.validate) && data.lines.every(Line.validate),
			);

			for (const shape of data.shapes) {
				shape.id = randomId();
			}
			for (const line of data.lines) {
				line.id = randomId();
			}
			return data;
		} catch {
			return {
				shapes: [],
				lines: [],
			};
		}
	}
})();
