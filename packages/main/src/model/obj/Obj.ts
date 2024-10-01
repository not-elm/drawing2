import type { LineObject } from "./LineObject";
import type { ShapeObject } from "./ShapeObject";

export interface ObjBase<T extends string> {
	type: T;
	id: string;
}

export type Obj = ShapeObject | LineObject;
