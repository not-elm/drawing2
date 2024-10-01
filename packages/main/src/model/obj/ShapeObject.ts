import type { Rect } from "../../geo/Rect";
import { randomId } from "../../lib/randomId";
import type { ColorId } from "../Colors";
import type { FillMode } from "../FillMode";
import type { ObjBase } from "../Page";
import type { TextAlignment } from "../TextAlignment";

export function getRectanglePath() {
	return [
		[0, 0],
		[0, 1],
		[1, 1],
		[1, 0],
	];
}

export function getTrianglePath() {
	return [
		[0.5, 0],
		[1, 1],
		[0, 1],
	];
}

export interface ShapeObject extends ObjBase<"shape"> {
	x: number;
	y: number;
	width: number;
	height: number;
	label: string;
	textAlignX: TextAlignment;
	textAlignY: TextAlignment;
	colorId: ColorId;
	fillMode: FillMode;
	path: number[][];
}

export function createShapeObject(
	x: number,
	y: number,
	width: number,
	height: number,
	label: string,
	textAlignX: TextAlignment,
	textAlignY: TextAlignment,
	colorId: ColorId,
	fillMode: FillMode,
	path: number[][],
): ShapeObject {
	return {
		type: "shape",
		id: randomId(),
		x,
		y,
		width,
		height,
		label,
		textAlignX,
		textAlignY,
		colorId,
		fillMode,
		path,
	};
}

export function getBoundingRectOfShapeObject(obj: ShapeObject): Rect {
	return {
		x: obj.x,
		y: obj.y,
		width: obj.width,
		height: obj.height,
	};
}
