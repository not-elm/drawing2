import type { Rect } from "./Rect";

export interface Point {
	x: number;
	y: number;
}

export function getBoundingRectOfPoint(point: Point): Rect {
	return {
		x: point.x,
		y: point.y,
		width: 0,
		height: 0,
	};
}
