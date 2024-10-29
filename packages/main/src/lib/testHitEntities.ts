import type { Entity, EntityHandleMap } from "../core/Entity";
import type { Page } from "../core/Page";
import type { Point } from "../core/shape/Point";
import { assert } from "./assert";

interface HitTestResult {
    // Hit entities ordered by distance (Small distance first)
    entities: HitTestResultEntry<Entity>[];
}

interface HitTestResultEntry<T> {
    target: T;
    /**
     * Hit point on the target entity. If margin is 0,
     * this should be exactly same as the input point.
     */
    point: Point;
    distance: number;
    zIndex: number;
}

export function testHitEntities(
    page: Page,
    point: Point,
    scale: number,
    entityHandle: EntityHandleMap,
    marginInCanvas = 8,
): HitTestResult {
    const margin = marginInCanvas / scale;
    const entities: HitTestResultEntry<Entity>[] = [];

    for (const [zIndex, entityId] of page.entityIds.entries()) {
        const entity = page.entities.get(entityId);
        assert(entity !== undefined, `Entity not found: ${entityId}`);

        const { point: hitPoint, distance } = entityHandle
            .getShape(entity)
            .getDistance(point);
        if (distance <= margin) {
            const entry: HitTestResultEntry<Entity> = {
                target: entity,
                point: hitPoint,
                distance,
                zIndex,
            };
            entities.push(entry);
        }
    }

    entities
        .sort((a, b) => -(a.zIndex - b.zIndex))
        .sort((a, b) => a.distance - b.distance);

    return {
        entities,
    };
}
