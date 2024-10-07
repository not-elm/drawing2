import type { CanvasStateStore } from "../../store/CanvasStateStore";
import { testHitEntities } from "../../store/HoverStateStore";
import type { ViewportStore } from "../../store/ViewportStore";
import type { HistoryManager } from "../HistoryManager";
import type { PointerEventSession } from "./PointerEventSession";

interface MoveBlockPointerEventSession extends PointerEventSession {
    type: "move";
}

export function createMoveBlockPointerEventSession(
    blockId: string,
    shiftKey: boolean,
    canvasStateStore: CanvasStateStore,
    historyManager: HistoryManager,
): MoveBlockPointerEventSession {
    if (!shiftKey) {
        canvasStateStore.unselectAll();
    }
    canvasStateStore.select(blockId);
    historyManager.pause();

    return {
        type: "move",
        onPointerMove: (data) => {
            canvasStateStore.moveBlocks(
                canvasStateStore.getState().selectedBlockIds,
                data.newX - data.lastX,
                data.newY - data.lastY,
            );
        },
        onPointerUp: () => {
            historyManager.resume();
        },
    };
}

export function createMoveSelectedBlocksPointerEventSession(
    x: number,
    y: number,
    shiftKey: boolean,
    canvasStateStore: CanvasStateStore,
    viewportStore: ViewportStore,
    historyManager: HistoryManager,
): PointerEventSession {
    const hitResult = testHitEntities(
        canvasStateStore.getState().page,
        x,
        y,
        viewportStore.getState().scale,
    );
    historyManager.pause();

    return {
        type: "move",
        onPointerMove: (data) => {
            canvasStateStore.moveBlocks(
                canvasStateStore.getState().selectedBlockIds,
                data.newX - data.lastX,
                data.newY - data.lastY,
            );
        },
        onPointerUp: () => {
            historyManager.resume();
        },
        onClick: () => {
            if (hitResult.blocks.length > 0) {
                if (shiftKey) {
                    canvasStateStore.toggleSelect(
                        hitResult.blocks[0].target.id,
                    );
                } else {
                    canvasStateStore.unselectAll();
                    canvasStateStore.select(hitResult.blocks[0].target.id);
                }
            }
            historyManager.resume();
        },
    };
}
