import { distanceFromPointToLine } from "../geo/Line";
import { distanceFromPointToRect } from "../geo/Rect";
import { Store } from "../lib/Store";
import { assert } from "../lib/assert";
import type {
    Block,
    Entity,
    LineBlock,
    Page,
    PointEntity,
} from "../model/Page";
import type { CanvasStateStore } from "./CanvasStateStore";
import type { PointerStateStore } from "./PointerStateStore";
import type { ViewportStore } from "./ViewportStore";

interface HitTestResult {
    // Hit entities ordered by distance (Small distance first)
    entities: HitTestResultEntry<Entity>[];
    blocks: HitTestResultEntry<Block>[];
    points: HitTestResultEntry<PointEntity>[];
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
    const points: HitTestResultEntry<PointEntity>[] = [];

    // TODO: PointのzIndex値を正しく計算する
    let zIndexForPoint = 0;
    for (const point of Object.values(page.points)) {
        zIndexForPoint++;
        const distance = Math.hypot(point.x - x, point.y - y) * scale;
        if (distance < threshold) {
            const entry: HitTestResultEntry<PointEntity> = {
                target: point,
                point: point,
                distance,
                zIndex: zIndexForPoint,
            };
            points.push(entry);
            entities.push(entry);
        }
    }
    for (const [zIndex, blockId] of page.blockIds.entries()) {
        const block = page.blocks[blockId];
        assert(block !== undefined, `Block not found: ${blockId}`);

        switch (block.type) {
            case "line": {
                const { point, distance } = distanceFromPointToLine(
                    { x, y },
                    block,
                );
                if (distance < threshold) {
                    const entry: HitTestResultEntry<LineBlock> = {
                        target: block,
                        point,
                        distance,
                        zIndex: zIndex + zIndexForPoint,
                    };
                    blocks.push(entry);
                    entities.push(entry);
                }
                break;
            }
            case "shape":
            case "text": {
                const { point, distance } = distanceFromPointToRect(
                    { x, y },
                    block,
                );
                if (distance < threshold) {
                    const entry: HitTestResultEntry<Block> = {
                        target: block,
                        point,
                        distance,
                        zIndex: zIndex + zIndexForPoint,
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
    points
        .sort((a, b) => -(a.zIndex - b.zIndex))
        .sort((a, b) => a.distance - b.distance);

    return {
        entities,
        blocks: blocks,
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

        const { entities } = testHitEntities(page, x, y, scale);
        this.setState({ hitEntry: entities[0] ?? null });
    }
}
