import type { CanvasStateStore } from "../../store/CanvasStateStore";
import type { HistoryManager } from "../HistoryManager";
import type { PointerEventSession } from "./PointerEventSession";

export interface YResizePointerEventSession extends PointerEventSession {
    type: "resize";
}

export function createYResizePointerEventSession(
    blockIds: string[],
    originY: number,
    canvasStateStore: CanvasStateStore,
    historyManager: HistoryManager,
): YResizePointerEventSession {
    historyManager.pause();

    return {
        type: "resize",
        onPointerMove: (data) => {
            canvasStateStore.scaleBlocks(
                blockIds,
                1,
                (data.newY - originY) / (data.lastY - originY),
                0,
                originY,
            );
        },
        onPointerUp: () => {
            historyManager.resume();
        },
    };
}
