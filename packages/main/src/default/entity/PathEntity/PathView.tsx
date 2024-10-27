import { memo } from "react";
import {
    getCornerRoundHandleData,
    getMaxCornerRadius,
} from "../../../core/SelectEntityModeController";
import type { Graph, GraphNode } from "../../../core/shape/Graph";
import type { Line } from "../../../core/shape/Line";
import {
    type ColorId,
    ColorPaletteBackground,
    ColorPaletteBackgroundMonoColor,
    Colors,
    PROPERTY_KEY_COLOR_ID,
} from "../../property/Colors";
import {
    type FillStyle,
    PROPERTY_KEY_FILL_STYLE,
} from "../../property/FillStyle";
import {
    PROPERTY_KEY_STROKE_STYLE,
    type StrokeStyle,
} from "../../property/StrokeStyle";
import { PROPERTY_KEY_STROKE_WIDTH } from "../../property/StrokeWidth";
import { PROPERTY_KEY_CORNER_RADIUS, type PathEntity } from "./PathEntity";

export const STROKE_WIDTH_BASE = 5;

export const PathView = memo(function PathView({
    entity,
}: { entity: PathEntity }) {
    const rect = entity.getBoundingRect();

    return (
        <div
            style={{
                transform: `translate(${rect.left}px, ${rect.top}px)`,
            }}
            css={{ position: "absolute" }}
        >
            <PathViewInner
                colorId={entity.getProperty(PROPERTY_KEY_COLOR_ID, 0)}
                strokeStyle={entity.getProperty(
                    PROPERTY_KEY_STROKE_STYLE,
                    "solid",
                )}
                strokeWidth={entity.getProperty(PROPERTY_KEY_STROKE_WIDTH, 2)}
                fillStyle={entity.getProperty(PROPERTY_KEY_FILL_STYLE, "none")}
                graph={entity.graph}
                top={rect.top}
                left={rect.left}
                cornerRadius={entity.getProperty(PROPERTY_KEY_CORNER_RADIUS, 0)}
            />
        </div>
    );
});

const PathViewInner = memo(function PathViewInner({
    colorId,
    strokeStyle,
    strokeWidth,
    fillStyle,
    graph,
    top,
    left,
    cornerRadius,
}: {
    colorId: ColorId;
    strokeStyle: StrokeStyle;
    strokeWidth: number;
    fillStyle: FillStyle;
    graph: Graph;
    top: number;
    left: number;
    cornerRadius: number;
}) {
    const strokeWidth2 =
        ({
            solid: STROKE_WIDTH_BASE,
            dashed: STROKE_WIDTH_BASE,
            dotted: STROKE_WIDTH_BASE * 1.4,
        }[strokeStyle] *
            strokeWidth) /
        2;

    const outline = graph.getOutline();

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
                <path
                    d={constructPathDefinition(outline.points, cornerRadius)}
                    css={{
                        ...{
                            none: { fill: "none" },
                            mono: { fill: ColorPaletteBackgroundMonoColor },
                            color: {
                                fill: ColorPaletteBackground[colorId],
                            },
                        }[fillStyle],
                        stroke: "none",
                    }}
                />
                <path
                    d={constructPathDefinitionForEdges(
                        graph.getEdges(),
                        cornerRadius,
                    )}
                    css={{
                        fill: "none",
                        stroke: Colors[colorId],
                        strokeLinejoin: "round",
                        strokeLinecap: "round",
                        strokeWidth: strokeWidth2,
                        strokeDasharray: {
                            solid: undefined,
                            dashed: [2 * strokeWidth2, strokeWidth2 + 5].join(
                                " ",
                            ),
                            dotted: [0, strokeWidth2 * (0.5 + 1.2 + 0.5)].join(
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

function constructPathDefinition(
    nodes: GraphNode[],
    cornerRadius: number,
): string {
    const commands: string[] = [];
    const maxRadius = getMaxCornerRadius(nodes);
    const radius = Math.min(cornerRadius, maxRadius);
    const handles = getCornerRoundHandleData(nodes, radius);

    for (const handle of handles) {
        if (commands.length === 0) {
            commands.push(
                `M${handle.arcStartPosition.x} ${handle.arcStartPosition.y}`,
            );
        } else {
            commands.push(
                `L${handle.arcStartPosition.x} ${handle.arcStartPosition.y}`,
            );
        }

        // 0 is clockwise, 1 is counter-clockwise.
        // Outline is defined in clockwise. Round arc should be also in clockwise.
        // However, if the angle is larger than PI, it should be in counter-clockwise
        // because the arc should be at the outside of the outline.
        const arcDirection = handle.cornerAngle > Math.PI ? 0 : 1;
        commands.push(
            `A${radius} ${radius} 0 0 ${arcDirection} ${handle.arcEndPosition.x} ${handle.arcEndPosition.y}`,
        );
    }
    return `${commands.join(" ")}Z`;
}

function constructPathDefinitionForEdges(
    edges: Line[],
    cornerRadius: number,
): string {
    const commands: string[] = [];
    for (const edge of edges) {
        commands.push(`M${edge.p1.x} ${edge.p1.y}`);
        commands.push(`L${edge.p2.x} ${edge.p2.y}`);
    }
    return `${commands.join(" ")}Z`;
}
