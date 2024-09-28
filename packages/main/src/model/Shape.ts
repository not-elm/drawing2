import { randomId } from "../lib/randomId";
import type { TextAlignment } from "./TextAlignment";

export interface Shape {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	label: string;
	textAlignX: TextAlignment;
	textAlignY: TextAlignment;
}

export namespace Shape {
	export function create(
		x: number,
		y: number,
		width: number,
		height: number,
		label: string,
	): Shape {
		return {
			id: randomId(),
			x,
			y,
			width,
			height,
			label: "",
			textAlignX: "center",
			textAlignY: "center",
		};
	}

	export function validate(object: Record<string, unknown>): object is Shape {
		if (typeof object !== "object" || object === null) {
			return false;
		}
		if (typeof object.id !== "string") {
			return false;
		}
		if (typeof object.x !== "number") {
			return false;
		}
		if (typeof object.y !== "number") {
			return false;
		}
		if (typeof object.width !== "number") {
			return false;
		}
		if (typeof object.height !== "number") {
			return false;
		}
		if (typeof object.label !== "string") {
			return false;
		}
		if (typeof object.textAlignX !== "string") {
			return false;
		}
		if (typeof object.textAlignY !== "string") {
			return false;
		}
		return true;
	}
}