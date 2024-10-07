import type { CanvasStateStore } from "../../store/CanvasStateStore";
import type { HistoryManager } from "../HistoryManager";
import type { PointerEventSession } from "./PointerEventSession";

interface XYResizePointerEventSession extends PointerEventSession {
    type: "resize";
}

export function createXYResizePointerEventSession(
    blockIds: string[],
    originX: number,
    originY: number,
    canvasStateStore: CanvasStateStore,
    historyManager: HistoryManager,
): XYResizePointerEventSession {
    historyManager.pause();

    return {
        type: "resize",
        onPointerMove: (data) => {
            canvasStateStore.scaleBlocks(
                blockIds,
                (data.newX - originX) / (data.lastX - originX),
                (data.newY - originY) / (data.lastY - originY),
                originX,
                originY,
            );
        },
        onPointerUp: () => {
            historyManager.resume();
        },
    };
}
