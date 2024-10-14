import type { ColorId } from "../../core/model/Colors";
import type { Entity, EntityBase } from "../../core/model/Entity";
import type { TextAlignment } from "../../core/model/TextAlignment";
import type { TextEntitySizingMode } from "../../core/model/TextEntitySizingMode";
import { PROPERTY_KEY_COLOR_ID } from "../../core/view/PropertySection/ColorPropertySection/ColorPropertySection";
import { PROPERTY_KEY_TEXT_ALIGNMENT_X } from "../../core/view/PropertySection/TextAlignmentPropertySection/TextAlignmentPropertySection";
import type { Rect } from "../../lib/geo/Rect";

export interface TextEntity extends EntityBase<"text"> {
    // If sizingMode=auto, width and height will be automatically set by application
    rect: Rect;
    sizingMode: TextEntitySizingMode;
    [PROPERTY_KEY_TEXT_ALIGNMENT_X]: TextAlignment;
    [PROPERTY_KEY_COLOR_ID]: ColorId;
    content: string;
}

export function isTextEntity(entity: Entity): entity is TextEntity {
    return entity.type === "text";
}
