import { distanceFromPointToLine } from "../geo/Line";
import { distanceFromPointToRect } from "../geo/Rect";
import {
    type Block,
    type Entity,
    type Page,
    type PathBlock,
    getEdgesFromPath,
} from "../model/Page";
import { assert } from "./assert";

interface HitTestResult {
    // Hit entities ordered by distance (Small distance first)
    entities: HitTestResultEntry<Entity>[];
    blocks: HitTestResultEntry<Block>[];
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
    const blocks: HitTestResultEntry<Block>[] = [];

    for (const [zIndex, blockId] of page.blockIds.entries()) {
        const block = page.blocks[blockId];
        assert(block !== undefined, `Block not found: ${blockId}`);

        switch (block.type) {
            case "path": {
                for (const edge of getEdgesFromPath(block)) {
                    const { point, distance } = distanceFromPointToLine(
                        { x, y },
                        edge,
                    );
                    if (distance <= threshold) {
                        const entry: HitTestResultEntry<PathBlock> = {
                            target: block,
                            point,
                            distance,
                            zIndex,
                        };
                        blocks.push(entry);
                        entities.push(entry);
                    }
                }
                break;
            }
            case "shape":
            case "text": {
                const { point, distance } = distanceFromPointToRect(
                    { x, y },
                    block,
                );
                if (distance <= threshold) {
                    const entry: HitTestResultEntry<Block> = {
                        target: block,
                        point,
                        distance,
                        zIndex,
                    };
                    blocks.push(entry);
                    entities.push(entry);
                }
                break;
            }
        }
    }

    blocks
        .sort((a, b) => -(a.zIndex - b.zIndex))
        .sort((a, b) => a.distance - b.distance);
    entities
        .sort((a, b) => -(a.zIndex - b.zIndex))
        .sort((a, b) => a.distance - b.distance);

    return {
        entities,
        blocks: blocks,
    };
}

/**
 * The distance threshold for highlighting a point in canvas coordinate (px).
 */
const THRESHOLD = 32;
