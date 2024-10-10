import type { CanvasStateStore } from "../../store/CanvasStateStore";
import type { PointerEventHandlers } from "./PointerEventSession";

export function createClickBlockSession(
    blockId: string,
    canvasStateStore: CanvasStateStore,
): PointerEventHandlers {
    let isBlockSelected = false;

    return {
        onPointerDown(data) {
            isBlockSelected = canvasStateStore
                .getState()
                .selectedBlockIds.includes(blockId);
            if (!data.shiftKey && !isBlockSelected) {
                canvasStateStore.unselectAll();
            }

            canvasStateStore.select(blockId);
        },
        onPointerUp: (data) => {
            if (data.isShortClick) {
                if (!data.shiftKey) {
                    canvasStateStore.unselectAll();
                    canvasStateStore.select(blockId);
                }
                if (isBlockSelected && data.shiftKey) {
                    canvasStateStore.unselect(blockId);
                }
            }
        },
    };
}
