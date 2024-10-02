import type { Point } from "./Point";

export interface Line {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

export function isLineOverlapWithLine(line1: Line, line2: Line): boolean {
	// l1の接線ベクトル
	const p1 = [line1.x2 - line1.x1, line1.y2 - line1.y1];

	// l2の両端との外積
	const vl2p11 = (line2.x1 - line1.x1) * p1[1] - (line2.y1 - line1.y1) * p1[0];
	const vl2p12 = (line2.x2 - line1.x1) * p1[1] - (line2.y2 - line1.y1) * p1[0];
	if (vl2p11 * vl2p12 > 0) return false;

	// l2の接線ベクトル
	const p2 = [line2.x2 - line2.x1, line2.y2 - line2.y1];

	// l1の両端との外積
	const vl1p21 = (line1.x1 - line2.x1) * p2[1] - (line1.y1 - line2.y1) * p2[0];
	const vl1p22 = (line1.x2 - line2.x1) * p2[1] - (line1.y2 - line2.y1) * p2[0];
	if (vl1p21 * vl1p22 > 0) return false;

	return true;
}

export function isLineOverlapWithPoint(line: Line, point: Point): boolean {
	const dX = line.x2 - line.x1;
	const dY = line.y2 - line.y1;

	const dx = point.x - line.x1;
	const dy = point.y - line.y1;

	const rx = dx / dX;
	const ry = dy / dY;

	return Math.abs(rx - ry) < EPS && 0 <= rx && rx <= 1;
}

/**
 * Calculate the distance from a point to a line segment.
 * @return The distance from the point to the line segment,
 * 		and the nearest point on the line segment.
 */
export function distanceFromPointToLine(
	point: Point,
	line: Line,
): {
	distance: number;
	point: Point;
} {
	const { x, y } = point;
	const { x1, y1, x2, y2 } = line;

	const p = (x - x1) * (x2 - x1) + (y - y1) * (y2 - y1);
	if (p < 0)
		return {
			distance: Math.hypot(x - x1, y - y1),
			point: { x: x1, y: y1 },
		};

	const q = (x - x2) * (x1 - x2) + (y - y2) * (y1 - y2);
	if (q < 0)
		return {
			distance: Math.hypot(x - x2, y - y2),
			point: { x: x2, y: y2 },
		};

	// 線分の長さ
	const v = Math.hypot(x2 - x1, y2 - y1);

	// 線分と点の距離(符号付き)
	const d = ((x - x1) * (y2 - y1) - (y - y1) * (x2 - x1)) / v;

	return {
		distance: Math.abs(d),
		point: {
			x: x + ((y1 - y2) / v) * d,
			y: y + ((x2 - x1) / v) * d,
		},
	};
}

const EPS = 1e-6;
