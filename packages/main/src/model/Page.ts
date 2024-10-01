import type { Rect } from "../geo/Rect";
import { randomId } from "../lib/randomId";
import type { LineObject } from "./obj/LineObject";
import type { ShapeObject } from "./obj/ShapeObject";

export interface ObjBase<T extends string> {
	type: T;
	id: string;
}

export type Obj = ShapeObject | LineObject | PointObject;

export interface Page {
	objects: Map<string, Obj>;
	// Ordered list of objectIds. Later objects are rendered on top of earlier objects.
	objectIds: string[];
}

export interface Point {
	x: number;
	y: number;
}

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

export namespace Page {
	export function create(): Page {
		return {
			objects: new Map(),
			objectIds: [],
		};
	}
}

export function getBoundingRectOfPointObject(obj: PointObject): Rect {
	return {
		x: obj.x,
		y: obj.y,
		width: 0,
		height: 0,
	};
}
