import { Point } from "../geo/Point";
import { Rect } from "../geo/Rect";
import type { ColorId } from "./Colors";
import type { SerializedDependency } from "./Dependency";
import { DependencyCollection } from "./DependencyCollection";
import type { Entity } from "./Entity";
import type { FillMode } from "./FillMode";
import type { Page } from "./Page";
import type { PathEntity } from "./PathEntity";
import type { ShapeEntity } from "./ShapeEntity";
import type { StrokeStyle } from "./StrokeStyle";
import type { TextAlignment } from "./TextAlignment";
import type { TextEntity } from "./TextEntity";
import type { TextEntitySizingMode } from "./TextEntitySizingMode";

export interface SerializedPage {
    entities: SerializedEntity[];
    dependencies: SerializedDependency[];
}
export function serializePage(page: Page): SerializedPage {
    return {
        entities: page.entityIds.map((entityId) =>
            serializeEntity(page.entities[entityId]),
        ),
        dependencies: page.dependencies.serialize(),
    };
}
export function deserializePage(page: SerializedPage): Page {
    const entities = page.entities.map(deserializeEntity);

    const dependencies = DependencyCollection.deserialize(page.dependencies);
    return {
        entities: Object.fromEntries(
            entities.map((entity) => [entity.id, entity]),
        ),
        entityIds: entities.map((entity) => entity.id),
        dependencies,
    };
}

export type SerializedEntity =
    | SerializedPathEntity
    | SerializedShapeEntity
    | SerializedTextEntity;
export function serializeEntity(entity: Entity): SerializedEntity {
    switch (entity.type) {
        case "path":
            return serializePathEntity(entity);
        case "shape":
            return serializeShapeEntity(entity);
        case "text":
            return serializeTextEntity(entity);
    }
}
export function deserializeEntity(entity: SerializedEntity): Entity {
    switch (entity.type) {
        case "path":
            return deserializePathEntity(entity);
        case "shape":
            return deserializeShapeEntity(entity);
        case "text":
            return deserializeTextEntity(entity);
    }
}

interface SerializedPathEntity {
    id: string;
    type: "path";
    nodes: {
        id: string;
        x: number;
        y: number;
        endType: LineEndType;
    }[];
    edges: [string, string][];
    colorId: ColorId;
    strokeStyle: StrokeStyle;
}
function serializePathEntity(path: PathEntity): SerializedPathEntity {
    return {
        id: path.id,
        type: "path",
        nodes: Object.entries(path.nodes).map(([id, node]) => ({
            id,
            x: node.point.x,
            y: node.point.y,
            endType: node.endType,
        })),
        edges: path.edges,
        colorId: path.colorId,
        strokeStyle: path.strokeStyle,
    };
}
function deserializePathEntity(path: SerializedPathEntity): PathEntity {
    return {
        id: path.id,
        type: "path",
        nodes: Object.fromEntries(
            path.nodes.map((node) => [
                node.id,
                {
                    id: node.id,
                    point: new Point(node.x, node.y),
                    endType: node.endType,
                },
            ]),
        ),
        edges: path.edges,
        colorId: path.colorId,
        strokeStyle: path.strokeStyle,
    };
}

interface SerializedShapeEntity {
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
function serializeShapeEntity(shape: ShapeEntity): SerializedShapeEntity {
    return {
        id: shape.id,
        type: "shape",
        x: shape.rect.left,
        y: shape.rect.top,
        width: shape.rect.width,
        height: shape.rect.height,
        label: shape.label,
        textAlignX: shape.textAlignX,
        textAlignY: shape.textAlignY,
        colorId: shape.colorId,
        fillMode: shape.fillMode,
        strokeStyle: shape.strokeStyle,
        path: shape.path,
    };
}
function deserializeShapeEntity(shape: SerializedShapeEntity): ShapeEntity {
    return {
        id: shape.id,
        type: "shape",
        rect: Rect.of(shape.x, shape.y, shape.width, shape.height),
        label: shape.label,
        textAlignX: shape.textAlignX,
        textAlignY: shape.textAlignY,
        colorId: shape.colorId,
        fillMode: shape.fillMode,
        strokeStyle: shape.strokeStyle,
        path: shape.path,
    };
}

interface SerializedTextEntity {
    id: string;
    type: "text";
    x: number;
    y: number;
    width: number;
    height: number;
    sizingMode: TextEntitySizingMode;
    textAlignment: TextAlignment;
    content: string;
}
function serializeTextEntity(text: TextEntity): SerializedTextEntity {
    return {
        id: text.id,
        type: "text",
        x: text.rect.left,
        y: text.rect.top,
        width: text.rect.width,
        height: text.rect.height,
        sizingMode: text.sizingMode,
        textAlignment: text.textAlignment,
        content: text.content,
    };
}
function deserializeTextEntity(text: SerializedTextEntity): TextEntity {
    return {
        id: text.id,
        type: "text",
        rect: Rect.of(text.x, text.y, text.width, text.height),
        sizingMode: text.sizingMode,
        textAlignment: text.textAlignment,
        content: text.content,
    };
}
