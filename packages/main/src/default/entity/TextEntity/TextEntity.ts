import type { ColorId } from "../../../core/model/Colors";
import type { Entity, EntityBase } from "../../../core/model/Entity";
import { PropertyKey } from "../../../core/model/PropertyKey";
import type { TextAlignment } from "../../../core/model/TextAlignment";
import type { TextEntitySizingMode } from "../../../core/model/TextEntitySizingMode";
import type { Rect } from "../../../lib/geo/Rect";

export interface TextEntity extends EntityBase<"text"> {
    // If sizingMode=auto, width and height will be automatically set by application
    rect: Rect;
    sizingMode: TextEntitySizingMode;
    [PropertyKey.TEXT_ALIGNMENT_X]: TextAlignment;
    [PropertyKey.COLOR_ID]: ColorId;
    content: string;
}

export function isTextEntity(entity: Entity): entity is TextEntity {
    return entity.type === "text";
}
