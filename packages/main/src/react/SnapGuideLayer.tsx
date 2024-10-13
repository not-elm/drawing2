import { useController } from "./ControllerProvider";
import { useStore } from "./hooks/useStore";

export function SnapGuideLayer() {
    const controller = useController();
    const viewport = useStore(controller.viewportStore);
    const { guide } = useStore(controller.snapGuideStore);
    if (guide === null) return null;

    return (
        <svg
            viewBox={`0 0 ${viewport.rect.width} ${viewport.rect.height}`}
            css={{
                position: "absolute",
                inset: 0,
            }}
        >
            {guide.points.map((point, i) => (
                <circle
                    key={`${point.x},${point.y},${i}`}
                    r={4}
                    cx={point.x - viewport.rect.left}
                    cy={point.y - viewport.rect.top}
                    css={{ fill: "#f00" }}
                />
            ))}

            {guide.lines.map((line, i) => (
                <line
                    key={`${line.x1},${line.y1},${line.x2},${line.y2},${i}`}
                    x1={line.x1 - viewport.rect.left}
                    y1={line.y1 - viewport.rect.top}
                    x2={line.x2 - viewport.rect.left}
                    y2={line.y2 - viewport.rect.top}
                    css={{
                        stroke: "#f00",
                        strokeWidth: 1,
                    }}
                />
            ))}
        </svg>
    );
}
