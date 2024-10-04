import type { Rect } from "./Rect";

export interface Point {
    x: number;
    y: number;
}

export function getBoundingRectOfPoint(point: Point): Rect {
    return {
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
    };
}

/**
 * Calculate the distance from a point to a rectangle.
 * @return The distance from the point to the rectangle,
 * 		and the nearest point on the rectangle.
 */
export function distanceFromPointToPoint(p1: Point, p2: Point): number {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}
