import { Line } from "../geo/Line";
import type { Point } from "../geo/Point";
import { Rect } from "../geo/Rect";
import { assert } from "../lib/assert";
import type { ColorId } from "./Colors";
import type { EntityBase } from "./Entity";
import type { StrokeStyle } from "./StrokeStyle";

export interface PathNode {
    id: string;
    point: Point;
    endType: LineEndType;
}

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
