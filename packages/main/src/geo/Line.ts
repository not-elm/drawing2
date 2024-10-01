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

const EPS = 1e-6;
