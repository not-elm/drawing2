import type { Rect } from "../../geo/Rect";
import { randomId } from "../../lib/randomId";

import type { ObjBase } from "./Obj";

export interface PointObject extends ObjBase<"point"> {
	id: string;
	x: number;
	y: number;
	children: Set<string>;
}

export function createPointObject(x: number, y: number): PointObject {
	return {
		type: "point",
		id: randomId(),
		x,
		y,
		children: new Set(),
	};
}

export function getBoundingRectOfPointObject(obj: PointObject): Rect {
	return {
		x: obj.x,
		y: obj.y,
		width: 0,
		height: 0,
	};
}
