import { entityHandleMap } from "../../instance";
import type { Rect } from "../../lib/geo/Rect";

export interface EntityBase<T extends string> {
    type: T;
    id: string;
}

export type Entity = EntityBase<string>;

export function getBoundingRect(entity: Entity): Rect {
    return entityHandleMap().getBoundingRect(entity);
}
