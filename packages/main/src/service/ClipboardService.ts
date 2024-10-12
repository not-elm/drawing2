import { assert } from "../lib/assert";
import { randomId } from "../lib/randomId";
import {
    type Dependency,
    type SerializedDependency,
    deserializeDependency,
    serializeDependency,
} from "../model/Dependency";
import type { Block, Page, PointEntity } from "../model/Page";
import {
    type SerializedBlock,
    type SerializedPointEntity,
    deserializeBlock,
    deserializePoint,
    serializeBlock,
    serializePoint,
} from "../model/SerializedPage";

interface ClipboardData {
    blocks: SerializedBlock[];
    points: SerializedPointEntity[];
    dependencies: SerializedDependency[];
}

export const ClipboardService = new (class {
    copy(page: Page, blockIds: string[]): Promise<void> {
        const blockIdSet = new Set(blockIds);
        const blocksInOrder: Block[] = [];
        const pointSet = new Set<PointEntity>();
        const dependencySet = new Set<Dependency>();

        for (const blockId of page.blockIds) {
            if (!blockIdSet.has(blockId)) continue;

            blocksInOrder.push(page.blocks[blockId]);
            for (const dep of page.dependencies.getByToEntityId(blockId)) {
                dependencySet.add(dep);
            }
        }
        for (const point of pointSet) {
            for (const dep of page.dependencies.getByToEntityId(point.id)) {
                dependencySet.add(dep);
            }
        }

        const entityIds = new Set([
            ...blockIds,
            ...Array.from(pointSet).map((p) => p.id),
        ]);
        const dependencies = [...dependencySet].filter(
            (dep) => entityIds.has(dep.from) && entityIds.has(dep.to),
        );

        const data: ClipboardData = {
            blocks: blocksInOrder.map(serializeBlock),
            points: Array.from(pointSet).map(serializePoint),
            dependencies: dependencies.map(serializeDependency),
        };

        return navigator.clipboard.writeText(JSON.stringify(data));
    }

    async paste(): Promise<{
        blocks: Block[];
        points: PointEntity[];
        dependencies: Dependency[];
    }> {
        try {
            const json = await navigator.clipboard.readText();
            const data = JSON.parse(json) as ClipboardData;

            const blocks = data.blocks.map(deserializeBlock);
            const points = data.points.map(deserializePoint);
            const dependencies = data.dependencies.map(deserializeDependency);

            // Renew IDs
            const idMap = new Map<string, string>();
            for (const block of blocks) {
                const newId = randomId();
                idMap.set(block.id, newId);
                block.id = newId;
            }
            for (const point of points) {
                const newId = randomId();
                idMap.set(point.id, newId);
                point.id = newId;

                // Move points a little bit to avoid overlapping with copy sources
                point.x += 10;
                point.y += 10;
            }
            for (const dep of dependencies) {
                const newId = randomId();
                idMap.set(dep.id, newId);
                dep.id = newId;
                const newFrom = idMap.get(dep.from);
                const newTo = idMap.get(dep.to);

                assert(newFrom !== undefined, "newFrom is undefined");
                assert(newTo !== undefined, "newTo is undefined");
                dep.from = newFrom;
                dep.to = newTo;
            }

            return {
                blocks,
                points,
                dependencies,
            };
        } catch {
            return {
                blocks: [],
                points: [],
                dependencies: [],
            };
        }
    }
})();
