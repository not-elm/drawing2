import type { PointerEventSessionData } from "../service/GestureRecognizer";

export function SelectorRect({ data }: { data: PointerEventSessionData }) {
    const x = Math.min(data.startX, data.lastX);
    const y = Math.min(data.startY, data.lastY);
    const width = Math.abs(data.startX - data.lastX);
    const height = Math.abs(data.startY - data.lastY);

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
            css={{
                overflow: "visible",
                position: "absolute",
                left: x,
                top: y,
            }}
        >
            <rect
                x={0}
                y={0}
                width={width}
                height={height}
                css={{
                    fill: "rgba(40, 40 ,40, 0.1)",
                }}
            />
        </svg>
    );
}
