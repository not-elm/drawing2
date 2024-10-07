import type { CanvasStateStore } from "../../store/CanvasStateStore";
import type { HistoryManager } from "../HistoryManager";
import type { PointerEventSession } from "./PointerEventSession";

export interface ResizePointerEventSession extends PointerEventSession {
    type: "resize";

    // Unit vector of the initial direction. Used for adjusting the direction.
    ix: number;
    iy: number;

    // The last position with adjusting
    adjustedLastX: number;
    adjustedLastY: number;
}

export function createResizePointerEventSession(
    blockIds: string[],
    originX: number,
    originY: number,
    startX: number,
    startY: number,
    mode: "X" | "Y" | "XY",
    canvasStateStore: CanvasStateStore,
    historyManager: HistoryManager,
): ResizePointerEventSession {
    historyManager.pause();

    const norm = Math.hypot(startX - originX, startY - originY);
    const ix = (startX - originX) / norm;
    const iy = (startY - originY) / norm;

    return {
        type: "resize",
        ix,
        iy,
        adjustedLastX: startX,
        adjustedLastY: startY,
        onPointerMove(data) {
            let newX = data.newX;
            let newY = data.newY;
            if (data.shiftKey) {
                const dx = newX - originX;
                const dy = newY - originY;
                const norm = dx * this.ix + dy * this.iy;
                newX = norm * this.ix + originX;
                newY = norm * this.iy + originY;
            }
            let scaleX = (newX - originX) / (this.adjustedLastX - originX);
            let scaleY = (newY - originY) / (this.adjustedLastY - originY);
            this.adjustedLastX = newX;
            this.adjustedLastY = newY;

            if (mode === "X") {
                scaleY = 1;
            }
            if (mode === "Y") {
                scaleX = 1;
            }

            canvasStateStore.scaleBlocks(
                blockIds,
                scaleX,
                scaleY,
                originX,
                originY,
            );
        },
        onPointerUp() {
            historyManager.resume();
        },
    };
}
