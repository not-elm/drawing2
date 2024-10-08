import { memo } from "react";
import { Colors } from "../model/Colors";
import type { LineBlock } from "../model/Page";

const STROKE_WIDTH_BASE = 5;

export const LineView = memo(function LineView({ line }: { line: LineBlock }) {
    const { x1, y1, x2, y2 } = line;
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);

    const arrowHeadPath1 = constructArrowHeadPath(
        x1 - left,
        y1 - top,
        x2 - left,
        y2 - top,
    );
    const arrowHeadPath2 = constructArrowHeadPath(
        x2 - left,
        y2 - top,
        x1 - left,
        y1 - top,
    );

    const strokeWidth = {
        solid: STROKE_WIDTH_BASE,
        dashed: STROKE_WIDTH_BASE,
        dotted: STROKE_WIDTH_BASE * 1.4,
    }[line.strokeStyle];
    return (
        <svg
            viewBox="0 0 1 1"
            width={1}
            height={1}
            css={{
                position: "absolute",
                top,
                left,
                overflow: "visible",
            }}
        >
            <path
                css={{ stroke: Colors[line.colorId], fill: "none" }}
                d={constructPath(line)}
                strokeWidth={strokeWidth}
                strokeDasharray={
                    {
                        solid: undefined,
                        dashed: [2 * strokeWidth, strokeWidth + 5].join(" "),
                        dotted: [0, strokeWidth * (0.5 + 1.2 + 0.5)].join(" "),
                    }[line.strokeStyle]
                }
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {line.endType1 === "arrow" && arrowHeadPath1 && (
                <path
                    css={{ stroke: Colors[line.colorId], fill: "none" }}
                    d={arrowHeadPath1}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            )}
            {line.endType2 === "arrow" && arrowHeadPath2 && (
                <path
                    css={{ stroke: Colors[line.colorId], fill: "none" }}
                    d={arrowHeadPath2}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
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

function constructPath(line: LineBlock): string {
    const { x1, y1, x2, y2 } = line;
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);

    const commands: string[] = [];
    commands.push(`M${x1 - left} ${y1 - top}`, `L${x2 - left} ${y2 - top}`);

    return commands.join(" ");
}
