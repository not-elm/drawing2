import type { Line } from "../geo/Line";
import {
    type Rect,
    isRectOverlapWithLine,
    isRectOverlapWithRect,
} from "../geo/Rect";
import { assert } from "../lib/assert";
import type { ColorId } from "./Colors";
import type { DependencyCollection } from "./DependencyCollection";
import type { FillMode } from "./FillMode";
import type { StrokeStyle } from "./StrokeStyle";
import type { TextAlignment } from "./TextAlignment";
import type { TextBlockSizingMode } from "./TextBlockSizingMode";
import type { Viewport } from "./Viewport";

interface EntityBase<T extends string> {
    type: T;
    id: string;
}

export interface PathNode {
    id: string;
    x: number;
    y: number;
    endType: LineEndType;
}

export interface PathBlock extends EntityBase<"path"> {
    nodes: Record<string, PathNode>;
    edges: [string, string][];
    colorId: ColorId;
    strokeStyle: StrokeStyle;
}

export interface ShapeBlock extends EntityBase<"shape"> {
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

export interface TextBlock extends EntityBase<"text"> {
    x: number;
    y: number;
    // If sizingMode=auto, width and height will be automatically set by application
    width: number;

    // Cannot be configured, automatically set by application based on the content
    height: number;

    sizingMode: TextBlockSizingMode;
    textAlignment: TextAlignment;

    // TODO: リッチテキストフォーマット対応
    content: string;
}

export type Block = PathBlock | ShapeBlock | TextBlock;

export type Entity = Block;

export interface Page {
    blocks: Record<string, Block>;
    blockIds: string[];
    dependencies: DependencyCollection;
}

export function getEdgesFromPath(path: PathBlock): Line[] {
    return path.edges.map(([startNodeId, endNodeId]) => {
        const startNode = path.nodes[startNodeId];
        assert(
            startNode !== undefined,
            `node ${startNodeId} is not found in path ${path.id}`,
        );
        const endNode = path.nodes[endNodeId];
        assert(
            endNode !== undefined,
            `node ${endNodeId} is not found in path ${path.id}`,
        );

        return {
            x1: startNode.x,
            y1: startNode.y,
            x2: endNode.x,
            y2: endNode.y,
        };
    });
}

export function getBoundingRectOfPath(path: PathBlock): Rect {
    const xs = Object.values(path.nodes).map((node) => node.x);
    const ys = Object.values(path.nodes).map((node) => node.y);

    return {
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
    };
}

export function getBlocksInViewport(page: Page, viewport: Viewport): Block[] {
    return page.blockIds
        .map((blockId) => page.blocks[blockId])
        .filter((block) => {
            switch (block.type) {
                case "shape":
                case "text":
                    return isRectOverlapWithRect(viewport, block);
                case "path":
                    return getEdgesFromPath(block).some((line) =>
                        isRectOverlapWithLine(viewport, line),
                    );
            }
        });
}

export function getBoundingRect(block: Block): Rect {
    switch (block.type) {
        case "shape":
        case "text":
            return block;
        case "path":
            return getBoundingRectOfPath(block);
    }
}
