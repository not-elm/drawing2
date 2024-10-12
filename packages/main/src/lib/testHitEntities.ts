import { distanceFromPointToLine } from "../geo/Line";
import { distanceFromPointToRect } from "../geo/Rect";
import {
    type Entity,
    type Page,
    type PathEntity,
    getEdgesFromPath,
} from "../model/Page";
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
    x: number,
    y: number,
    scale: number,
    threshold = THRESHOLD,
): HitTestResult {
    const entities: HitTestResultEntry<Entity>[] = [];

    for (const [zIndex, entityId] of page.entityIds.entries()) {
        const entity = page.entities[entityId];
        assert(entity !== undefined, `Entity not found: ${entityId}`);

        switch (entity.type) {
            case "path": {
                for (const edge of getEdgesFromPath(entity)) {
                    const { point, distance } = distanceFromPointToLine(
                        { x, y },
                        edge,
                    );
                    if (distance <= threshold) {
                        const entry: HitTestResultEntry<PathEntity> = {
                            target: entity,
                            point,
                            distance,
                            zIndex,
                        };
                        entities.push(entry);
                        entities.push(entry);
                    }
                }
                break;
            }
            case "shape":
            case "text": {
                const { point, distance } = distanceFromPointToRect(
                    { x, y },
                    entity,
                );
                if (distance <= threshold) {
                    const entry: HitTestResultEntry<Entity> = {
                        target: entity,
                        point,
                        distance,
                        zIndex,
                    };
                    entities.push(entry);
                    entities.push(entry);
                }
                break;
            }
        }
    }

    entities
        .sort((a, b) => -(a.zIndex - b.zIndex))
        .sort((a, b) => a.distance - b.distance);
    entities
        .sort((a, b) => -(a.zIndex - b.zIndex))
        .sort((a, b) => a.distance - b.distance);

    return {
        entities,
    };
}

/**
 * The distance threshold for highlighting a point in canvas coordinate (px).
 */
const THRESHOLD = 32;
