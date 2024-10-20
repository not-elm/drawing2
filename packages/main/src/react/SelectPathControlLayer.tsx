import type { ReactNode } from "react";
import {
    SelectPathModeController,
    isSelectPathMode,
} from "../core/SelectPathModeController";
import { assert } from "../lib/assert";
import { useStore } from "./hooks/useStore";
import { useApp } from "./useApp";

export function SelectPathControlLayer() {
    const app = useApp();

    const modeController = app.getModeController();
    if (!(modeController instanceof SelectPathModeController)) return null;

    return <SelectPathControlLayerInner modeController={modeController} />;
}

export function SelectPathControlLayerInner({
    modeController,
}: {
    modeController: SelectPathModeController;
}) {
    const app = useApp();
    const appState = useStore(app.appStateStore);
    const canvasState = useStore(app.canvasStateStore);
    const viewport = useStore(app.viewportStore);
    const { highlightedItemIds, highlightCenterOfEdgeHandle } = useStore(
        modeController.store,
    );
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
            {entity.getEdges().map((edge) => {
                const highlighted = highlightedItemIds.has(edge.id);

                const p1 = viewport.transform.apply(edge.p0);
                const p2 = viewport.transform.apply(edge.p1);

                const nodes: ReactNode[] = [];
                nodes.push(
                    <line
                        key={`${edge.p0.id}-${edge.p1.id}`}
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        css={{
                            strokeWidth: highlighted ? 3 : 1,
                            stroke: "var(--color-selection)",
                        }}
                    />,
                );

                if (highlighted) {
                    if (highlightCenterOfEdgeHandle) {
                        nodes.push(
                            <circle
                                key={`${edge.p0.id}-${edge.p1.id}-center`}
                                cx={(p1.x + p2.x) / 2}
                                cy={(p1.y + p2.y) / 2}
                                r={5}
                                css={{
                                    strokeWidth: 2,
                                    stroke: "var(--color-selection)",
                                    fill: "#fff",
                                }}
                            />,
                        );
                    } else {
                        nodes.push(
                            <circle
                                key={`${edge.p0.id}-${edge.p1.id}-center`}
                                cx={(p1.x + p2.x) / 2}
                                cy={(p1.y + p2.y) / 2}
                                r={3}
                                css={{
                                    fill: "var(--color-selection)",
                                }}
                            />,
                        );
                    }
                }

                return nodes;
            })}
            {entity.getNodes().map((node) => {
                const point = viewport.transform.apply(node);
                const highlighted = highlightedItemIds.has(node.id);

                return (
                    <circle
                        key={node.id}
                        cx={point.x}
                        cy={point.y}
                        r={5}
                        css={{
                            strokeWidth: highlighted ? 3 : 1,
                            stroke: "var(--color-selection)",
                            fill: "#fff",
                        }}
                    />
                );
            })}
        </svg>
    );
}
