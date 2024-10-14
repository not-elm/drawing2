import { assert } from "../lib/assert";
import { Transform } from "../lib/geo/Transform";
import { randomId } from "../lib/randomId";
import type { EntityHandleMap } from "./EntityHandleMap";
import {
    type Dependency,
    type SerializedDependency,
    deserializeDependency,
    serializeDependency,
} from "./model/Dependency";
import type { Entity } from "./model/Entity";
import type { Page } from "./model/Page";
import type { SerializedEntity } from "./model/SerializedPage";

interface ClipboardData {
    entities: SerializedEntity[];
    dependencies: SerializedDependency[];
}

export class ClipboardService {
    constructor(private readonly handle: EntityHandleMap) {}

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
            entities: entitiesInOrder.map((entity) =>
                this.handle.serialize(entity),
            ),
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

            const idMap = new Map<string, string>();

            const entities = data.entities
                .map((entity) => this.handle.deserialize(entity))
                .map((entity) => {
                    // Renew IDs
                    const newId = randomId();
                    idMap.set(entity.id, newId);
                    entity.id = newId;

                    // Move entities a little bit to avoid overlapping with copy sources
                    return this.handle.transform(
                        entity,
                        Transform.translate(10, 10),
                    );
                });

            const dependencies = data.dependencies.map(deserializeDependency);
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
                entities,
                dependencies,
            };
        } catch {
            return {
                entities: [],
                dependencies: [],
            };
        }
    }
}
