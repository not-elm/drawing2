import type { ColorId } from "../../core/model/Colors";
import type { Entity, EntityBase } from "../../core/model/Entity";
import type { StrokeStyle } from "../../core/model/StrokeStyle";
import { assert } from "../../lib/assert";
import { Line } from "../../lib/geo/Line";
import type { Point } from "../../lib/geo/Point";
import { Rect } from "../../lib/geo/Rect";

export interface PathNode {
    id: string;
    point: Point;
    endType: LineEndType;
}

export type PathEdge = [PathNode, PathNode];

export interface PathEntity extends EntityBase<"path"> {
    nodes: Record<string, PathNode>;
    edges: [string, string][];
    colorId: ColorId;
    strokeStyle: StrokeStyle;
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

        return new Line({
            p1: startNode.point,
            p2: endNode.point,
        });
    });
}

export function getBoundingRectOfPath(path: PathEntity): Rect {
    const xs = Object.values(path.nodes).map((node) => node.point.x);
    const ys = Object.values(path.nodes).map((node) => node.point.y);

    const x = Math.min(...xs);
    const y = Math.min(...ys);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);

    return Rect.of(x, y, width, height);
}

export function isPathEntity(entity: Entity): entity is PathEntity {
    return entity.type === "path";
}
