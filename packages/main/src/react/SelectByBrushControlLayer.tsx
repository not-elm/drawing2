import { SelectByBrushModeController } from "../core/mode/SelectByBrushModeController";
import { useApp } from "./hooks/useApp";
import { useCell } from "./hooks/useCell";

export function SelectByBrushControlLayer() {
    const app = useApp();
    const modeController = app.getModeControllerByClass(
        SelectByBrushModeController,
    );
    const brushRect = useCell(modeController.brushRect);
    const viewport = useCell(app.viewport);

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
