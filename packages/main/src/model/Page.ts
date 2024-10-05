import type { ColorId } from "./Colors";
import type { DependencyCollection } from "./DependencyCollection";
import type { FillMode } from "./FillMode";
import type { TextAlignment } from "./TextAlignment";

interface ObjectBase<T extends string> {
    type: T;
    id: string;
}
export interface PointObject extends ObjectBase<"point"> {
    x: number;
    y: number;
}
export interface LineObject extends ObjectBase<"line"> {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    colorId: ColorId;
}
export interface ShapeObject extends ObjectBase<"shape"> {
    x: number;
    y: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
    label: string;
    textAlignX: TextAlignment;
    textAlignY: TextAlignment;
    colorId: ColorId;
    fillMode: FillMode;
    path: number[][];
}

export type Obj = PointObject | LineObject | ShapeObject;

export interface Page {
    objects: Record<string, Obj>;
    objectIds: string[];
    dependencies: DependencyCollection;
}

export const PointKey = {
    LINE_P1: "lineP2",
    LINE_P2: "lineP1",
    SHAPE_P1: "shapeP1",
    SHAPE_P2: "shapeP2",
};
