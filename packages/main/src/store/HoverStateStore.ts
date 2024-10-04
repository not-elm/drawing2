import { distanceFromPointToLine } from "../geo/Line";
import { distanceFromPointToRect } from "../geo/Rect";
import { Store } from "../lib/Store";
import { assert } from "../lib/assert";
import type { Obj, Page } from "../model/Page";
import type { CanvasStateStore } from "./CanvasStateStore";
import type { PointerStateStore } from "./PointerStateStore";
import type { ViewportStore } from "./ViewportStore";

interface HitTestResult {
    // Hit objects ordered by distance (Small distance first)
    entries: HitTestResultEntry[];
}

interface HitTestResultEntry {
    object: Obj;
    /**
     * Hit point on the object. If margin is 0, this should be exactly same as the input point.
     */
    point: { x: number; y: number };
    distance: number;
    zIndex: number;
}

export function testHitObjects(
    page: Page,
    x: number,
    y: number,
    scale: number,
    threshold = THRESHOLD,
): HitTestResult {
    const rawEntries: HitTestResultEntry[] = [];

    for (const [zIndex, objectId] of page.objectIds.entries()) {
        const object = page.objects[objectId];
        assert(object !== undefined, `Object not found: ${objectId}`);

        switch (object.type) {
            case "point": {
                const distance = Math.hypot(object.x - x, object.y - y) * scale;
                if (distance < threshold) {
                    rawEntries.push({
                        object,
                        point: object,
                        distance,
                        zIndex,
                    });
                }
                break;
            }
            case "line": {
                const { point, distance } = distanceFromPointToLine(
                    { x, y },
                    object,
                );
                if (distance < threshold) {
                    rawEntries.push({
                        object,
                        point,
                        distance,
                        zIndex,
                    });
                }
                break;
            }
            case "shape": {
                const { point, distance } = distanceFromPointToRect(
                    { x, y },
                    object,
                );
                if (distance < threshold) {
                    rawEntries.push({
                        object,
                        point,
                        distance,
                        zIndex,
                    });
                }
                break;
            }
        }
    }

    const orderedByZIndex = rawEntries.toSorted(
        (a, b) => -(a.zIndex - b.zIndex),
    );
    const orderedByDistance = orderedByZIndex.toSorted(
        (a, b) => a.distance - b.distance,
    );

    return { entries: orderedByDistance };
}

/**
 * The distance threshold for highlighting a point in canvas coordinate (px).
 */
const THRESHOLD = 32;

export class HoverStateStore extends Store<{
    hitEntry: HitTestResultEntry | null;
}> {
    constructor(
        private readonly canvasStateStore: CanvasStateStore,
        private readonly pointerStateStore: PointerStateStore,
        private readonly viewportStore: ViewportStore,
    ) {
        super({
            hitEntry: null,
        });

        canvasStateStore.addListener(() => this.recompute());
        pointerStateStore.addListener(() => this.recompute());
    }

    recompute(): void {
        const { page } = this.canvasStateStore.getState();
        const { scale } = this.viewportStore.getState();
        const { x, y } = this.pointerStateStore.getState();

        const { entries } = testHitObjects(page, x, y, scale);
        this.setState({ hitEntry: entries[0] ?? null });
    }
}
