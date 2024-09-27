export interface Line {
	id: string;
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

export namespace Line {
	export function create(x1: number, y1: number, x2: number, y2: number): Line {
		return {
			id: Math.random().toString(36).slice(2, 9),
			x1,
			y1,
			x2,
			y2,
		};
	}
}
