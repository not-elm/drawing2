import type { ColorId } from "./Colors";
import type { DependencyCollection } from "./DependencyCollection";
import type { FillMode } from "./FillMode";
import type { TextAlignment } from "./TextAlignment";
import type { TextBlockSizingMode } from "./TextBlockSizingMode";

interface EntityBase<T extends string> {
    type: T;
    id: string;
}
export interface PointEntity extends EntityBase<"point"> {
    x: number;
    y: number;
}
export interface LineBlock extends EntityBase<"line"> {
    x1: number;
    y1: number;
    endType1: LineEndType;
    x2: number;
    y2: number;
    endType2: LineEndType;
    colorId: ColorId;
}
export interface ShapeBlock extends EntityBase<"shape"> {
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
export interface TextBlock extends EntityBase<"text"> {
    x: number;
    y: number;
    // If sizingMode=auto, width and height will be automatically set by application
    width: number;

    // Cannot be configured, automatically set by application based on the content
    height: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;

    sizingMode: TextBlockSizingMode;
    textAlignX: TextAlignment;

    // TODO: リッチテキストフォーマット対応
    content: string;
}

export type Block = LineBlock | ShapeBlock | TextBlock;

export type Entity = Block | PointEntity;

export interface Page {
    blocks: Record<string, Block>;
    points: Record<string, PointEntity>;
    blockIds: string[];
    dependencies: DependencyCollection;
}

export const PointKey = {
    LINE_P1: "lineP2",
    LINE_P2: "lineP1",
    SHAPE_P1: "shapeP1",
    SHAPE_P2: "shapeP2",
    TEXT_P1: "textP1",
    TEXT_P2: "textP2",
};
