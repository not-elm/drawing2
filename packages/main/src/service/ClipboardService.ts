import { assert } from "../lib/assert";
import { randomId } from "../lib/randomId";
import {
    type Dependency,
    type SerializedDependency,
    deserializeDependency,
    serializeDependency,
} from "../model/Dependency";
import type { Entity, Page } from "../model/Page";
import {
    type SerializedEntity,
    deserializeEntity,
    serializeEntity,
} from "../model/SerializedPage";

interface ClipboardData {
    entities: SerializedEntity[];
    dependencies: SerializedDependency[];
}

export const ClipboardService = new (class {
    copy(page: Page, entityIds: string[]): Promise<void> {
        const entityIdSet = new Set(entityIds);
        const entitiesInOrder: Entity[] = [];
        const dependencySet = new Set<Dependency>();

        for (const entityId of page.entityIds) {
            if (!entityIdSet.has(entityId)) continue;

            entitiesInOrder.push(page.entities[entityId]);
            for (const dep of page.dependencies.getByToEntityId(entityId)) {
                dependencySet.add(dep);
            }
        }

        const dependencies = [...dependencySet].filter(
            (dep) => entityIdSet.has(dep.from) && entityIdSet.has(dep.to),
        );

        const data: ClipboardData = {
            entities: entitiesInOrder.map(serializeEntity),
            dependencies: dependencies.map(serializeDependency),
        };

        return navigator.clipboard.writeText(JSON.stringify(data));
    }

    async paste(): Promise<{
        entities: Entity[];
        dependencies: Dependency[];
    }> {
        try {
            const json = await navigator.clipboard.readText();
            const data = JSON.parse(json) as ClipboardData;

            const entities = data.entities.map(deserializeEntity);
            const dependencies = data.dependencies.map(deserializeDependency);

            const idMap = new Map<string, string>();
            for (const entity of entities) {
                // Renew IDs
                const newId = randomId();
                idMap.set(entity.id, newId);
                entity.id = newId;

                // Move entities a little bit to avoid overlapping with copy sources
                switch (entity.type) {
                    case "path": {
                        for (const node of Object.values(entity.nodes)) {
                            entity.nodes[node.id].x += 10;
                            entity.nodes[node.id].y += 10;
                        }
                        break;
                    }
                    case "shape":
                        entity.x += 10;
                        entity.y += 10;
                        break;
                    case "text":
                        entity.x += 10;
                        entity.y += 10;
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
                entities: entities,
                dependencies,
            };
        } catch {
            return {
                entities: [],
                dependencies: [],
            };
        }
    }
})();
