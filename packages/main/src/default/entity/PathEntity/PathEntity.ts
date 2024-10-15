import { Entity } from "../../../core/Entity";
import type { SerializedEntity } from "../../../core/EntityDeserializer";
import type { JSONObject } from "../../../core/JSONObject";
import type { PathEdge, PathNode } from "../../../core/Path";
import type { Viewport } from "../../../core/Viewport";
import { assert } from "../../../lib/assert";
import { Line } from "../../../lib/geo/Line";
import { Point } from "../../../lib/geo/Point";
import { Rect } from "../../../lib/geo/Rect";
import { Transform } from "../../../lib/geo/Transform";
import { type ColorId, PROPERTY_KEY_COLOR_ID } from "../../property/Colors";
import {
    PROPERTY_KEY_STROKE_STYLE,
    type StrokeStyle,
} from "../../property/StrokeStyle";

export class PathEntity extends Entity<{
    id: string;
    nodes: Record<string, PathNode>;
    edges: [string, string][];
    [PROPERTY_KEY_STROKE_STYLE]: StrokeStyle;
    [PROPERTY_KEY_COLOR_ID]: ColorId;
}> {
    readonly type = "path";

    getBoundingRect(): Rect {
        const xs = Object.values(this.props.nodes).map((node) => node.point.x);
        const ys = Object.values(this.props.nodes).map((node) => node.point.y);

        const x = Math.min(...xs);
        const y = Math.min(...ys);
        const width = Math.max(...xs) - Math.min(...xs);
        const height = Math.max(...ys) - Math.min(...ys);

        return Rect.of(x, y, width, height);
    }

    transform(transform: Transform) {
        const nodes: Record<string, PathNode> = {};
        for (const node of Object.values(this.props.nodes)) {
            nodes[node.id] = {
                ...node,
                point: transform.apply(node.point),
            };
        }

        return this.copy({ nodes });
    }

    getNodes(): PathNode[] {
        return Object.values(this.props.nodes);
    }

    getEdges(): PathEdge[] {
        return this.props.edges.map(([startId, endId]) => [
            this.props.nodes[startId],
            this.props.nodes[endId],
        ]);
    }

    getOutline(): (Rect | Line | Point)[] {
        return this.props.edges.map(([startNodeId, endNodeId]) => {
            const startNode = this.props.nodes[startNodeId];
            assert(
                startNode !== undefined,
                `node ${startNodeId} is not found in path ${this.props.id}`,
            );
            const endNode = this.props.nodes[endNodeId];
            assert(
                endNode !== undefined,
                `node ${endNodeId} is not found in path ${this.props.id}`,
            );

            return new Line({
                p1: startNode.point,
                p2: endNode.point,
            });
        });
    }

    serialize(): SerializedEntity {
        return {
            id: this.props.id,
            type: "path",
            nodes: Object.entries(this.props.nodes).map(([id, node]) => ({
                id,
                x: node.point.x,
                y: node.point.y,
            })),
            edges: this.props.edges,
            colorId: this.props.colorId,
            strokeStyle: this.props.strokeStyle,
        } satisfies SerializedPathEntity;
    }

    setNodePosition(nodeId: string, position: Point): this {
        const nodes = { ...this.props.nodes };
        const node = nodes[nodeId];
        assert(
            node !== undefined,
            `node ${nodeId} is not found in path ${this.props.id}`,
        );

        nodes[nodeId] = { ...node, point: position };
        return this.copy({ nodes });
    }

    getDistance(point: Point): { distance: number; point: Point } {
        let bestResult: { distance: number; point: Point } = {
            distance: Number.POSITIVE_INFINITY,
            point: point,
        };

        for (const edge of this.getOutline()) {
            const result = edge.getDistance(point);
            if (result.distance < bestResult.distance) {
                bestResult = result;
            }
        }

        return bestResult;
    }

    getOutlinePath(viewport: Viewport): string {
        const transform = Transform.translate(
            -viewport.rect.left,
            -viewport.rect.top,
        ).scale(viewport.rect.topLeft, 0, 0);

        const nodes = Object.values(this.props.nodes);
        const left = Math.min(...nodes.map((node) => node.point.x));
        const top = Math.min(...nodes.map((node) => node.point.y));

        let lastNodeId = "(nothing)";
        const commands: string[] = [];
        for (const [startNodeId, endNodeId] of this.props.edges) {
            const startNode = this.props.nodes[startNodeId];
            if (startNodeId !== lastNodeId) {
                const startCanvasPoint = transform.apply(startNode.point);
                commands.push(`M${startCanvasPoint.x} ${startCanvasPoint.y}`);
            }

            const endNode = this.props.nodes[endNodeId];
            const endCanvasPoint = transform.apply(endNode.point);
            commands.push(`L${endCanvasPoint.x} ${endCanvasPoint.y}`);

            lastNodeId = endNodeId;
        }

        return commands.join(" ");
    }

    static deserialize(data: JSONObject): PathEntity {
        const serialized = data as unknown as SerializedPathEntity;

        return new PathEntity({
            id: serialized.id,
            nodes: Object.fromEntries(
                serialized.nodes.map((node) => [
                    node.id,
                    {
                        id: node.id,
                        point: new Point(node.x, node.y),
                    },
                ]),
            ),
            edges: serialized.edges,
            [PROPERTY_KEY_COLOR_ID]: serialized.colorId,
            [PROPERTY_KEY_STROKE_STYLE]: serialized.strokeStyle,
        });
    }
}

interface SerializedPathEntity extends JSONObject {
    id: string;
    type: "path";
    nodes: {
        id: string;
        x: number;
        y: number;
    }[];
    edges: [string, string][];
    colorId: ColorId;
    strokeStyle: StrokeStyle;
}
