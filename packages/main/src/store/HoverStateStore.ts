import { distanceFromPointToLine } from "../geo/Line";
import { distanceFromPointToRect } from "../geo/Rect";
import { Store } from "../lib/Store";
import { assert } from "../lib/assert";
import type {
    Entity,
    LineObject,
    Obj,
    Page,
    PointObject,
    ShapeObject,
} from "../model/Page";
import type { CanvasStateStore } from "./CanvasStateStore";
import type { PointerStateStore } from "./PointerStateStore";
import type { ViewportStore } from "./ViewportStore";

interface HitTestResult {
    // Hit objects ordered by distance (Small distance first)
    entities: HitTestResultEntry<Entity>[];
    objects: HitTestResultEntry<Obj>[];
    points: HitTestResultEntry<PointObject>[];
}

interface HitTestResultEntry<T> {
    target: T;
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
    const entities: HitTestResultEntry<Entity>[] = [];
    const objects: HitTestResultEntry<Obj>[] = [];
    const points: HitTestResultEntry<PointObject>[] = [];

    // TODO: PointのzIndex値を正しく計算する
    let zIndexForPoint = 0;
    for (const point of Object.values(page.points)) {
        zIndexForPoint++;
        const distance = Math.hypot(point.x - x, point.y - y) * scale;
        if (distance < threshold) {
            const entry: HitTestResultEntry<PointObject> = {
                target: point,
                point: point,
                distance,
                zIndex: zIndexForPoint,
            };
            points.push(entry);
            entities.push(entry);
        }
    }
    for (const [zIndex, objectId] of page.objectIds.entries()) {
        const object = page.objects[objectId];
        assert(object !== undefined, `Object not found: ${objectId}`);

        switch (object.type) {
            case "line": {
                const { point, distance } = distanceFromPointToLine(
                    { x, y },
                    object,
                );
                if (distance < threshold) {
                    const entry: HitTestResultEntry<LineObject> = {
                        target: object,
                        point,
                        distance,
                        zIndex: zIndex + zIndexForPoint,
                    };
                    objects.push(entry);
                    entities.push(entry);
                }
                break;
            }
            case "shape": {
                const { point, distance } = distanceFromPointToRect(
                    { x, y },
                    object,
                );
                if (distance < threshold) {
                    const entry: HitTestResultEntry<ShapeObject> = {
                        target: object,
                        point,
                        distance,
                        zIndex: zIndex + zIndexForPoint,
                    };
                    objects.push(entry);
                    entities.push(entry);
                }
                break;
            }
        }
    }

    objects
        .sort((a, b) => -(a.zIndex - b.zIndex))
        .sort((a, b) => a.distance - b.distance);
    entities
        .sort((a, b) => -(a.zIndex - b.zIndex))
        .sort((a, b) => a.distance - b.distance);
    points
        .sort((a, b) => -(a.zIndex - b.zIndex))
        .sort((a, b) => a.distance - b.distance);

    return {
        entities,
        objects,
        points,
    };
}

/**
 * The distance threshold for highlighting a point in canvas coordinate (px).
 */
const THRESHOLD = 32;

export class HoverStateStore extends Store<{
    hitEntry: HitTestResultEntry<Entity> | null;
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

        const { entities } = testHitObjects(page, x, y, scale);
        this.setState({ hitEntry: entities[0] ?? null });
    }
}
