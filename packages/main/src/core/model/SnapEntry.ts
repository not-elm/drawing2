import type { Line } from "../../lib/geo/Line";
import type { Point } from "../../lib/geo/Point";
import { getBoundingRect } from "./Entity";
import { type Page, getEntitiesInViewport } from "./Page";
import type { Viewport } from "./Viewport";

export interface SnapEntry2D {
    x: SnapEntry;
    y: SnapEntry;
}

export interface SnapEntry {
    before: number;
    after: number;
    distance: number;
    points: Point[];
    snapped: boolean;
}

export interface SnapGuide {
    points: Point[];
    lines: Line[];
}

export function computeSnapEntry2D(
    page: Page,
    viewport: Viewport,
    point: Point,
    ignoreEntityIds: string[],
    threshold = 16,
): SnapEntry2D {
    let bestXPoints: Point[] = [];
    let bestYPoints: Point[] = [];
    const ignoreEntityIdSet = new Set(ignoreEntityIds);
    let minXDistance = threshold / viewport.scale;
    let minYDistance = threshold / viewport.scale;

    for (const otherEntity of getEntitiesInViewport(page, viewport)) {
        if (ignoreEntityIdSet.has(otherEntity.id)) {
            continue;
        }
        const otherBoundingRect = getBoundingRect(otherEntity);
        const otherSnapPoints = [
            otherBoundingRect.topLeft,
            otherBoundingRect.topRight,
            otherBoundingRect.bottomLeft,
            otherBoundingRect.bottomRight,
            otherBoundingRect.center,
        ];
        for (const otherSnapPoint of otherSnapPoints) {
            const xDistance = Math.abs(point.x - otherSnapPoint.x);
            const yDistance = Math.abs(point.y - otherSnapPoint.y);

            if (xDistance < minXDistance) {
                bestXPoints.length = 0;
                minXDistance = xDistance;
            }
            if (xDistance === minXDistance) {
                bestXPoints.push(otherSnapPoint);
            }

            if (yDistance < minYDistance) {
                bestYPoints.length = 0;
                minYDistance = yDistance;
            }
            if (yDistance === minYDistance) {
                bestYPoints.push(otherSnapPoint);
            }
        }
    }

    if (minXDistance > threshold) {
        bestXPoints.length = 0;
    }
    if (minYDistance > threshold) {
        bestYPoints.length = 0;
    }

    // Filter out points that have the same distance but at opposite direction.
    if (bestXPoints.length >= 2) {
        bestXPoints = bestXPoints.filter(
            (point) => point.x === bestXPoints[0].x,
        );
    }
    if (bestYPoints.length >= 2) {
        bestYPoints = bestYPoints.filter(
            (point) => point.y === bestYPoints[0].y,
        );
    }

    return {
        x: {
            before: point.x,
            after: bestXPoints[0]?.x ?? point.x,
            distance: minXDistance,
            points: bestXPoints,
            snapped: bestXPoints.length > 0,
        },
        y: {
            before: point.y,
            after: bestYPoints[0]?.y ?? point.y,
            distance: minYDistance,
            points: bestYPoints,
            snapped: bestYPoints.length > 0,
        },
    };
}
