import { randomId } from "../lib/randomId";
import type { ColorId } from "./ColorPaletteBase";

export interface LineLike {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

export interface Line {
	id: string;
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	colorId: ColorId;
}

export namespace Line {
	export function create(
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		colorId: ColorId,
	): Line {
		return {
			id: randomId(),
			x1,
			y1,
			x2,
			y2,
			colorId,
		};
	}

	export function validate(object: Record<string, unknown>): object is Line {
		if (typeof object !== "object" || object === null) {
			return false;
		}
		if (typeof object.id !== "string") {
			return false;
		}
		if (typeof object.x1 !== "number") {
			return false;
		}
		if (typeof object.y1 !== "number") {
			return false;
		}
		if (typeof object.x2 !== "number") {
			return false;
		}
		if (typeof object.y2 !== "number") {
			return false;
		}
		return true;
	}

	export function isOverlap(l1: LineLike, l2: LineLike): boolean {
		// l1の接線ベクトル
		const p1 = [l1.x2 - l1.x1, l1.y2 - l1.y1];

		// l2の両端との外積
		const vl2p11 = (l2.x1 - l1.x1) * p1[1] - (l2.y1 - l1.y1) * p1[0];
		const vl2p12 = (l2.x2 - l1.x1) * p1[1] - (l2.y2 - l1.y1) * p1[0];
		if (vl2p11 * vl2p12 > 0) return false;

		// l2の接線ベクトル
		const p2 = [l2.x2 - l2.x1, l2.y2 - l2.y1];

		// l1の両端との外積
		const vl1p21 = (l1.x1 - l2.x1) * p2[1] - (l1.y1 - l2.y1) * p2[0];
		const vl1p22 = (l1.x2 - l2.x1) * p2[1] - (l1.y2 - l2.y1) * p2[0];
		if (vl1p21 * vl1p22 > 0) return false;

		return true;
	}
}
