export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export namespace Rect {
	export function create(
		x: number,
		y: number,
		width: number,
		height: number,
	): Rect {
		return { x, y, width, height };
	}
}
