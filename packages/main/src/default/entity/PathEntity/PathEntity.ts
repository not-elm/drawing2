import type { App } from "../../../core/App";
import { Entity, type EntityTapEvent } from "../../../core/Entity";
import type { SerializedEntity } from "../../../core/EntityConverter";
import type { JSONObject } from "../../../core/JSONObject";
import { LinkToEdge } from "../../../core/Link";
import type { PathEdge, PathNode } from "../../../core/Path";
import { assert } from "../../../lib/assert";
import { Line } from "../../../lib/geo/Line";
import { Point } from "../../../lib/geo/Point";
import { Rect } from "../../../lib/geo/Rect";
import type { TransformMatrix } from "../../../lib/geo/TransformMatrix";
import { randomId } from "../../../lib/randomId";
import { EditTextModeController } from "../../mode/EditTextModeController";
import { type ColorId, PROPERTY_KEY_COLOR_ID } from "../../property/Colors";
import {
    type FillStyle,
    PROPERTY_KEY_FILL_STYLE,
} from "../../property/FillStyle";
import { PROPERTY_KEY_SIZING_MODE } from "../../property/SizingMode";
import {
    PROPERTY_KEY_STROKE_STYLE,
    type StrokeStyle,
} from "../../property/StrokeStyle";
import { PROPERTY_KEY_STROKE_WIDTH } from "../../property/StrokeWidth";
import { PROPERTY_KEY_TEXT_ALIGNMENT_X } from "../../property/TextAlignment";
import { TextEntity } from "../TextEntity/TextEntity";

export class PathEntity extends Entity<{
    id: string;
    nodes: Map<string, PathNode>;
    edges: [string, string][];
    [PROPERTY_KEY_COLOR_ID]: ColorId;
    [PROPERTY_KEY_STROKE_STYLE]: StrokeStyle;
    [PROPERTY_KEY_STROKE_WIDTH]: number;
    [PROPERTY_KEY_FILL_STYLE]: FillStyle;
}> {
    readonly type = "path";

    getBoundingRect(): Rect {
        const xs = this.props.nodes
            .values()
            .map((node) => node.point.x)
            .toArray();
        const ys = this.props.nodes
            .values()
            .map((node) => node.point.y)
            .toArray();

        const x = Math.min(...xs);
        const y = Math.min(...ys);
        const width = Math.max(...xs) - Math.min(...xs);
        const height = Math.max(...ys) - Math.min(...ys);

        return Rect.of(x, y, width, height);
    }

    transform(transform: TransformMatrix) {
        const nodes = new Map<string, PathNode>();
        for (const node of this.props.nodes.values()) {
            nodes.set(node.id, {
                ...node,
                point: transform.apply(node.point),
            });
        }

        return this.copy({ nodes });
    }

    getNodes(): PathNode[] {
        return this.props.nodes.values().toArray();
    }

    getNodeById(this: this, nodeId: string): PathNode | undefined {
        return this.props.nodes.get(nodeId);
    }

    getEdges(): PathEdge[] {
        return this.props.edges.map(([startId, endId]) => {
            const startNode = this.props.nodes.get(startId);
            assert(
                startNode !== undefined,
                `node ${startId} is not found in path ${this.props.id}`,
            );

            const endNode = this.props.nodes.get(endId);
            assert(
                endNode !== undefined,
                `node ${endId} is not found in path ${this.props.id}`,
            );

            return [startNode, endNode];
        });
    }

    getOutline(): (Rect | Line | Point)[] {
        return this.props.edges.map(([startNodeId, endNodeId]) => {
            const startNode = this.props.nodes.get(startNodeId);
            assert(
                startNode !== undefined,
                `node ${startNodeId} is not found in path ${this.props.id}`,
            );
            const endNode = this.props.nodes.get(endNodeId);
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
            nodes: this.props.nodes
                .values()
                .map((node) => ({
                    id: node.id,
                    x: node.point.x,
                    y: node.point.y,
                }))
                .toArray(),
            edges: this.props.edges,
            colorId: this.props.colorId,
            strokeStyle: this.props.strokeStyle,
            strokeWidth: this.props.strokeWidth,
            fillStyle: this.props.fillStyle,
        } satisfies SerializedPathEntity;
    }

    setNodePosition(nodeId: string, position: Point): this {
        const nodes = new Map(this.props.nodes);
        const node = nodes.get(nodeId);
        assert(
            node !== undefined,
            `node ${nodeId} is not found in path ${this.props.id}`,
        );

        nodes.set(nodeId, { ...node, point: position });
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

    static deserialize(data: JSONObject): PathEntity {
        const serialized = data as unknown as SerializedPathEntity;

        return new PathEntity({
            id: serialized.id,
            nodes: new Map(
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
            [PROPERTY_KEY_STROKE_WIDTH]: serialized.strokeWidth,
            [PROPERTY_KEY_FILL_STYLE]: serialized.fillStyle,
        });
    }

    onTap(app: App, ev: EntityTapEvent) {
        if (ev.selectedOnlyThisEntity) {
            const labelId = randomId();
            const label = new TextEntity({
                id: labelId,
                rect: Rect.fromSize(ev.point, 1, 1),
                content: "",
                [PROPERTY_KEY_SIZING_MODE]: "content",
                [PROPERTY_KEY_TEXT_ALIGNMENT_X]: "center",
                [PROPERTY_KEY_COLOR_ID]: 0,
            });
            const p0 = this.getNodes()[0];
            const p1 = this.getNodes()[1];

            app.canvasStateStore.edit((draft) => {
                draft.setEntity(label);
                draft.addLink(
                    new LinkToEdge(
                        randomId(),
                        labelId,
                        this.props.id,
                        p0.id,
                        p1.id,
                    ),
                );
            });

            app.canvasStateStore.unselectAll();
            app.canvasStateStore.select(label.props.id);
            app.setMode(EditTextModeController.createMode(label.props.id));
        }
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
    strokeWidth: number;
    fillStyle: FillStyle;
}
