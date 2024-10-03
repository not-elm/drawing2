import { distanceFromPointToLine } from "../geo/Line";
import { Store } from "../lib/Store";
import { assert } from "../lib/assert";
import type { Page } from "../model/Page";
import type { CanvasStateStore } from "./CanvasStateStore";
import type { PointerStateStore } from "./PointerStateStore";
import type { ViewportStore } from "./ViewportStore";

interface NearestPoint {
    x: number;
    y: number;
    distance: number;
    pointId: string | null;
    lineId: string | null;
    shapeId: string | null;
}

/**
 * The distance threshold for highlighting a point in canvas coordinate (px).
 */
const THRESHOLD = 16;

export function getNearestPoint(
    page: Page,
    x: number,
    y: number,
    scale: number,
    ignorePointIds: string[],
    threshold = THRESHOLD,
) {
    const objects = Object.values(page.objects);
    const points = objects.filter((object) => object.type === "point");
    const lines = objects.filter((object) => object.type === "line");
    const shapes = objects.filter((object) => object.type === "shape");

    const ignoreIdSet = new Set();
    for (const pointId of ignorePointIds) {
        const point = page.objects[pointId];
        assert(point !== undefined, `Point not found: ${pointId}`);

        ignoreIdSet.add(point.id);
        for (const dependency of page.dependencies.getByFromObjectId(pointId)) {
            if (dependency.type !== "lineEndPoint") continue;
            const line = page.objects[dependency.to];
            assert(line !== undefined, `Line not found: ${dependency.to}`);
            assert(line.type === "line", `Expected line: ${dependency.to}`);
            ignoreIdSet.add(line.id);

            for (const dependency of page.dependencies.getByFromObjectId(
                line.id,
            )) {
                if (dependency.type !== "lineEndPoint") continue;
                ignoreIdSet.add(dependency.from);
            }
        }
    }

    let nearestPoint: NearestPoint | null = null;
    for (const point of points) {
        if (ignoreIdSet.has(point.id)) continue;

        const distance = Math.hypot(point.x - x, point.y - y) * scale;
        if (distance < threshold) {
            if (
                distance < (nearestPoint?.distance ?? Number.POSITIVE_INFINITY)
            ) {
                nearestPoint = {
                    x: point.x,
                    y: point.y,
                    distance,
                    pointId: point.id,
                    lineId: null,
                    shapeId: null,
                };
            }
        }
    }
    // Prioritize the point over the line
    if (nearestPoint !== null) return nearestPoint;

    for (const line of lines) {
        if (ignoreIdSet.has(line.id)) continue;

        if (line.type === "line") {
            const { point, distance } = distanceFromPointToLine({ x, y }, line);
            if (distance < threshold) {
                if (point.x === line.x1 && point.y === line.y1) continue;
                if (point.x === line.x2 && point.y === line.y2) continue;

                if (
                    distance <
                    (nearestPoint?.distance ?? Number.POSITIVE_INFINITY)
                ) {
                    nearestPoint = {
                        x: point.x,
                        y: point.y,
                        distance,
                        pointId: null,
                        lineId: line.id,
                        shapeId: null,
                    };
                }
            }
        }
    }
    if (nearestPoint !== null) return nearestPoint;

    return null;
}

export class HoverStateStore extends Store<{
    nearestPoint: NearestPoint | null;
}> {
    constructor(
        private readonly canvasStateStore: CanvasStateStore,
        private readonly pointerStateStore: PointerStateStore,
        private readonly viewportStore: ViewportStore,
    ) {
        super({
            nearestPoint: null,
        });

        canvasStateStore.addListener(() => this.recompute());
        pointerStateStore.addListener(() => this.recompute());
    }

    recompute(): void {
        const { page } = this.canvasStateStore.getState();
        const { scale } = this.viewportStore.getState();
        const { x, y } = this.pointerStateStore.getState();

        const nearestPoint = getNearestPoint(page, x, y, scale, []);

        this.setState({ nearestPoint });
    }
}
