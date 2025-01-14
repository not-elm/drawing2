import { memo } from "react";
import { Color } from "../../../core/Color";
import type { Graph, GraphNode } from "../../../core/shape/Graph";
import { useApp } from "../../../react/hooks/useApp";
import {
    PROPERTY_KEY_FILL_COLOR,
    PROPERTY_KEY_STROKE_COLOR,
} from "../../property/Colors";
import {
    PROPERTY_KEY_STROKE_STYLE,
    type StrokeStyle,
} from "../../property/StrokeStyle";
import { PROPERTY_KEY_STROKE_WIDTH } from "../../property/StrokeWidth";
import {
    PROPERTY_KEY_ARROW_HEAD_NODE_IDS,
    type PathEntity,
    PathEntityHandle,
} from "./PathEntity";

export const PathView = memo(function PathView({
    entity,
}: { entity: PathEntity }) {
    const app = useApp();
    const rect = app.entityHandle.getShape(entity).getBoundingRect();

    return (
        <div
            style={{
                transform: `translate(${rect.left}px, ${rect.top}px)`,
            }}
            css={{ position: "absolute" }}
        >
            <PathViewInner
                strokeColor={entity[PROPERTY_KEY_STROKE_COLOR]}
                strokeStyle={entity[PROPERTY_KEY_STROKE_STYLE]}
                strokeWidth={entity[PROPERTY_KEY_STROKE_WIDTH]}
                fillColor={entity[PROPERTY_KEY_FILL_COLOR] ?? Color.Transparent}
                graph={PathEntityHandle.getGraph(entity)}
                top={rect.top}
                left={rect.left}
                arrowHeadNodeIds={entity[PROPERTY_KEY_ARROW_HEAD_NODE_IDS]}
            />
        </div>
    );
});

const PathViewInner = memo(function PathViewInner({
    strokeColor,
    strokeStyle,
    strokeWidth,
    fillColor,
    graph,
    top,
    left,
    arrowHeadNodeIds,
}: {
    strokeColor: Color;
    strokeStyle: StrokeStyle;
    strokeWidth: number;
    fillColor: Color;
    graph: Graph;
    top: number;
    left: number;
    arrowHeadNodeIds: string[];
}) {
    const outline = graph.getOutline();

    const pathDefinitionForFill = computePathDefinitionForFill(outline.points);
    return (
        <>
            <svg
                viewBox={`${left} ${top} 1 1`}
                width={1}
                height={1}
                css={{
                    position: "absolute",
                    overflow: "visible",
                    inset: 0,
                }}
            >
                {pathDefinitionForFill !== "Z" && (
                    <path
                        d={pathDefinitionForFill}
                        css={{
                            fill: Color.stringify(fillColor),
                            stroke: "none",
                        }}
                    />
                )}
                <path
                    d={computePathDefinitionForEdges(graph, arrowHeadNodeIds)}
                    css={{
                        fill: "none",
                        stroke: Color.stringify(strokeColor),
                        strokeLinejoin: "round",
                        strokeLinecap: "round",
                        strokeWidth,
                        strokeDasharray: {
                            none: undefined,
                            solid: undefined,
                            dashed: [2 * strokeWidth, strokeWidth + 5].join(
                                " ",
                            ),
                            dotted: [0, strokeWidth * (0.5 + 1.2 + 0.5)].join(
                                " ",
                            ),
                        }[strokeStyle],
                    }}
                />
            </svg>
        </>
    );
});

const ARROW_HEAD_SIZE = 16;

/**
 * Construct part of path definition (path-d) of arrow head.
 * @param x1 The x-coordinate of the point having arrow head
 * @param y1 The y-coordinate of the point having arrow head
 * @param x2 The x-coordinate of the point connected with the point having arrow head
 * @param y2 The y-coordinate of the point connected with the point having arrow head
 * @param angle The angle of the arrow head. Default is Math.PI / 6.
 */
function constructArrowHeadPath(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    angle: number = Math.PI / 6,
): string | null {
    const cosR = Math.cos(angle);
    const sinR = Math.sin(angle);
    const dv = Math.hypot(x2 - x1, y2 - y1);
    if (dv === 0) return null;

    const vx = ((x2 - x1) * ARROW_HEAD_SIZE) / dv;
    const vy = ((y2 - y1) * ARROW_HEAD_SIZE) / dv;
    const q1x = x1 + vx * cosR - vy * -sinR;
    const q1y = y1 + vx * -sinR + vy * cosR;
    const q2x = x1 + vx * cosR - vy * sinR;
    const q2y = y1 + vx * sinR + vy * cosR;

    return [`M${q1x} ${q1y}`, `L${x1} ${y1}`, `L${q2x} ${q2y}`].join(" ");
}

function computePathDefinitionForFill(nodes: GraphNode[]): string {
    const commands: string[] = [];

    for (const node of nodes) {
        if (commands.length === 0) {
            commands.push(`M${node.x} ${node.y}`);
        } else {
            commands.push(`L${node.x} ${node.y}`);
        }
    }
    return `${commands.join(" ")}Z`;
}

function computePathDefinitionForEdges(
    graph: Graph,
    arrowHeadNodeIds: string[],
): string {
    const edges = graph.getEdges();
    const commands: string[] = [];
    for (const edge of edges) {
        commands.push(`M${edge.p1.x} ${edge.p1.y}`);
        commands.push(`L${edge.p2.x} ${edge.p2.y}`);
        if (
            arrowHeadNodeIds.includes(edge.p1.id) &&
            graph.edges.get(edge.p1.id)?.length === 1
        ) {
            const arrowHeadPath = constructArrowHeadPath(
                edge.p1.x,
                edge.p1.y,
                edge.p2.x,
                edge.p2.y,
            );
            if (arrowHeadPath) {
                commands.push(arrowHeadPath);
            }
        }
        if (
            arrowHeadNodeIds.includes(edge.p2.id) &&
            graph.edges.get(edge.p2.id)?.length === 1
        ) {
            const arrowHeadPath = constructArrowHeadPath(
                edge.p2.x,
                edge.p2.y,
                edge.p1.x,
                edge.p1.y,
            );
            if (arrowHeadPath) {
                commands.push(arrowHeadPath);
            }
        }
    }
    return `${commands.join(" ")}`;
}
