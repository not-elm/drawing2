import { isNotNullish } from "../lib/isNullish";
import type { ColorId } from "./Colors";
import type { FillMode } from "./FillMode";
import type { Page } from "./Page";
import type { TextAlignment } from "./TextAlignment";
import type { LineObject } from "./obj/LineObject";
import type { Obj } from "./obj/Obj";
import type { PointObject } from "./obj/PointObject";
import type { ShapeObject } from "./obj/ShapeObject";

export interface SerializedPage {
	objects: SerializedObj[];
	points: SerializedPointObject[];
}

export type SerializedObj = SerializedShapeObject | SerializedLineObject;

export interface SerializedShapeObject {
	type: "shape";
	id: string;
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

export interface SerializedLineObject {
	type: "line";
	id: string;
	p1Id: string;
	x1: number;
	y1: number;
	p2Id: string;
	x2: number;
	y2: number;
	colorId: ColorId;
	children: Record<
		string,
		{
			relativePosition: number;
		}
	>;
}

export interface SerializedPointObject {
	type: "point";
	id: string;
	x: number;
	y: number;
	children: string[];
	parent: { id: string; relativePosition: number } | null;
}

function serializeObject(obj: Obj): SerializedObj {
	switch (obj.type) {
		case "shape":
			return serializeShapeObject(obj);
		case "line":
			return serializeLineObject(obj);
	}
}

function serializeShapeObject(obj: ShapeObject): SerializedShapeObject {
	return {
		type: "shape",
		id: obj.id,
		x: obj.x,
		y: obj.y,
		width: obj.width,
		height: obj.height,
		label: obj.label,
		textAlignX: obj.textAlignX,
		textAlignY: obj.textAlignY,
		colorId: obj.colorId,
		fillMode: obj.fillMode,
		path: obj.path,
	};
}

function serializeLineObject(obj: LineObject): SerializedLineObject {
	return {
		type: "line",
		id: obj.id,
		p1Id: obj.p1Id,
		x1: obj.x1,
		y1: obj.y1,
		p2Id: obj.p2Id,
		x2: obj.x2,
		y2: obj.y2,
		colorId: obj.colorId,
		children: obj.children,
	};
}

function serializePointObject(obj: PointObject): SerializedPointObject {
	return {
		type: "point",
		id: obj.id,
		x: obj.x,
		y: obj.y,
		children: Array.from(obj.children),
		parent: obj.parent,
	};
}

export function serializePage(page: Page): SerializedPage {
	return {
		objects: page.objectIds
			.map((id) => page.objects.get(id))
			.filter(isNotNullish)
			.map(serializeObject),
		points: Array.from(page.points.values()).map(serializePointObject),
	};
}

export function deserializePage(serializedPage: SerializedPage): Page {
	const objects = new Map<string, Obj>();
	for (const serializedObj of serializedPage.objects) {
		const obj = deserializeObject(serializedObj);
		objects.set(obj.id, obj);
	}

	const points = new Map<string, PointObject>();
	for (const serializedPoint of serializedPage.points) {
		const point = deserializePointObject(serializedPoint);
		points.set(point.id, point);
	}

	const objectIds = serializedPage.objects.map((object) => object.id);

	return {
		objects,
		points,
		objectIds,
	};
}

function deserializeObject(serializedObj: SerializedObj): Obj {
	switch (serializedObj.type) {
		case "shape":
			return deserializeShapeObject(serializedObj);
		case "line":
			return deserializeLineObject(serializedObj);
	}
}

function deserializeShapeObject(
	serializedObj: SerializedShapeObject,
): ShapeObject {
	return {
		type: "shape",
		id: serializedObj.id,
		x: serializedObj.x,
		y: serializedObj.y,
		width: serializedObj.width,
		height: serializedObj.height,
		label: serializedObj.label,
		textAlignX: serializedObj.textAlignX,
		textAlignY: serializedObj.textAlignY,
		colorId: serializedObj.colorId,
		fillMode: serializedObj.fillMode,
		path: serializedObj.path,
	};
}

function deserializeLineObject(
	serializedObj: SerializedLineObject,
): LineObject {
	return {
		type: "line",
		id: serializedObj.id,
		p1Id: serializedObj.p1Id,
		x1: serializedObj.x1,
		y1: serializedObj.y1,
		p2Id: serializedObj.p2Id,
		x2: serializedObj.x2,
		y2: serializedObj.y2,
		colorId: serializedObj.colorId,
		children: serializedObj.children,
	};
}

function deserializePointObject(
	serializedObj: SerializedPointObject,
): PointObject {
	return {
		type: "point",
		id: serializedObj.id,
		x: serializedObj.x,
		y: serializedObj.y,
		children: new Set(serializedObj.children),
		parent: serializedObj.parent,
	};
}
