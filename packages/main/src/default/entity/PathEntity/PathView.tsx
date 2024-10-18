import { memo } from "react";
import type { Entity } from "../../../core/Entity";
import type { Line } from "../../../lib/geo/Line";
import { Point } from "../../../lib/geo/Point";
import type { Rect } from "../../../lib/geo/Rect";
import { identity } from "../../../lib/geo/TransformMatrix";
import { convertGeometryToPathDefinition } from "../../../react/SelectionRect";
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

export const STROKE_WIDTH_BASE = 5;

export const PathView = memo(function ShapeView({
    entity,
}: { entity: Entity }) {
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
                outline={entity.getOutline()}
                top={rect.top}
                left={rect.left}
            />
        </div>
    );
});

export const PathViewInner = memo(function PathViewInner({
    colorId,
    strokeStyle,
    strokeWidth,
    fillStyle,
    outline,
    top,
    left,
}: {
    colorId: ColorId;
    strokeStyle: StrokeStyle;
    strokeWidth: number;
    fillStyle: FillStyle;
    outline: (Rect | Line | Point)[];
    top: number;
    left: number;
}) {
    const strokeWidth2 =
        ({
            solid: STROKE_WIDTH_BASE,
            dashed: STROKE_WIDTH_BASE,
            dotted: STROKE_WIDTH_BASE * 1.4,
        }[strokeStyle] *
            strokeWidth) /
        2;

    return (
        <svg
            viewBox="0 0 1 1"
            width={1}
            height={1}
            css={{
                position: "absolute",
                overflow: "visible",
                inset: 0,
            }}
        >
            <path
                d={convertGeometryToPathDefinition(
                    outline,
                    new Point(left, top),
                    identity(),
                )}
                css={{
                    stroke: Colors[colorId],
                    strokeLinejoin: "round",
                    strokeLinecap: "round",
                    ...{
                        none: { fill: "none" },
                        mono: { fill: ColorPaletteBackgroundMonoColor },
                        color: {
                            fill: ColorPaletteBackground[colorId],
                        },
                    }[fillStyle],
                }}
                strokeWidth={strokeWidth2}
                strokeDasharray={
                    {
                        solid: undefined,
                        dashed: [2 * strokeWidth, strokeWidth + 5].join(" "),
                        dotted: [0, strokeWidth * (0.5 + 1.2 + 0.5)].join(" "),
                    }[strokeStyle]
                }
            />
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
