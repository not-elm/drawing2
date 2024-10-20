import { memo } from "react";
import type { Graph, GraphNode } from "../../../core/Graph";
import { Point } from "../../../lib/geo/Point";
import { normalizeAngle } from "../../../lib/normalizeAngle";
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
            {outline.length > 0 && (
                <path
                    d={constructPathDefinition(outline, cornerRadius)}
                    css={{
                        ...{
                            none: { fill: "none" },
                            mono: { fill: ColorPaletteBackgroundMonoColor },
                            color: {
                                fill: ColorPaletteBackground[colorId],
                            },
                        }[fillStyle],
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
            )}
        </svg>
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
    outline: Array<GraphNode>,
    cornerRadius: number,
): string {
    const commands: string[] = [];

    for (let i = 0; i < outline.length; i++) {
        const p0 = outline[(i - 1 + outline.length) % outline.length];
        const p1 = outline[i];
        const p2 = outline[(i + 1) % outline.length];

        const p10x = p0.x - p1.x;
        const p10y = p0.y - p1.y;
        const norm10 = Math.hypot(p10x, p10y);
        const i10x = p10x / norm10;
        const i10y = p10y / norm10;
        const p12x = p2.x - p1.x;
        const p12y = p2.y - p1.y;
        const norm12 = Math.hypot(p12x, p12y);
        const i12x = p12x / norm12;
        const i12y = p12y / norm12;

        const angleP10 = Math.atan2(p10y, p10x);
        const angleP12 = Math.atan2(p12y, p12x);
        const angle = normalizeAngle(-(angleP12 - angleP10));
        const arcAngle =
            cornerRadius /
            Math.tan(angle > Math.PI ? Math.PI - angle / 2 : angle / 2);

        const pArcStart = new Point(
            p1.x + arcAngle * i10x,
            p1.y + arcAngle * i10y,
        );
        const pArcEnd = new Point(
            p1.x + arcAngle * i12x,
            p1.y + arcAngle * i12y,
        );

        if (commands.length === 0) {
            commands.push(`M${pArcStart.x} ${pArcStart.y}`);
        } else {
            commands.push(`L${pArcStart.x} ${pArcStart.y}`);
        }

        // 0 is clockwise, 1 is counter-clockwise.
        // Outline is defined in clockwise. Round arc should be also in clockwise.
        // However, if the angle is larger than PI, it should be in counter-clockwise
        // because the arc should be at the outside of the outline.
        const arcDirection = angle > Math.PI ? 0 : 1;
        commands.push(
            `A${cornerRadius} ${cornerRadius} 0 0 ${arcDirection} ${pArcEnd.x} ${pArcEnd.y}`,
        );
    }

    return `${commands.join(" ")}Z`;
}
