export interface Line {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

export namespace Line {
	export function create(x1: number, y1: number, x2: number, y2: number): Line {
		return { x1, y1, x2, y2 };
	}
}
