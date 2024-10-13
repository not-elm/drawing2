import type { Point } from "../geo/Point";
import type { Entity } from "../model/Entity";
import type { Page } from "../model/Page";
import { type PathEntity, getEdgesFromPath } from "../model/PathEntity";
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
    point: { x: number; y: number };
    distance: number;
    zIndex: number;
}

export function testHitEntities(
    page: Page,
    point: Point,
    scale: number,
    marginInCanvas = 8,
): HitTestResult {
    const margin = marginInCanvas / scale;
    const entities: HitTestResultEntry<Entity>[] = [];

    for (const [zIndex, entityId] of page.entityIds.entries()) {
        const entity = page.entities[entityId];
        assert(entity !== undefined, `Entity not found: ${entityId}`);

        switch (entity.type) {
            case "path": {
                for (const edge of getEdgesFromPath(entity)) {
                    const { point: hitPoint, distance } =
                        edge.getDistanceFrom(point);
                    if (distance <= margin) {
                        const entry: HitTestResultEntry<PathEntity> = {
                            target: entity,
                            point: hitPoint,
                            distance,
                            zIndex,
                        };
                        entities.push(entry);
                    }
                }
                break;
            }
            case "shape":
            case "text": {
                const { point: hitPoint, distance } =
                    entity.rect.getDistanceFrom(point);
                if (distance <= margin) {
                    const entry: HitTestResultEntry<Entity> = {
                        target: entity,
                        point: hitPoint,
                        distance,
                        zIndex,
                    };
                    entities.push(entry);
                }
                break;
            }
        }
    }

    entities
        .sort((a, b) => -(a.zIndex - b.zIndex))
        .sort((a, b) => a.distance - b.distance);

    return {
        entities,
    };
}
