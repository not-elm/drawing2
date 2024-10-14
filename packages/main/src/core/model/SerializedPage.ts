import type { EntityHandleMap } from "../EntityHandleMap";
import type { SerializedDependency } from "./Dependency";
import { DependencyCollection } from "./DependencyCollection";
import type { Page } from "./Page";

export interface SerializedPage {
    entities: SerializedEntity[];
    dependencies: SerializedDependency[];
}
export function serializePage(
    page: Page,
    handle: EntityHandleMap,
): SerializedPage {
    return {
        entities: page.entityIds.map((entityId) =>
            handle.serialize(page.entities[entityId]),
        ),
        dependencies: page.dependencies.serialize(),
    };
}
export function deserializePage(
    page: SerializedPage,
    handle: EntityHandleMap,
): Page {
    const entities = page.entities.map((entity) => handle.deserialize(entity));

    const dependencies = DependencyCollection.deserialize(page.dependencies);
    return {
        entities: Object.fromEntries(
            entities.map((entity) => [entity.id, entity]),
        ),
        entityIds: entities.map((entity) => entity.id),
        dependencies,
    };
}

export interface SerializedEntity {
    type: string;
    [key: string]: unknown;
}
