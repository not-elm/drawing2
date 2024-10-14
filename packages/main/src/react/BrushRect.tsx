import { useStore } from "./hooks/useStore";
import { useApp } from "./useApp";

export function BrushRect() {
    const app = useApp();
    const { active, rect } = useStore(app.brushStore);
    if (!active) {
        return null;
    }

    return (
        <svg
            viewBox={`0 0 ${rect.width} ${rect.height}`}
            width={rect.width}
            height={rect.height}
            css={{
                overflow: "visible",
                position: "absolute",
                left: rect.left,
                top: rect.top,
            }}
        >
            <rect
                x={0}
                y={0}
                width={rect.width}
                height={rect.height}
                css={{
                    fill: "rgba(40, 40 ,40, 0.1)",
                }}
            />
        </svg>
    );
}
