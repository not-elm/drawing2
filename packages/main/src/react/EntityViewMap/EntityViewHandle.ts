import type { ComponentType } from "react";
import type { Entity } from "../../core/model/Entity";

export abstract class EntityViewHandle<E extends Entity> {
    abstract getType(): string;

    abstract getViewComponent(entity: E): ComponentType<{ entity: E }>;
}
