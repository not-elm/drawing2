import type { App } from "../../../core/App";
import {
    Entity,
    type EntityProps,
    type EntityTapEvent,
} from "../../../core/Entity";
import type { SerializedEntity } from "../../../core/EntityConverter";
import { Graph, type GraphEdge, GraphNode } from "../../../core/Graph";
import type { JSONObject } from "../../../core/JSONObject";
import { createSelectPathMode } from "../../../core/SelectPathModeController";
import { assert } from "../../../lib/assert";
import { Line } from "../../../lib/geo/Line";
import { Point } from "../../../lib/geo/Point";
import { Rect } from "../../../lib/geo/Rect";
import type { TransformMatrix } from "../../../lib/geo/TransformMatrix";
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

interface Props extends EntityProps {
    id: string;
    [PROPERTY_KEY_COLOR_ID]: ColorId;
    [PROPERTY_KEY_STROKE_STYLE]: StrokeStyle;
    [PROPERTY_KEY_STROKE_WIDTH]: number;
    [PROPERTY_KEY_FILL_STYLE]: FillStyle;
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
        const nodes = this.graph.getOutline();

        const edges: GraphEdge[] = [];
        for (let i = 0; i < nodes.length; i++) {
            const startNode = nodes[i];
            const endNode = nodes[i === nodes.length - 1 ? 0 : i + 1];

            edges.push([startNode, endNode]);
        }
        return edges;
    }

    getOutline(): (Rect | Line | Point)[] {
        const nodes = this.graph.getOutline();

        const liens: Line[] = [];
        for (let i = 0; i < nodes.length; i++) {
            const startNode = nodes[i];
            const endNode = nodes[i === nodes.length - 1 ? 0 : i + 1];

            liens.push(Line.of(startNode.x, startNode.y, endNode.x, endNode.y));
        }
        return liens;
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
                .map(([startNode, endNode]) => [startNode.id, endNode.id]),
            colorId: this.props.colorId,
            strokeStyle: this.props.strokeStyle,
            strokeWidth: this.props.strokeWidth,
            fillStyle: this.props.fillStyle,
        } satisfies SerializedPathEntity;
    }

    setNodePosition(nodeId: string, position: Point): PathEntity {
        const graph = this.graph.clone();
        graph.setNodePosition(nodeId, position.x, position.y);

        return new PathEntity(this.props, graph);
    }

    getDistance(point: Point): { distance: number; point: Point } {
        if (this.graph.contains(point)) return { distance: 0, point };

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
            },
            graph,
        );
    }

    onTap(app: App, ev: EntityTapEvent) {
        if (ev.previousSelectedEntities.has(this.props.id)) {
            app.setMode(createSelectPathMode(this.props.id));
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
