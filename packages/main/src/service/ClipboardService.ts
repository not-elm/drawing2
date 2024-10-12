import { assert } from "../lib/assert";
import { randomId } from "../lib/randomId";
import {
    type Dependency,
    type SerializedDependency,
    deserializeDependency,
    serializeDependency,
} from "../model/Dependency";
import type { Block, Page } from "../model/Page";
import {
    type SerializedBlock,
    deserializeBlock,
    serializeBlock,
} from "../model/SerializedPage";

interface ClipboardData {
    blocks: SerializedBlock[];
    dependencies: SerializedDependency[];
}

export const ClipboardService = new (class {
    copy(page: Page, blockIds: string[]): Promise<void> {
        const blockIdSet = new Set(blockIds);
        const blocksInOrder: Block[] = [];
        const dependencySet = new Set<Dependency>();

        for (const blockId of page.blockIds) {
            if (!blockIdSet.has(blockId)) continue;

            blocksInOrder.push(page.blocks[blockId]);
            for (const dep of page.dependencies.getByToEntityId(blockId)) {
                dependencySet.add(dep);
            }
        }

        const entityIds = new Set([...blockIds]);
        const dependencies = [...dependencySet].filter(
            (dep) => entityIds.has(dep.from) && entityIds.has(dep.to),
        );

        const data: ClipboardData = {
            blocks: blocksInOrder.map(serializeBlock),
            dependencies: dependencies.map(serializeDependency),
        };

        return navigator.clipboard.writeText(JSON.stringify(data));
    }

    async paste(): Promise<{
        blocks: Block[];
        dependencies: Dependency[];
    }> {
        try {
            const json = await navigator.clipboard.readText();
            const data = JSON.parse(json) as ClipboardData;

            const blocks = data.blocks.map(deserializeBlock);
            const dependencies = data.dependencies.map(deserializeDependency);

            const idMap = new Map<string, string>();
            for (const block of blocks) {
                // Renew IDs
                const newId = randomId();
                idMap.set(block.id, newId);
                block.id = newId;

                // Move blocks a little bit to avoid overlapping with copy sources
                switch (block.type) {
                    case "path": {
                        for (const node of Object.values(block.nodes)) {
                            block.nodes[node.id].x += 10;
                            block.nodes[node.id].y += 10;
                        }
                        break;
                    }
                    case "shape":
                        block.x += 10;
                        block.y += 10;
                        break;
                    case "text":
                        block.x += 10;
                        block.y += 10;
                        break;
                }
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
                dependencies,
            };
        } catch {
            return {
                blocks: [],
                dependencies: [],
            };
        }
    }
})();
