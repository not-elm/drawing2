import type { ComponentType } from "react";
import type { Entity } from "../../core/model/Entity";
import type { Viewport } from "../../core/model/Viewport";
import { assert } from "../../lib/assert";
import type { EntityViewHandle } from "./EntityViewHandle";

export class EntityViewHandleMap {
    private map = new Map<string, EntityViewHandle<Entity>>();

    register<E extends Entity>(view: EntityViewHandle<E>): this {
        this.map.set(
            view.getType(),
            view as unknown as EntityViewHandle<Entity>,
        );
        return this;
    }

    get<E extends Entity>(entity: E): EntityViewHandle<E> {
        const view = this.map.get(entity.type);
        assert(
            view !== undefined,
            `No view found for entity type ${entity.type}`,
        );

        return view as unknown as EntityViewHandle<E>;
    }

    getViewComponent<E extends Entity>(
        entity: E,
    ): ComponentType<{ entity: E }> {
        return this.get(entity).getViewComponent(entity);
    }

    getOutline<E extends Entity>(entity: E, viewport: Viewport): string {
        return this.get(entity).getOutline(entity, viewport);
    }

    onViewSizeChange<E extends Entity>(
        entity: E,
        width: number,
        height: number,
    ) {
        this.get(entity).onViewSizeChange(entity, width, height);
    }
}
