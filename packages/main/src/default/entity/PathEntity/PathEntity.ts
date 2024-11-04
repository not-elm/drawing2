import type { App } from "../../../core/App";
import {
    type Entity,
    EntityHandle,
    type TapEntityEvent,
    type TransformEvent,
} from "../../../core/Entity";
import { Graph, type GraphEdge, GraphNode } from "../../../core/shape/Graph";
import { Point } from "../../../core/shape/Point";
import { assert } from "../../../lib/assert";
import {
    PROPERTY_KEY_FILL_COLOR,
    PROPERTY_KEY_STROKE_COLOR,
} from "../../property/Colors";
import {
    PROPERTY_KEY_STROKE_STYLE,
    type StrokeStyle,
} from "../../property/StrokeStyle";
import { PROPERTY_KEY_STROKE_WIDTH } from "../../property/StrokeWidth";

import type { ComponentType } from "react";
import { Color } from "../../../core/Color";
import { SelectPathModeController } from "../../../core/mode/SelectPathModeController";
import type { Shape } from "../../../core/shape/Shape";
import { PathView } from "./PathView";

export const PROPERTY_KEY_ARROW_HEAD_NODE_IDS = "arrowHeadNodeIds";

export interface PathEntity extends Entity {
    readonly type: "path";
    readonly id: string;
    nodes: { id: string; x: number; y: number }[];
    edges: [string, string][];
    [PROPERTY_KEY_STROKE_COLOR]: Color;
    [PROPERTY_KEY_STROKE_STYLE]: StrokeStyle;
    [PROPERTY_KEY_STROKE_WIDTH]: number;
    [PROPERTY_KEY_FILL_COLOR]: Color;
    [PROPERTY_KEY_ARROW_HEAD_NODE_IDS]: string[];
}

export class PathEntityHandle extends EntityHandle<PathEntity> {
    static readonly SCHEMA_VERSION = 2;
    public readonly type = "path";

    getShape(entity: PathEntity): Shape {
        return PathEntityHandle.getGraph(entity);
    }

    getSVGElement(entity: PathEntity): SVGElement {
        const graph = PathEntityHandle.getGraph(entity);
        const elements: SVGElement[] = [];

        const outline = graph.getOutline();
        const dCommands: string[] = [];
        for (const node of outline.points) {
            if (dCommands.length === 0) {
                dCommands.push(`M ${node.x} ${node.y}`);
            } else {
                dCommands.push(`L ${node.x} ${node.y}`);
            }
        }
        dCommands.push("Z");
        const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path",
        );
        path.setAttribute("d", dCommands.join(" "));
        path.setAttribute("stroke", "black");
        path.setAttribute("fill", "white");
        elements.push(path);

        for (const edge of graph.getEdges()) {
            const path = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path",
            );
            path.setAttribute(
                "d",
                `M ${edge.p1.x} ${edge.p1.y} L ${edge.p2.x} ${edge.p2.y}`,
            );
            path.setAttribute("stroke", "black");
            path.setAttribute(
                "stroke-width",
                `${entity[PROPERTY_KEY_STROKE_WIDTH]}px`,
            );
            path.setAttribute("stroke-linecap", "round");
            path.setAttribute("stroke-linejoin", "round");
            elements.push(path);
        }

        const group = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g",
        );
        for (const element of elements) {
            group.appendChild(element);
        }

        return group;
    }

    getView(): ComponentType<{ entity: PathEntity }> {
        return PathView;
    }

    upgradeSchemaVersion(entity: PathEntity): PathEntity {
        switch (entity.schemaVersion) {
            case undefined: {
                // Add schemaVersion
                return { ...entity, schemaVersion: 1 };
            }
            case 1: {
                // replace colorId with strokeColor and fillColor
                return {
                    ...entity,
                    [PROPERTY_KEY_STROKE_COLOR]:
                        entity[PROPERTY_KEY_STROKE_COLOR] ?? Color.Black,
                    [PROPERTY_KEY_FILL_COLOR]:
                        entity[PROPERTY_KEY_FILL_COLOR] ?? Color.Transparent,
                    schemaVersion: PathEntityHandle.SCHEMA_VERSION,
                };
            }
        }

        return entity;
    }

    onTap(entity: PathEntity, app: App, ev: TapEntityEvent) {
        if (ev.previousSelectedEntities.has(entity.id)) {
            app.canvas.unselectAll();
            app.canvas.select(entity.id);
            app.setMode(SelectPathModeController.type);
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
        //     app.canvasStateStore.edit((builder) => {
        //         builder.setEntity(label);
        //         const linkToEdge = new LinkToEdge(
        //             randomId(),
        //             labelId,
        //             this.props.id,
        //             p0.id,
        //             p1.id,
        //         );
        //         builder.addLink(linkToEdge);
        //     });
        //
        //     app.canvasStateStore.unselectAll();
        //     app.canvasStateStore.select(label.props.id);
        //     app.setMode(EditTextModeController.createMode(label.props.id));
        // }
    }

    onTransform(entity: PathEntity, ev: TransformEvent): PathEntity {
        const graph = PathEntityHandle.getGraph(entity);
        for (const node of graph.nodes.values()) {
            graph.setNodePosition(
                node.id,
                ev.transform.apply(new Point(node.x, node.y)),
            );
        }

        return PathEntityHandle.setGraph(entity, graph);
    }

    static getNodes(entity: PathEntity): GraphNode[] {
        return entity.nodes.map(
            ({ id, x, y }) => new GraphNode(id, new Point(x, y)),
        );
    }

    static getEdgeById(
        entity: PathEntity,
        edgeId: string,
    ): GraphEdge | undefined {
        return PathEntityHandle.getGraph(entity)
            .getEdges()
            .find((edge) => {
                return edge.id === edgeId;
            });
    }

    static getNodeById(
        entity: PathEntity,
        nodeId: string,
    ): GraphNode | undefined {
        const data = entity.nodes.find((node) => node.id === nodeId);
        if (!data) return undefined;

        return new GraphNode(data.id, new Point(data.x, data.y));
    }

    static setNodePosition(
        entity: PathEntity,
        nodeId: string,
        position: Point,
    ): PathEntity {
        return {
            ...entity,
            nodes: entity.nodes.map((node) =>
                node.id === nodeId
                    ? { ...node, x: position.x, y: position.y }
                    : node,
            ),
        };
    }

    static getGraph(entity: PathEntity): Graph {
        const graph = Graph.create();
        for (const node of PathEntityHandle.getNodes(entity)) {
            graph.addNode(node);
        }
        for (const edge of entity.edges) {
            const node1 = graph.nodes.get(edge[0]);
            assert(
                node1 !== undefined,
                `node ${edge[0]} is not found in path ${entity.id}`,
            );

            const node2 = graph.nodes.get(edge[1]);
            assert(
                node2 !== undefined,
                `node ${edge[1]} is not found in path ${entity.id}`,
            );

            graph.addEdge(node1, node2);
        }

        return graph;
    }

    static setGraph(entity: PathEntity, graph: Graph): PathEntity {
        return {
            ...entity,
            nodes: [...graph.nodes.values()].map((node) => ({
                id: node.id,
                x: node.x,
                y: node.y,
            })),
            edges: graph.getEdges().map((edge) => [edge.p1.id, edge.p2.id]),
        };
    }
}

export function isPathEntity(entity: Entity): entity is PathEntity {
    return entity.type === "path";
}
