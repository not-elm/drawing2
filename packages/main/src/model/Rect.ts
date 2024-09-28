import { randomId } from "../lib/randomId";

export interface RectLike {
	x: number;
	y: number;
	width: number;
	height: number;
}

export namespace RectLike {
	export function includes(rect: RectLike, x: number, y: number): boolean {
		return (
			x >= rect.x &&
			x <= rect.x + rect.width &&
			y >= rect.y &&
			y <= rect.y + rect.height
		);
	}
}

export interface Rect {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	label: string;
	textAlignX: TextAlignment;
	textAlignY: TextAlignment;
}

export type TextAlignment =
	| "start-outside"
	| "start"
	| "center"
	| "end"
	| "end-outside";

export namespace Rect {
	export function create(
		x: number,
		y: number,
		width: number,
		height: number,
		label: string,
	): Rect {
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

	export function validate(object: Record<string, unknown>): object is Rect {
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
