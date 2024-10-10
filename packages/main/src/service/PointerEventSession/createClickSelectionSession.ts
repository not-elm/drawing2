import type { CanvasStateStore } from "../../store/CanvasStateStore";
import type { PointerEventHandlers } from "./PointerEventSession";

export function createClickSelectionSession(
    canvasStateStore: CanvasStateStore,
): PointerEventHandlers {
    return {
        onPointerUp(data) {
            if (data.isShortClick && !data.shiftKey) {
                canvasStateStore.unselectAll();
            }
        },
    };
}
