import { EntityHandle } from "../../core/EntityHandle";
import type { ColorId } from "../../core/model/Colors";
import type { SerializedEntity } from "../../core/model/SerializedPage";
import type { StrokeStyle } from "../../core/model/StrokeStyle";
import { assert } from "../../lib/assert";
import type { Line } from "../../lib/geo/Line";
import { Point } from "../../lib/geo/Point";
import type { Rect } from "../../lib/geo/Rect";
import type { Transform } from "../../lib/geo/Transform";
import {
    type PathEdge,
    type PathEntity,
    type PathNode,
    getBoundingRectOfPath,
    getEdgesFromPath,
} from "./PathEntity";

export class PathEntityHandle extends EntityHandle<PathEntity> {
    getType(): string {
        return "path";
    }

    transform(entity: PathEntity, transform: Transform) {
        const nodes: Record<string, PathNode> = {};
        for (const node of Object.values(entity.nodes)) {
            nodes[node.id] = {
                ...node,
                point: transform.apply(node.point),
            };
        }

        return { ...entity, nodes };
    }

    getBoundingRect(entity: PathEntity) {
        return getBoundingRectOfPath(entity);
    }

    getNodes(entity: PathEntity): PathNode[] {
        return Object.values(entity.nodes);
    }

    getEdges(entity: PathEntity): PathEdge[] {
        return entity.edges.map(([startId, endId]) => [
            entity.nodes[startId],
            entity.nodes[endId],
        ]);
    }

    getOutline(entity: PathEntity): (Rect | Line | Point)[] {
        return getEdgesFromPath(entity);
    }

    serialize(entity: PathEntity): SerializedEntity {
        return {
            id: entity.id,
            type: "path",
            nodes: Object.entries(entity.nodes).map(([id, node]) => ({
                id,
                x: node.point.x,
                y: node.point.y,
                endType: node.endType,
            })),
            edges: entity.edges,
            colorId: entity.colorId,
            strokeStyle: entity.strokeStyle,
        } satisfies SerializedPathEntity;
    }

    deserialize(data: SerializedEntity): PathEntity {
        const serialized = data as unknown as SerializedPathEntity;

        return {
            id: serialized.id,
            type: "path",
            nodes: Object.fromEntries(
                serialized.nodes.map((node) => [
                    node.id,
                    {
                        id: node.id,
                        point: new Point(node.x, node.y),
                        endType: node.endType,
                    },
                ]),
            ),
            edges: serialized.edges,
            colorId: serialized.colorId,
            strokeStyle: serialized.strokeStyle,
        };
    }

    setNodePosition(
        entity: PathEntity,
        nodeId: string,
        position: Point,
    ): PathEntity {
        const nodes = { ...entity.nodes };
        const node = nodes[nodeId];
        assert(
            node !== undefined,
            `node ${nodeId} is not found in path ${entity.id}`,
        );

        nodes[nodeId] = { ...node, point: position };
        return { ...entity, nodes };
    }

    getDistance(
        entity: PathEntity,
        point: Point,
    ): { distance: number; point: Point } {
        let bestResult: { distance: number; point: Point } = {
            distance: Number.POSITIVE_INFINITY,
            point: point,
        };

        for (const edge of getEdgesFromPath(entity)) {
            const result = edge.getDistance(point);
            if (result.distance < bestResult.distance) {
                bestResult = result;
            }
        }

        return bestResult;
    }
}

interface SerializedPathEntity extends SerializedEntity {
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
