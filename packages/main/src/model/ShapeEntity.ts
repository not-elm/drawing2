import type { Rect } from "../geo/Rect";
import type { ColorId } from "./Colors";
import type { EntityBase } from "./Entity";
import type { FillMode } from "./FillMode";
import type { StrokeStyle } from "./StrokeStyle";
import type { TextAlignment } from "./TextAlignment";

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
