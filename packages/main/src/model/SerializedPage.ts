import type { ColorId } from "./Colors";
import type { SerializedDependency } from "./Dependency";
import { DependencyCollection } from "./DependencyCollection";
import type { FillMode } from "./FillMode";
import type { Block, LineBlock, Page, PointEntity, ShapeBlock } from "./Page";
import type { TextAlignment } from "./TextAlignment";

export interface SerializedPage {
    blocks: SerializedBlock[];
    points: SerializedPointEntity[];
    dependencies: SerializedDependency[];
}
export function serializePage(page: Page): SerializedPage {
    return {
        blocks: page.blockIds.map((blockId) =>
            serializeBlock(page.blocks[blockId]),
        ),
        points: Object.values(page.points).map(serializePoint),
        dependencies: page.dependencies.serialize(),
    };
}
export function deserializePage(page: SerializedPage): Page {
    const blocks = page.blocks.map(deserializeBlock);
    const points = Object.fromEntries(
        page.points.map((point) => [point.id, deserializePoint(point)]),
    );
    const dependencies = DependencyCollection.deserialize(page.dependencies);
    return {
        blocks: Object.fromEntries(blocks.map((block) => [block.id, block])),
        blockIds: blocks.map((block) => block.id),
        points,
        dependencies,
    };
}

export type SerializedBlock = SerializedLineBlock | SerializedShapeBlock;
export function serializeBlock(block: Block): SerializedBlock {
    switch (block.type) {
        case "line":
            return serializeLineBlock(block);
        case "shape":
            return serializeShapeBlock(block);
    }
}
export function deserializeBlock(block: SerializedBlock): Block {
    switch (block.type) {
        case "line":
            return deserializeLineBlock(block);
        case "shape":
            return deserializeShapeBlock(block);
    }
}

interface SerializedLineBlock {
    id: string;
    type: "line";
    x1: number;
    y1: number;
    endType1: LineEndType;
    x2: number;
    y2: number;
    endType2: LineEndType;
    colorId: ColorId;
}
function serializeLineBlock(line: LineBlock): SerializedLineBlock {
    return {
        id: line.id,
        type: "line",
        x1: line.x1,
        y1: line.y1,
        endType1: line.endType1,
        x2: line.x2,
        y2: line.y2,
        endType2: line.endType2,
        colorId: line.colorId,
    };
}
function deserializeLineBlock(line: SerializedLineBlock): LineBlock {
    return {
        id: line.id,
        type: "line",
        x1: line.x1,
        y1: line.y1,
        endType1: line.endType1,
        x2: line.x2,
        y2: line.y2,
        endType2: line.endType2,
        colorId: line.colorId,
    };
}

interface SerializedShapeBlock {
    id: string;
    type: "shape";
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
function serializeShapeBlock(shape: ShapeBlock): SerializedShapeBlock {
    return {
        id: shape.id,
        type: "shape",
        x: shape.x,
        y: shape.y,
        x1: shape.x1,
        y1: shape.y1,
        x2: shape.x2,
        y2: shape.y2,
        width: shape.width,
        height: shape.height,
        label: shape.label,
        textAlignX: shape.textAlignX,
        textAlignY: shape.textAlignY,
        colorId: shape.colorId,
        fillMode: shape.fillMode,
        path: shape.path,
    };
}
function deserializeShapeBlock(shape: SerializedShapeBlock): ShapeBlock {
    return {
        id: shape.id,
        type: "shape",
        x: shape.x,
        y: shape.y,
        x1: shape.x1,
        y1: shape.y1,
        x2: shape.x2,
        y2: shape.y2,
        width: shape.width,
        height: shape.height,
        label: shape.label,
        textAlignX: shape.textAlignX,
        textAlignY: shape.textAlignY,
        colorId: shape.colorId,
        fillMode: shape.fillMode,
        path: shape.path,
    };
}

export interface SerializedPointEntity {
    id: string;
    x: number;
    y: number;
}
export function serializePoint(point: PointEntity): SerializedPointEntity {
    return {
        id: point.id,
        x: point.x,
        y: point.y,
    };
}
export function deserializePoint(point: SerializedPointEntity): PointEntity {
    return {
        type: "point",
        id: point.id,
        x: point.x,
        y: point.y,
    };
}
