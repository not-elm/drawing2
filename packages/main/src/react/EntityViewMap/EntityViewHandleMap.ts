import type { ComponentType } from "react";
import type { Entity } from "../../core/model/Entity";
import { assert } from "../../lib/assert";
import type { EntityViewHandle } from "./EntityViewHandle";

export class EntityViewHandleMap {
    private map = new Map<string, EntityViewHandle<Entity>>();

    register<E extends Entity>(handle: EntityViewHandle<E>): this {
        this.map.set(
            handle.getType(),
            handle as unknown as EntityViewHandle<Entity>,
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
}
