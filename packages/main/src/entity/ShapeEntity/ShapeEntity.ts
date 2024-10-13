import type { ColorId } from "../../core/model/Colors";
import type { Entity, EntityBase } from "../../core/model/Entity";
import type { FillMode } from "../../core/model/FillMode";
import type { StrokeStyle } from "../../core/model/StrokeStyle";
import type { TextAlignment } from "../../core/model/TextAlignment";
import type { Rect } from "../../lib/geo/Rect";

export interface ShapeEntity extends EntityBase<"shape"> {
    rect: Rect;
    label: string;
    textAlignX: TextAlignment;
    textAlignY: TextAlignment;
    colorId: ColorId;
    fillMode: FillMode;
    strokeStyle: StrokeStyle;
    path: number[][];
}

export function isShapeEntity(entity: Entity): entity is ShapeEntity {
    return entity.type === "shape";
}
