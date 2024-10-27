import type { App } from "../../../core/App";
import {
    Entity,
    type EntityProps,
    type EntityTapEvent,
} from "../../../core/Entity";
import type { SerializedEntity } from "../../../core/EntityConverter";
import type { JSONObject } from "../../../core/JSONObject";
import { Graph, type GraphEdge, GraphNode } from "../../../core/shape/Graph";
import { Point } from "../../../core/shape/Point";
import type { TransformMatrix } from "../../../core/shape/TransformMatrix";
import { assert } from "../../../lib/assert";
import { type ColorId, PROPERTY_KEY_COLOR_ID } from "../../property/Colors";
import {
    type FillStyle,
    PROPERTY_KEY_FILL_STYLE,
} from "../../property/FillStyle";
import {
    PROPERTY_KEY_STROKE_STYLE,
    type StrokeStyle,
} from "../../property/StrokeStyle";
import { PROPERTY_KEY_STROKE_WIDTH } from "../../property/StrokeWidth";

import { getMaxCornerRadius } from "../../../core/SelectEntityModeController";
import { SelectPathModeController } from "../../../core/SelectPathModeController";
import { Rect, type Shape } from "../../../core/shape/Shape";

export const PROPERTY_KEY_CORNER_RADIUS = "cornerRadius";

interface Props extends EntityProps {
    id: string;
    [PROPERTY_KEY_COLOR_ID]: ColorId;
    [PROPERTY_KEY_STROKE_STYLE]: StrokeStyle;
    [PROPERTY_KEY_STROKE_WIDTH]: number;
    [PROPERTY_KEY_FILL_STYLE]: FillStyle;
    [PROPERTY_KEY_CORNER_RADIUS]: number;
}

export class PathEntity extends Entity<Props> {
    readonly type = "path";

    constructor(
        props: Props,
        readonly graph: Graph,
    ) {
        super(props);
    }

    setProperty(propertyKey: string, value: unknown): PathEntity {
        if (!this.isPropertySupported(propertyKey)) return this;

        return new PathEntity(
            {
                ...this.props,
                [propertyKey]: value,
            },
            this.graph,
        );
    }

    getBoundingRect(): Rect {
        const xs = this.graph.nodes
            .values()
            .map((node) => node.x)
            .toArray();
        const ys = this.graph.nodes
            .values()
            .map((node) => node.y)
            .toArray();

        const x = Math.min(...xs);
        const y = Math.min(...ys);
        const width = Math.max(...xs) - Math.min(...xs);
        const height = Math.max(...ys) - Math.min(...ys);

        return Rect.of(x, y, width, height);
    }

    transform(transform: TransformMatrix): PathEntity {
        const graph = this.graph.clone();
        for (const node of this.graph.nodes.values()) {
            const newPoint = transform.apply(new Point(node.x, node.y));
            graph.setNodePosition(node.id, newPoint.x, newPoint.y);
        }

        return new PathEntity(this.props, graph);
    }

    getNodes(): GraphNode[] {
        return [...this.graph.nodes.values()];
    }

    getNodeById(nodeId: string): GraphNode | undefined {
        return this.graph.nodes.get(nodeId);
    }

    getEdges(): GraphEdge[] {
        return this.graph.getEdges();
    }

    getShape(): Shape {
        return this.graph;
    }

    serialize(): SerializedEntity {
        return {
            id: this.props.id,
            type: "path",
            nodes: [...this.graph.nodes.values()].map((node) => ({
                id: node.id,
                x: node.x,
                y: node.y,
            })),
            edges: this.graph
                .getEdges()
                .map((edge) => [edge.p1.id, edge.p2.id]),
            colorId: this.props.colorId,
            strokeStyle: this.props.strokeStyle,
            strokeWidth: this.props.strokeWidth,
            fillStyle: this.props.fillStyle,
            cornerRadius: this.props.cornerRadius,
        } satisfies SerializedPathEntity;
    }

    setNodePosition(nodeId: string, position: Point): PathEntity {
        const graph = this.graph.clone();
        graph.setNodePosition(nodeId, position.x, position.y);

        return new PathEntity(this.props, graph);
    }

    static deserialize(data: JSONObject): PathEntity {
        const serialized = data as unknown as SerializedPathEntity;
        const nodes = new Map(
            serialized.nodes.map((serializedNode) => {
                const node = new GraphNode(
                    serializedNode.id,
                    serializedNode.x,
                    serializedNode.y,
                );
                return [node.id, node];
            }),
        );

        const graph = Graph.create();
        for (const edge of serialized.edges) {
            const node1 = nodes.get(edge[0]);
            assert(
                node1 !== undefined,
                `node ${edge[0]} is not found in path ${serialized.id}`,
            );

            const node2 = nodes.get(edge[1]);
            assert(
                node2 !== undefined,
                `node ${edge[1]} is not found in path ${serialized.id}`,
            );

            graph.addEdge(node1, node2);
        }

        return new PathEntity(
            {
                id: serialized.id,
                [PROPERTY_KEY_COLOR_ID]: serialized.colorId,
                [PROPERTY_KEY_STROKE_STYLE]: serialized.strokeStyle,
                [PROPERTY_KEY_STROKE_WIDTH]: serialized.strokeWidth,
                [PROPERTY_KEY_FILL_STYLE]: serialized.fillStyle,
                [PROPERTY_KEY_CORNER_RADIUS]: serialized.cornerRadius,
            },
            graph,
        );
    }

    onTap(app: App, ev: EntityTapEvent) {
        if (ev.previousSelectedEntities.has(this.props.id)) {
            app.canvasStateStore.unselectAll();
            app.canvasStateStore.select(this.props.id);
            app.setMode(SelectPathModeController.MODE_NAME);
        }
        // if (
        //     ev.previousSelectedEntities.size === 1 &&
        //     ev.previousSelectedEntities.has(this.props.id)
        // ) {
        //     const labelId = randomId();
        //     const label = new TextEntity({
        //         id: labelId,
        //         rect: Rect.fromSize(ev.point, 1, 1),
        //         content: "",
        //         [PROPERTY_KEY_SIZING_MODE]: "content",
        //         [PROPERTY_KEY_TEXT_ALIGNMENT_X]: "center",
        //         [PROPERTY_KEY_COLOR_ID]: 0,
        //     });
        //     const p0 = this.getNodes()[0];
        //     const p1 = this.getNodes()[1];
        //
        //     app.canvasStateStore.edit((draft) => {
        //         draft.setEntity(label);
        //         const linkToEdge = new LinkToEdge(
        //             randomId(),
        //             labelId,
        //             this.props.id,
        //             p0.id,
        //             p1.id,
        //         );
        //         draft.addLink(linkToEdge);
        //     });
        //
        //     app.canvasStateStore.unselectAll();
        //     app.canvasStateStore.select(label.props.id);
        //     app.setMode(EditTextModeController.createMode(label.props.id));
        // }
    }

    onTransformEnd(app: App) {
        this.constraintCornerRadius(app);
    }

    private constraintCornerRadius(app: App) {
        const maxCornerRadius = getMaxCornerRadius(
            this.graph.getOutline().points,
        );
        if (maxCornerRadius < this.props[PROPERTY_KEY_CORNER_RADIUS]) {
            app.canvasStateStore.edit((draft) => {
                draft.updateProperty(
                    [this.props.id],
                    PROPERTY_KEY_CORNER_RADIUS,
                    maxCornerRadius,
                );
            });
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
    cornerRadius: number;
}
