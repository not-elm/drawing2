import type { SerializedDependency } from "./Dependency";
import { DependencyCollection } from "./DependencyCollection";
import type { EntityConverter, SerializedEntity } from "./EntityDeserializer";
import type { Page } from "./Page";

export interface SerializedPage {
    entities: SerializedEntity[];
    dependencies: SerializedDependency[];
}
export function serializePage(page: Page): SerializedPage {
    return {
        entities: page.entityIds.map((entityId) =>
            page.entities[entityId].serialize(),
        ),
        dependencies: page.dependencies.serialize(),
    };
}
export function deserializePage(
    page: SerializedPage,
    entityConverter: EntityConverter,
): Page {
    const entities = page.entities.map((data) =>
        entityConverter.deserialize(data),
    );

    const dependencies = DependencyCollection.deserialize(page.dependencies);
    return {
        entities: Object.fromEntries(
            entities.map((entity) => [entity.props.id, entity]),
        ),
        entityIds: entities.map((entity) => entity.props.id),
        dependencies,
    };
}
