import type { Rect } from "../../geo/Rect";
import { randomId } from "../../lib/randomId";
import type { ColorId } from "../Colors";

export interface LineObject {
	id: string;
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	colorId: ColorId;
}

export function createLineObject(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	colorId: ColorId,
): LineObject {
	return {
		id: randomId(),
		x1,
		y1,
		x2,
		y2,
		colorId,
	};
}

export function getBoundingRectOfLineObject(obj: LineObject): Rect {
	return {
		x: Math.min(obj.x1, obj.x2),
		y: Math.min(obj.y1, obj.y2),
		width: Math.abs(obj.x1 - obj.x2),
		height: Math.abs(obj.y1 - obj.y2),
	};
}
