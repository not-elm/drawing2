import { NewPathModeController } from "../default/mode/NewPathModeController";
import { useApp } from "./hooks/useApp";
import { useCell } from "./hooks/useCell";

export function NewPathControlLayer() {
    const app = useApp();
    const controller = app.getModeControllerByClass(NewPathModeController);
    const mode = useCell(app.mode);
    const viewport = useCell(app.viewport);
    const { nodes, lastNodePosition, pointerPosition } = useCell(
        controller.controlLayerData,
    );
    if (mode !== NewPathModeController.type) return null;

    return (
        <svg
            viewBox="0 0 1 1"
            css={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 1,
                height: 1,
                overflow: "visible",
            }}
        >
            {nodes.map((node) => {
                const point = viewport.transform.apply(node);
                // const highlighted = highlightedItemIds.has(node.id);

                return (
                    <circle
                        key={node.id}
                        cx={point.x}
                        cy={point.y}
                        r={5}
                        css={{
                            strokeWidth: 1,
                            stroke: "var(--color-selection)",
                            fill: "#fff",

                            // ...(highlighted && {
                            //     strokeWidth: 1,
                            //     stroke: "var(--color-selection-hover)",
                            //     fill: "#fff",
                            // }),
                        }}
                    />
                );
            })}
            {lastNodePosition !== null && (
                <line
                    x1={viewport.transform.apply(lastNodePosition).x}
                    y1={viewport.transform.apply(lastNodePosition).y}
                    x2={viewport.transform.apply(pointerPosition).x}
                    y2={viewport.transform.apply(pointerPosition).y}
                    css={{
                        strokeWidth: 1,
                        stroke: "var(--color-selection)",
                    }}
                />
            )}
        </svg>
    );
}
