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
import type { TextEntitySizingMode } from "./TextEntitySizingMode";
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

export interface PathEntity extends EntityBase<"path"> {
    nodes: Record<string, PathNode>;
    edges: [string, string][];
    colorId: ColorId;
    strokeStyle: StrokeStyle;
}

export interface ShapeEntity extends EntityBase<"shape"> {
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

export interface TextEntity extends EntityBase<"text"> {
    x: number;
    y: number;
    // If sizingMode=auto, width and height will be automatically set by application
    width: number;

    // Cannot be configured, automatically set by application based on the content
    height: number;

    sizingMode: TextEntitySizingMode;
    textAlignment: TextAlignment;
    content: string;
}

export type Entity = PathEntity | ShapeEntity | TextEntity;

export interface Page {
    entities: Record<string, Entity>;
    entityIds: string[];
    dependencies: DependencyCollection;
}

export function getEdgesFromPath(path: PathEntity): Line[] {
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

export function getBoundingRectOfPath(path: PathEntity): Rect {
    const xs = Object.values(path.nodes).map((node) => node.x);
    const ys = Object.values(path.nodes).map((node) => node.y);

    return {
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
    };
}

export function getEntitiesInViewport(
    page: Page,
    viewport: Viewport,
): Entity[] {
    return page.entityIds
        .map((entityId) => page.entities[entityId])
        .filter((entity) => {
            switch (entity.type) {
                case "shape":
                case "text":
                    return isRectOverlapWithRect(viewport, entity);
                case "path":
                    return getEdgesFromPath(entity).some((line) =>
                        isRectOverlapWithLine(viewport, line),
                    );
            }
        });
}

export function getBoundingRect(entity: Entity): Rect {
    switch (entity.type) {
        case "shape":
        case "text":
            return entity;
        case "path":
            return getBoundingRectOfPath(entity);
    }
}
