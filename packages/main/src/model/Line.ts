import { randomId } from "../lib/randomId";
import type { ColorId } from "./ColorPaletteBase";

export interface Line {
	id: string;
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	colorId: ColorId;
}

export namespace Line {
	export function create(
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		colorId: ColorId,
	): Line {
		return {
			id: randomId(),
			x1,
			y1,
			x2,
			y2,
			colorId,
		};
	}

	export function validate(object: Record<string, unknown>): object is Line {
		if (typeof object !== "object" || object === null) {
			return false;
		}
		if (typeof object.id !== "string") {
			return false;
		}
		if (typeof object.x1 !== "number") {
			return false;
		}
		if (typeof object.y1 !== "number") {
			return false;
		}
		if (typeof object.x2 !== "number") {
			return false;
		}
		if (typeof object.y2 !== "number") {
			return false;
		}
		return true;
	}
}
