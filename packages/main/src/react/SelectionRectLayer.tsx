import { MoveEntityModeController } from "../core/mode/MoveEntityModeController";
import { ResizeEntityModeController } from "../core/mode/ResizeEntityModeController";
import { SelectByBrushModeController } from "../core/mode/SelectByBrushModeController";
import { SelectEntityModeController } from "../core/mode/SelectEntityModeController";
import { useApp } from "./hooks/useApp";
import { useCell } from "./hooks/useCell";

export function SelectionRectLayer() {
    const app = useApp();
    const mode = useCell(app.mode);
    const viewport = useCell(app.viewport);
    const selectionRect = useCell(app.canvas.selectionRect);

    if (
        !(
            mode === SelectEntityModeController.type ||
            mode === ResizeEntityModeController.type ||
            mode === MoveEntityModeController.type ||
            mode === SelectByBrushModeController.type
        )
    ) {
        return null;
    }

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
        </svg>
    );
}
