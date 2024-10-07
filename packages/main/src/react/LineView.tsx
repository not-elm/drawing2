import { memo } from "react";
import { Colors } from "../model/Colors";
import type { LineBlock } from "../model/Page";

export const LineView = memo(function LineView({ line }: { line: LineBlock }) {
    const { x1, y1, x2, y2 } = line;
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);

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
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
});

function constructPath(line: LineBlock): string {
    const { x1, y1, x2, y2 } = line;
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);

    const commands: string[] = [];
    commands.push(`M${x1 - left} ${y1 - top}`, `L${x2 - left} ${y2 - top}`);

    const ARROW_HEAD_SIZE = 16;
    const ARROW_HEAD_ANGLE = Math.PI / 6;

    const cosR = Math.cos(ARROW_HEAD_ANGLE);
    const sinR = Math.sin(ARROW_HEAD_ANGLE);
    const dv = Math.hypot(x2 - x1, y2 - y1);

    if (line.endType1 === "arrow" && dv > 0) {
        const vx = ((x2 - x1) * ARROW_HEAD_SIZE) / dv;
        const vy = ((y2 - y1) * ARROW_HEAD_SIZE) / dv;
        const q1x = x1 + vx * cosR - vy * -sinR;
        const q1y = y1 + vx * -sinR + vy * cosR;
        const q2x = x1 + vx * cosR - vy * sinR;
        const q2y = y1 + vx * sinR + vy * cosR;

        commands.push(
            `M${q1x - left} ${q1y - top}`,
            `L${x1 - left} ${y1 - top}`,
            `L${q2x - left} ${q2y - top}`,
        );
    }
    if (line.endType2 === "arrow" && dv > 0) {
        const vx = ((x1 - x2) * ARROW_HEAD_SIZE) / dv;
        const vy = ((y1 - y2) * ARROW_HEAD_SIZE) / dv;
        const q1x = x2 + vx * cosR - vy * -sinR;
        const q1y = y2 + vx * -sinR + vy * cosR;
        const q2x = x2 + vx * cosR - vy * sinR;
        const q2y = y2 + vx * sinR + vy * cosR;

        commands.push(
            `M${q1x - left} ${q1y - top}`,
            `L${x2 - left} ${y2 - top}`,
            `L${q2x - left} ${q2y - top}`,
        );
    }
    return commands.join(" ");
}
