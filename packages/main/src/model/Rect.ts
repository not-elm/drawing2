export interface Rect {
	id: string;
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
		return {
			id: Math.random().toString(36).slice(2, 9),
			x,
			y,
			width,
			height,
		};
	}
}
