import type { Rect } from "../geo/Rect";
import { type PathEntity, getBoundingRectOfPath } from "./PathEntity";
import type { ShapeEntity } from "./ShapeEntity";
import type { TextEntity } from "./TextEntity";

export interface EntityBase<T extends string> {
    type: T;
    id: string;
}

export type Entity = PathEntity | ShapeEntity | TextEntity;

export function getBoundingRect(entity: Entity): Rect {
    switch (entity.type) {
        case "shape":
        case "text":
            return entity.rect;
        case "path":
            return getBoundingRectOfPath(entity);
    }
}
