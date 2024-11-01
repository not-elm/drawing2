import { useApp } from "./hooks/useApp";
import { useCell } from "./hooks/useCell";

export function SnapGuideLayer() {
    const app = useApp();
    const viewport = useCell(app.viewport);
    const snapGuideMap = useCell(app.snapGuideMap);
    const guides = [...snapGuideMap.guides.values()];

    return (
        <svg
            viewBox={`0 0 ${viewport.rect.width} ${viewport.rect.height}`}
            css={{
                position: "absolute",
                inset: 0,
            }}
        >
            {guides.map((guide) =>
                guide.points.map((point, i) => {
                    const x = point.x - viewport.rect.left;
                    const y = point.y - viewport.rect.top;

                    return (
                        <path
                            key={`${x},${y},${i}`}
                            d={`M${x - 2} ${y - 2}L${x + 2} ${y + 2}M${x + 2} ${
                                y - 2
                            }L${x - 2} ${y + 2}`}
                            stroke="#f00"
                            strokeWidth={1}
                        />
                    );
                }),
            )}

            {guides.map((guide) =>
                guide.lines.map((line, i) => {
                    return (
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
                    );
                }),
            )}
        </svg>
    );
}
