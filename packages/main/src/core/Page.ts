import type { DependencyCollection } from "./DependencyCollection";
import type { Entity } from "./Entity";
import type { Viewport } from "./Viewport";

export interface Page {
    entities: Record<string, Entity>;
    entityIds: string[];
    dependencies: DependencyCollection;
}

export function getEntitiesInViewport(
    page: Page,
    viewport: Viewport,
): Entity[] {
    return page.entityIds
        .map((entityId) => page.entities[entityId])
        .filter((entity) => entity.isOverlapWith(viewport.rect));
}
