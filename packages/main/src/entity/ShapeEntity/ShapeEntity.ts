import type { ColorId } from "../../core/model/Colors";
import type { Entity, EntityBase } from "../../core/model/Entity";
import type { FillMode } from "../../core/model/FillMode";
import type { StrokeStyle } from "../../core/model/StrokeStyle";
import type { TextAlignment } from "../../core/model/TextAlignment";
import { PROPERTY_KEY_COLOR_ID } from "../../core/view/PropertySection/ColorPropertySection/ColorPropertySection";
import { PROPERTY_KEY_FILL_MODE } from "../../core/view/PropertySection/FillModePropertySection/FillModePropertySection";
import { PROPERTY_KEY_STROKE_STYLE } from "../../core/view/PropertySection/StrokeStylePropertySection/StrokeStylePropertySection";
import {
    PROPERTY_KEY_TEXT_ALIGNMENT_X,
    PROPERTY_KEY_TEXT_ALIGNMENT_Y,
} from "../../core/view/PropertySection/TextAlignmentPropertySection/TextAlignmentPropertySection";
import type { Rect } from "../../lib/geo/Rect";

export interface ShapeEntity extends EntityBase<"shape"> {
    rect: Rect;
    content: string;
    [PROPERTY_KEY_TEXT_ALIGNMENT_X]: TextAlignment;
    [PROPERTY_KEY_TEXT_ALIGNMENT_Y]: TextAlignment;
    [PROPERTY_KEY_COLOR_ID]: ColorId;
    [PROPERTY_KEY_FILL_MODE]: FillMode;
    [PROPERTY_KEY_STROKE_STYLE]: StrokeStyle;
    path: number[][];
}

export function isShapeEntity(entity: Entity): entity is ShapeEntity {
    return entity.type === "shape";
}
