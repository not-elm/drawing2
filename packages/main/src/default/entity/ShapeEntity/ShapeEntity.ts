import type { ColorId } from "../../../core/model/Colors";
import type { Entity, EntityBase } from "../../../core/model/Entity";
import type { FillStyle } from "../../../core/model/FillStyle";
import { PropertyKey } from "../../../core/model/PropertyKey";
import type { StrokeStyle } from "../../../core/model/StrokeStyle";
import type { TextAlignment } from "../../../core/model/TextAlignment";
import type { Rect } from "../../../lib/geo/Rect";

export interface ShapeEntity extends EntityBase<"shape"> {
    rect: Rect;
    content: string;
    [PropertyKey.TEXT_ALIGNMENT_X]: TextAlignment;
    [PropertyKey.TEXT_ALIGNMENT_Y]: TextAlignment;
    [PropertyKey.COLOR_ID]: ColorId;
    [PropertyKey.FILL_STYLE]: FillStyle;
    [PropertyKey.STROKE_STYLE]: StrokeStyle;
    path: number[][];
}

export function isShapeEntity(entity: Entity): entity is ShapeEntity {
    return entity.type === "shape";
}
