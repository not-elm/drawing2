import { entityHandleMap } from "../../instance";
import type { SerializedDependency } from "./Dependency";
import { DependencyCollection } from "./DependencyCollection";
import type { Page } from "./Page";

export interface SerializedPage {
    entities: SerializedEntity[];
    dependencies: SerializedDependency[];
}
export function serializePage(page: Page): SerializedPage {
    return {
        entities: page.entityIds.map((entityId) =>
            entityHandleMap().serialize(page.entities[entityId]),
        ),
        dependencies: page.dependencies.serialize(),
    };
}
export function deserializePage(page: SerializedPage): Page {
    const entities = page.entities.map((entity) =>
        entityHandleMap().deserialize(entity),
    );

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
