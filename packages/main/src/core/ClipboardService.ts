import { assert } from "../lib/assert";
import { Transform } from "../lib/geo/Transform";
import { randomId } from "../lib/randomId";
import {
    type Dependency,
    type SerializedDependency,
    deserializeDependency,
    serializeDependency,
} from "./Dependency";
import type { Entity } from "./Entity";
import type { EntityConverter, SerializedEntity } from "./EntityDeserializer";
import type { Page } from "./Page";

interface ClipboardData {
    entities: SerializedEntity[];
    dependencies: SerializedDependency[];
}

export class ClipboardService {
    constructor(private readonly entityConverter: EntityConverter) {}

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
            entities: entitiesInOrder.map((entity) => entity.serialize()),
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
                .map((data) => this.entityConverter.deserialize(data))
                .map((entity) => {
                    // Renew IDs
                    const newId = randomId();
                    idMap.set(entity.props.id, newId);
                    entity.props.id = newId;

                    // Move entities a little bit to avoid overlapping with copy sources
                    return entity.transform(Transform.translate(10, 10));
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
