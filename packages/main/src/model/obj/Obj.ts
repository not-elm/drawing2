import type {ShapeObject} from "./ShapeObject";
import type {LineObject} from "./LineObject";
import type {PointObject} from "./PointObject";

export interface ObjBase<T extends string> {
	type: T;
	id: string;
}

export type Obj = ShapeObject | LineObject | PointObject;