import {useController} from "./ControllerProvider";
import {useStore} from "./hooks/useStore";

export function SnapGuideLayer() {
    const controller = useController();
    const viewport = useStore(controller.viewportStore);
    const { guide } = useStore(controller.snapGuideStore);
    if (guide === null) return null;

    return (
        <svg
            viewBox={`0 0 ${viewport.width} ${viewport.height}`}
            css={{
                position: "absolute",
                inset: 0,
            }}
        >
            {guide.points.map((point, i) => (
                <circle
                    key={`${point.x},${point.y},${i}`}
                    r={4}
                    cx={point.x - viewport.x}
                    cy={point.y - viewport.y}
                    css={{ fill: "#f00" }}
                />
            ))}

            {guide.lines.map((line, i) => (
                <line
                    key={`${line.x1},${line.y1},${line.x2},${line.y2},${i}`}
                    x1={line.x1 - viewport.x}
                    y1={line.y1 - viewport.y}
                    x2={line.x2 - viewport.x}
                    y2={line.y2 - viewport.y}
                    css={{
                        stroke: "#f00",
                        strokeWidth: 1,
                    }}
                />
            ))}
        </svg>
    );
}