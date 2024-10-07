import type { CanvasStateStore } from "../../store/CanvasStateStore";
import type { HistoryManager } from "../HistoryManager";
import type { PointerEventSession } from "./PointerEventSession";

export interface XResizePointerEventSession extends PointerEventSession {
    type: "resize";
}

export function createXResizePointerEventSession(
    blockIds: string[],
    originX: number,
    canvasStateStore: CanvasStateStore,
    historyManager: HistoryManager,
): XResizePointerEventSession {
    historyManager.pause();

    return {
        type: "resize",
        onPointerMove: (data) => {
            canvasStateStore.scaleBlocks(
                blockIds,
                (data.newX - originX) / (data.lastX - originX),
                1,
                originX,
                0,
            );
        },
        onPointerUp: () => {
            historyManager.resume();
        },
    };
}
