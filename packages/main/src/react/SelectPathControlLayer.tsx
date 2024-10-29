import type { ReactNode } from "react";
import { SelectPathModeController } from "../core/SelectPathModeController";
import { useAtom } from "./hooks/useAtom";
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
    const appState = useAtom(app.state);
    const viewport = useAtom(app.viewportStore.state);
    const { edges, nodes, highlightedItemIds, highlightCenterOfEdgeHandle } =
        modeController.computeControlLayerData(app, appState.pointerPosition);
    const selectedEdgeIds = useAtom(modeController.selectedEdgeIds);
    const selectedNodeIds = useAtom(modeController.selectedNodeIds);
    if (appState.mode !== SelectPathModeController.MODE_NAME) return null;

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
            {edges.map((edge) => {
                const highlighted = highlightedItemIds.has(edge.id);
                const selected = selectedEdgeIds.has(edge.id);

                const p1 = viewport.transform.apply(edge.p1);
                const p2 = viewport.transform.apply(edge.p2);

                const nodes: ReactNode[] = [];
                nodes.push(
                    <line
                        key={`${edge.p1.id}-${edge.p2.id}`}
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        css={{
                            strokeWidth: 1,
                            stroke: "var(--color-selection)",

                            ...(highlighted && {
                                strokeWidth: 1,
                                stroke: "var(--color-selection-hover)",
                            }),
                            ...(selected && {
                                strokeWidth: 3,
                                stroke: "var(--color-selection)",
                            }),
                        }}
                    />,
                );

                if (highlighted && highlightCenterOfEdgeHandle) {
                    nodes.push(
                        <circle
                            key={`${edge.p1.id}-${edge.p2.id}-center`}
                            cx={(p1.x + p2.x) / 2}
                            cy={(p1.y + p2.y) / 2}
                            r={5}
                            css={{
                                strokeWidth: 1,
                                stroke: "var(--color-selection-hover)",
                                fill: "#fff",
                            }}
                        />,
                    );
                }

                return nodes;
            })}
            {nodes.map((node) => {
                const point = viewport.transform.apply(node);
                const highlighted = highlightedItemIds.has(node.id);
                const selected = selectedNodeIds.has(node.id);

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

                            ...(highlighted && {
                                strokeWidth: 1,
                                stroke: "var(--color-selection-hover)",
                                fill: "#fff",
                            }),
                            ...(selected && {
                                strokeWidth: 2,
                                fill: "var(--color-selection)",
                                stroke: "#fff",
                            }),
                        }}
                    />
                );
            })}
        </svg>
    );
}
