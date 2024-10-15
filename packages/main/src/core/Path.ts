import type { Point } from "../lib/geo/Point";

export interface PathNode {
    id: string;
    point: Point;
}

export type PathEdge = [PathNode, PathNode];
