import { useController } from "./ControllerProvider";
import { useStore } from "./hooks/useStore";

export function BrushRect() {
    const controller = useController();
    const { active, rect } = useStore(controller.brushStore);
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
                left: rect.x,
                top: rect.y,
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
