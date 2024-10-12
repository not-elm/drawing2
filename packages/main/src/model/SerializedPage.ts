import type { ColorId } from "./Colors";
import type { SerializedDependency } from "./Dependency";
import { DependencyCollection } from "./DependencyCollection";
import type { FillMode } from "./FillMode";
import type { Block, Page, PathBlock, ShapeBlock, TextBlock } from "./Page";
import type { StrokeStyle } from "./StrokeStyle";
import type { TextAlignment } from "./TextAlignment";
import type { TextBlockSizingMode } from "./TextBlockSizingMode";

export interface SerializedPage {
    blocks: SerializedBlock[];
    dependencies: SerializedDependency[];
}
export function serializePage(page: Page): SerializedPage {
    return {
        blocks: page.blockIds.map((blockId) =>
            serializeBlock(page.blocks[blockId]),
        ),
        dependencies: page.dependencies.serialize(),
    };
}
export function deserializePage(page: SerializedPage): Page {
    const blocks = page.blocks.map(deserializeBlock);

    const dependencies = DependencyCollection.deserialize(page.dependencies);
    return {
        blocks: Object.fromEntries(blocks.map((block) => [block.id, block])),
        blockIds: blocks.map((block) => block.id),
        dependencies,
    };
}

export type SerializedBlock =
    | SerializedPathBlock
    | SerializedShapeBlock
    | SerializedTextBlock;
export function serializeBlock(block: Block): SerializedBlock {
    switch (block.type) {
        case "path":
            return serializePathBlock(block);
        case "shape":
            return serializeShapeBlock(block);
        case "text":
            return serializeTextBlock(block);
    }
}
export function deserializeBlock(block: SerializedBlock): Block {
    switch (block.type) {
        case "path":
            return deserializePathBlock(block);
        case "shape":
            return deserializeShapeBlock(block);
        case "text":
            return deserializeTextBlock(block);
    }
}

interface SerializedPathBlock {
    id: string;
    type: "path";
    x1: number;
    y1: number;
    endType1: LineEndType;
    x2: number;
    y2: number;
    endType2: LineEndType;
    colorId: ColorId;
    strokeStyle: StrokeStyle;
}
function serializePathBlock(path: PathBlock): SerializedPathBlock {
    return {
        id: path.id,
        type: "path",
        x1: path.x1,
        y1: path.y1,
        endType1: path.endType1,
        x2: path.x2,
        y2: path.y2,
        endType2: path.endType2,
        colorId: path.colorId,
        strokeStyle: path.strokeStyle,
    };
}
function deserializePathBlock(path: SerializedPathBlock): PathBlock {
    return {
        id: path.id,
        type: "path",
        x1: path.x1,
        y1: path.y1,
        endType1: path.endType1,
        x2: path.x2,
        y2: path.y2,
        endType2: path.endType2,
        colorId: path.colorId,
        strokeStyle: path.strokeStyle,
    };
}

interface SerializedShapeBlock {
    id: string;
    type: "shape";
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    textAlignX: TextAlignment;
    textAlignY: TextAlignment;
    colorId: ColorId;
    fillMode: FillMode;
    strokeStyle: StrokeStyle;
    path: number[][];
}
function serializeShapeBlock(shape: ShapeBlock): SerializedShapeBlock {
    return {
        id: shape.id,
        type: "shape",
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        label: shape.label,
        textAlignX: shape.textAlignX,
        textAlignY: shape.textAlignY,
        colorId: shape.colorId,
        fillMode: shape.fillMode,
        strokeStyle: shape.strokeStyle,
        path: shape.path,
    };
}
function deserializeShapeBlock(shape: SerializedShapeBlock): ShapeBlock {
    return {
        id: shape.id,
        type: "shape",
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        label: shape.label,
        textAlignX: shape.textAlignX,
        textAlignY: shape.textAlignY,
        colorId: shape.colorId,
        fillMode: shape.fillMode,
        strokeStyle: shape.strokeStyle,
        path: shape.path,
    };
}

interface SerializedTextBlock {
    id: string;
    type: "text";
    x: number;
    y: number;
    width: number;
    height: number;
    sizingMode: TextBlockSizingMode;
    textAlignment: TextAlignment;
    content: string;
}
function serializeTextBlock(text: TextBlock): SerializedTextBlock {
    return {
        id: text.id,
        type: "text",
        x: text.x,
        y: text.y,
        width: text.width,
        height: text.height,
        sizingMode: text.sizingMode,
        textAlignment: text.textAlignment,
        content: text.content,
    };
}
function deserializeTextBlock(text: SerializedTextBlock): TextBlock {
    return {
        id: text.id,
        type: "text",
        x: text.x,
        y: text.y,
        width: text.width,
        height: text.height,
        sizingMode: text.sizingMode,
        textAlignment: text.textAlignment,
        content: text.content,
    };
}
