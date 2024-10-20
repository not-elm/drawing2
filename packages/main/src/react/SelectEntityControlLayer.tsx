import {
    SelectEntityModeController,
    getSelectedEntities,
    getSelectionRect,
    isSelectEntityMode,
} from "../core/SelectEntityModeController";
import { Line } from "../lib/geo/Line";
import type { Point } from "../lib/geo/Point";
import { Rect } from "../lib/geo/Rect";
import type { TransformMatrix } from "../lib/geo/TransformMatrix";
import { useStore } from "./hooks/useStore";
import { useApp } from "./useApp";

export function SelectEntityControlLayer() {
    const app = useApp();

    const modeController = app.getModeController();
    if (!(modeController instanceof SelectEntityModeController)) return null;

    return <SelectEntityControlLayerInner modeController={modeController} />;
}

function SelectEntityControlLayerInner({
    modeController,
}: {
    modeController: SelectEntityModeController;
}) {
    const app = useApp();
    const appState = useStore(app.appStateStore);
    const viewport = useStore(app.viewportStore);
    const canvasState = useStore(app.canvasStateStore);
    const { visibleCornerRoundHandles } = useStore(modeController.brushStore);
    if (!isSelectEntityMode(appState.mode)) return null;

    const entities = getSelectedEntities(appState.mode, canvasState);
    const selectionRect = getSelectionRect(appState.mode, canvasState);
    if (selectionRect === null) return null;

    const rect = viewport.transform.apply(selectionRect);

    return (
        <svg
            viewBox="0 0 1 1"
            width={1}
            height={1}
            css={{
                position: "absolute",
                overflow: "visible",
                left: 0,
                top: 0,
            }}
        >
            <rect
                css={{
                    stroke: "var(--color-selection)",
                    fill: "none",
                }}
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                strokeWidth={3}
            />
            {entities.map((entity) => (
                <path
                    key={entity.props.id}
                    css={{
                        stroke: "var(--color-selection)",
                        fill: "none",
                    }}
                    d={convertGeometryToPathDefinition(
                        entity.getOutline(),
                        viewport.transform,
                    )}
                    strokeWidth={1}
                />
            ))}
            <rect
                x={rect.left - 4}
                y={rect.top - 4}
                width={8}
                height={8}
                fill="#fff"
                stroke="var(--color-selection)"
            />
            <rect
                x={rect.right - 4}
                y={rect.top - 4}
                width={8}
                height={8}
                fill="#fff"
                stroke="var(--color-selection)"
            />
            <rect
                x={rect.right - 4}
                y={rect.bottom - 4}
                width={8}
                height={8}
                fill="#fff"
                stroke="var(--color-selection)"
            />
            <rect
                x={rect.left - 4}
                y={rect.bottom - 4}
                width={8}
                height={8}
                fill="#fff"
                stroke="var(--color-selection)"
            />
            {visibleCornerRoundHandles.map((handle) => {
                const position = viewport.transform.apply(
                    handle.handlePosition,
                );

                return (
                    <circle
                        key={handle.node.id}
                        cx={position.x}
                        cy={position.y}
                        r={5}
                        fill="#fff"
                        stroke="var(--color-selection)"
                    />
                );
            })}
        </svg>
    );
}

export function convertGeometryToPathDefinition(
    geos: (Rect | Line | Point)[],
    viewportTransform: TransformMatrix,
): string {
    const ds: string[] = [];
    for (const g of geos) {
        if (g instanceof Rect) {
            const rect = viewportTransform.apply(g);
            ds.push(
                `M${rect.left},${rect.top} h${rect.width} v${
                    rect.height
                } h${-rect.width} v${-rect.height}`,
            );
        }
        if (g instanceof Line) {
            const p1 = viewportTransform.apply(g.p1);
            const p2 = viewportTransform.apply(g.p2);

            ds.push(`M${p1.x},${p1.y} L${p2.x},${p2.y}`);
        }
    }

    return ds.join("");
}
