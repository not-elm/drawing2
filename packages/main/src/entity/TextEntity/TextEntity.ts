import type { Entity, EntityBase } from "../../core/model/Entity";
import type { TextAlignment } from "../../core/model/TextAlignment";
import type { TextEntitySizingMode } from "../../core/model/TextEntitySizingMode";
import type { Rect } from "../../lib/geo/Rect";

export interface TextEntity extends EntityBase<"text"> {
    // If sizingMode=auto, width and height will be automatically set by application
    rect: Rect;
    sizingMode: TextEntitySizingMode;
    textAlignment: TextAlignment;
    content: string;
}

export function isTextEntity(entity: Entity): entity is TextEntity {
    return entity.type === "text";
}
