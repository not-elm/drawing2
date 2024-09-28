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
			id: Math.random().toString(36).slice(2, 9),
			x,
			y,
			width,
			height,
			label: "",
			textAlignX: "center",
			textAlignY: "center",
		};
	}
}
