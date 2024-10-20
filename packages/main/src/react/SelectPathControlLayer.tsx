import { isSelectPathMode } from "../core/SelectPathModeController";
import { assert } from "../lib/assert";
import { useStore } from "./hooks/useStore";
import { useApp } from "./useApp";

export function SelectPathControlLayer() {
    const app = useApp();
    const appState = useStore(app.appStateStore);
    const canvasState = useStore(app.canvasStateStore);
    const viewport = useStore(app.viewportStore);
    if (!isSelectPathMode(appState.mode)) return null;

    const entityId = appState.mode.entityId;
    const entity = canvasState.entities.get(entityId);
    assert(entity !== undefined, `Entity not found: ${entityId}`);

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
            {entity.getEdges().map(([node1, node2]) => {
                const p1 = viewport.transform.apply(node1);
                const p2 = viewport.transform.apply(node2);
                return (
                    <line
                        key={`${node1.id}-${node2.id}`}
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        css={{
                            strokeWidth: 1,
                            stroke: "var(--color-selection)",
                        }}
                    />
                );
            })}
            {entity.getNodes().map((node) => {
                const point = viewport.transform.apply(node);
                return (
                    <circle
                        key={node.id}
                        cx={point.x}
                        cy={point.y}
                        r={5}
                        css={{
                            strokeWidth: 2,
                            stroke: "var(--color-selection)",
                            fill: "#fff",
                        }}
                    />
                );
            })}
        </svg>
    );
}
