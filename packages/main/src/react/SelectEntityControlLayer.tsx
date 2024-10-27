import { SelectEntityModeController } from "../core/SelectEntityModeController";
import { Line } from "../core/shape/Line";
import { Rect, type Shape } from "../core/shape/Shape";
import type { TransformMatrix } from "../core/shape/TransformMatrix";
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
    const { brushRect } = useStore(modeController.store);
    const visibleCornerRoundHandles = modeController.computeControlLayerData(
        app,
        appState.pointerPosition,
    );
    if (appState.mode !== SelectEntityModeController.MODE_NAME) return null;

    const entities = app.canvasStateStore.getState().getSelectedEntities();
    const selectionRect = app.canvasStateStore.getState().getSelectionRect();

    const transformedSelectionRect =
        selectionRect === null ? null : viewport.transform.apply(selectionRect);
    const transformedBrushRect =
        brushRect === null ? null : viewport.transform.apply(brushRect);

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
            {transformedSelectionRect !== null && (
                <rect
                    css={{
                        stroke: "var(--color-selection)",
                        fill: "none",
                    }}
                    x={transformedSelectionRect.left}
                    y={transformedSelectionRect.top}
                    width={transformedSelectionRect.width}
                    height={transformedSelectionRect.height}
                    strokeWidth={3}
                />
            )}
            {entities.map((entity) => (
                <path
                    key={entity.props.id}
                    css={{
                        stroke: "var(--color-selection)",
                        fill: "none",
                    }}
                    d={convertGeometryToPathDefinition(
                        entity.getShape(), // TODO: これはOutlineじゃない!
                        viewport.transform,
                    )}
                    strokeWidth={1}
                />
            ))}
            {transformedSelectionRect !== null && (
                <>
                    <rect
                        x={transformedSelectionRect.left - 4}
                        y={transformedSelectionRect.top - 4}
                        width={8}
                        height={8}
                        fill="#fff"
                        stroke="var(--color-selection)"
                    />
                    <rect
                        x={transformedSelectionRect.right - 4}
                        y={transformedSelectionRect.top - 4}
                        width={8}
                        height={8}
                        fill="#fff"
                        stroke="var(--color-selection)"
                    />
                    <rect
                        x={transformedSelectionRect.right - 4}
                        y={transformedSelectionRect.bottom - 4}
                        width={8}
                        height={8}
                        fill="#fff"
                        stroke="var(--color-selection)"
                    />
                    <rect
                        x={transformedSelectionRect.left - 4}
                        y={transformedSelectionRect.bottom - 4}
                        width={8}
                        height={8}
                        fill="#fff"
                        stroke="var(--color-selection)"
                    />
                </>
            )}
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
            {transformedBrushRect !== null && (
                <rect
                    x={transformedBrushRect.left}
                    y={transformedBrushRect.top}
                    width={transformedBrushRect.width}
                    height={transformedBrushRect.height}
                    css={{
                        fill: "rgba(40, 40 ,40, 0.1)",
                    }}
                />
            )}
        </svg>
    );
}

export function convertGeometryToPathDefinition(
    shape: Shape,
    viewportTransform: TransformMatrix,
): string {
    const ds: string[] = [];
    if (shape instanceof Rect) {
        const rect = viewportTransform.apply(shape);
        ds.push(
            `M${rect.left},${rect.top} h${rect.width} v${
                rect.height
            } h${-rect.width} v${-rect.height}`,
        );
    }
    if (shape instanceof Line) {
        const p1 = viewportTransform.apply(shape.p1);
        const p2 = viewportTransform.apply(shape.p2);

        ds.push(`M${p1.x},${p1.y} L${p2.x},${p2.y}`);
    }

    return ds.join("");
}
