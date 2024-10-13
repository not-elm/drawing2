import type { DependencyCollection } from "./DependencyCollection";
import type { Entity } from "./Entity";
import { getEdgesFromPath } from "./PathEntity";
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
        .filter((entity) => {
            switch (entity.type) {
                case "shape":
                case "text":
                    return viewport.rect.isOverlappedWith(entity.rect);
                case "path":
                    return getEdgesFromPath(entity).some((line) =>
                        viewport.rect.isOverlappedWith(line),
                    );
            }
        });
}
