export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export namespace Rect {
	export function includes(rect: Rect, x: number, y: number): boolean {
		return (
			x >= rect.x &&
			x <= rect.x + rect.width &&
			y >= rect.y &&
			y <= rect.y + rect.height
		);
	}
}
