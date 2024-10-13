import { memo } from "react";
import { Colors } from "../../core/model/Colors";

import type { PathEntity } from "./PathEntity";

export const STROKE_WIDTH_BASE = 5;

export const PathView = memo(function PathView({
    entity,
}: { entity: PathEntity }) {
    const nodes = Object.values(entity.nodes);
    const left = Math.min(...nodes.map((node) => node.point.x));
    const top = Math.min(...nodes.map((node) => node.point.y));

    // const arrowHeadPath1 = constructArrowHeadPath(
    //     x1 - left,
    //     y1 - top,
    //     x2 - left,
    //     y2 - top,
    // );
    // const arrowHeadPath2 = constructArrowHeadPath(
    //     x2 - left,
    //     y2 - top,
    //     x1 - left,
    //     y1 - top,
    // );

    const strokeWidth = {
        solid: STROKE_WIDTH_BASE,
        dashed: STROKE_WIDTH_BASE,
        dotted: STROKE_WIDTH_BASE * 1.4,
    }[entity.strokeStyle];
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
                css={{ stroke: Colors[entity.colorId], fill: "none" }}
                d={constructPath(entity)}
                strokeWidth={strokeWidth}
                strokeDasharray={
                    {
                        solid: undefined,
                        dashed: [2 * strokeWidth, strokeWidth + 5].join(" "),
                        dotted: [0, strokeWidth * (0.5 + 1.2 + 0.5)].join(" "),
                    }[entity.strokeStyle]
                }
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/*{entity.endType1 === "arrow" && arrowHeadPath1 && (*/}
            {/*    <path*/}
            {/*        css={{ stroke: Colors[entity.colorId], fill: "none" }}*/}
            {/*        d={arrowHeadPath1}*/}
            {/*        strokeWidth={strokeWidth}*/}
            {/*        strokeLinecap="round"*/}
            {/*        strokeLinejoin="round"*/}
            {/*    />*/}
            {/*)}*/}
            {/*{entity.endType2 === "arrow" && arrowHeadPath2 && (*/}
            {/*    <path*/}
            {/*        css={{ stroke: Colors[entity.colorId], fill: "none" }}*/}
            {/*        d={arrowHeadPath2}*/}
            {/*        strokeWidth={strokeWidth}*/}
            {/*        strokeLinecap="round"*/}
            {/*        strokeLinejoin="round"*/}
            {/*    />*/}
            {/*)}*/}
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

function constructPath(path: PathEntity): string {
    const nodes = Object.values(path.nodes);
    const left = Math.min(...nodes.map((node) => node.point.x));
    const top = Math.min(...nodes.map((node) => node.point.y));

    let lastNodeId = "(nothing)";
    const commands: string[] = [];
    for (const [startNodeId, endNodeId] of path.edges) {
        const startNode = path.nodes[startNodeId];
        const endNode = path.nodes[endNodeId];

        if (startNodeId !== lastNodeId) {
            commands.push(
                `M${startNode.point.x - left} ${startNode.point.y - top}`,
            );
        }
        commands.push(`L${endNode.point.x - left} ${endNode.point.y - top}`);

        lastNodeId = endNodeId;
    }

    return commands.join(" ");
}
