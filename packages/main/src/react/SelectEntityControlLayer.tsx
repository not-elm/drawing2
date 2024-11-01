import { SelectEntityModeController } from "../core/mode/SelectEntityModeController";
import { useCell } from "./hooks/useCell";
import { useApp } from "./useApp";

export function SelectEntityControlLayer() {
    const app = useApp();
    const mode = useCell(app.mode);
    if (mode !== SelectEntityModeController.type) return null;

    return <SelectEntityControlLayerInner />;
}

function SelectEntityControlLayerInner() {
    const app = useApp();
    const modeController = app.getModeControllerByClass(
        SelectEntityModeController,
    );
    const visibleCornerRoundHandles = useCell(modeController.controlLayerData);
    const viewport = useCell(app.viewport);
    const selectionRect = useCell(app.canvas.selectionRect);

    const transformedSelectionRect =
        selectionRect === null ? null : viewport.transform.apply(selectionRect);

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
        </svg>
    );
}
