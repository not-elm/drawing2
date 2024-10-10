import { assert } from "../lib/assert";
import {
    type Line,
    distanceFromPointToLine,
    isLineOverlapWithLine,
} from "./Line";
import type { Point } from "./Point";

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function isRectOverlapWithRect(rect1: Rect, rect2: Rect): boolean {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

export function isRectOverlapWithLine(rect: Rect, line: Line): boolean {
    return (
        isRectOverlapWithPoint(rect, { x: line.x1, y: line.y1 }) ||
        isRectOverlapWithPoint(rect, { x: line.x2, y: line.y2 }) ||
        isLineOverlapWithLine(line, {
            x1: rect.x,
            y1: rect.y,
            x2: rect.x + rect.width,
            y2: rect.y,
        }) ||
        isLineOverlapWithLine(line, {
            x1: rect.x + rect.width,
            y1: rect.y,
            x2: rect.x + rect.width,
            y2: rect.y + rect.height,
        }) ||
        isLineOverlapWithLine(line, {
            x1: rect.x + rect.width,
            y1: rect.y + rect.height,
            x2: rect.x,
            y2: rect.y + rect.height,
        }) ||
        isLineOverlapWithLine(line, {
            x1: rect.x,
            y1: rect.y + rect.height,
            x2: rect.x,
            y2: rect.y,
        })
    );
}

export function isRectOverlapWithPoint(rect: Rect, point: Point): boolean {
    return (
        rect.x <= point.x &&
        point.x <= rect.x + rect.width &&
        rect.y <= point.y &&
        point.y <= rect.y + rect.height
    );
}

export function unionRect(rect1: Rect, rect2: Rect): Rect {
    const x = Math.min(rect1.x, rect2.x);
    const y = Math.min(rect1.y, rect2.y);
    const width = Math.max(rect1.x + rect1.width, rect2.x + rect2.width) - x;
    const height = Math.max(rect1.y + rect1.height, rect2.y + rect2.height) - y;
    return { x, y, width, height };
}

export function unionRectAll(rects: Rect[]): Rect {
    assert(rects.length > 0);
    let rect = rects[0];
    for (const r of rects) {
        rect = unionRect(rect, r);
    }
    return rect;
}

/**
 * Calculate the distance from a point to a rectangle.
 * @return The distance from the point to the rectangle,
 * 		and the nearest point on the rectangle.
 */
export function distanceFromPointToRect(
    point: Point,
    rect: Rect,
): {
    distance: number;
    point: Point;
} {
    if (isRectOverlapWithPoint(rect, point)) {
        return { distance: 0, point };
    }

    const { x: x1, y: y1 } = rect;
    const x2 = x1 + rect.width;
    const y2 = y1 + rect.height;

    return [
        { x1: x2, y1, x2, y2 },
        { x1, y1: y2, x2, y2 },
        { x1, y1, x2: x1, y2 },
        { x1, y1, x2, y2: y1 },
    ]
        .map((edge) => distanceFromPointToLine(point, edge))
        .sort((a, b) => a.distance - b.distance)[0];
}

export function getBoundingRectOfRect(rect: Rect): Rect {
    return rect;
}
