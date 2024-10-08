import { Transaction } from "../../model/Transaction";
import type { CanvasStateStore } from "../../store/CanvasStateStore";
import { testHitEntities } from "../../store/HoverStateStore";
import type { ViewportStore } from "../../store/ViewportStore";
import type { HistoryManager } from "../HistoryManager";
import type { PointerEventSession } from "./PointerEventSession";

interface MovePointerEventSession extends PointerEventSession {
    type: "move";
    lastDX: number;
    lastDY: number;
}

export function createMovePointerEventSession(
    x: number,
    y: number,
    shiftKey: boolean,
    canvasStateStore: CanvasStateStore,
    viewportStore: ViewportStore,
    historyManager: HistoryManager,
): MovePointerEventSession {
    const hitResult = testHitEntities(
        canvasStateStore.getState().page,
        x,
        y,
        viewportStore.getState().scale,
    );
    historyManager.pause();

    const blockId: string | undefined = hitResult.blocks[0]?.target?.id;
    let isBlockSelected: boolean;
    if (blockId !== undefined) {
        isBlockSelected = canvasStateStore
            .getState()
            .selectedBlockIds.includes(blockId);
    } else {
        isBlockSelected = false;
    }

    if (!shiftKey && !isBlockSelected) {
        canvasStateStore.unselectAll();
    }

    if (blockId !== undefined) {
        canvasStateStore.select(blockId);
    }

    return {
        type: "move",
        lastDX: 0,
        lastDY: 0,
        onPointerMove(data) {
            let dx = data.newX - data.startX;
            let dy = data.newY - data.startY;

            if (data.shiftKey) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    dy = 0;
                } else {
                    dx = 0;
                }
            }

            const transaction = new Transaction(
                canvasStateStore.getState().page,
            );

            transaction
                .moveBlocks(
                    [...canvasStateStore.getState().selectedBlockIds],
                    -this.lastDX,
                    -this.lastDY,
                )
                .moveBlocks(
                    [...canvasStateStore.getState().selectedBlockIds],
                    dx,
                    dy,
                );

            canvasStateStore.setPage(transaction.commit());
            this.lastDX = dx;
            this.lastDY = dy;
        },
        onPointerUp: () => {
            historyManager.resume();
        },
        onClick: (data) => {
            if (!shiftKey) {
                canvasStateStore.unselectAll();
                canvasStateStore.select(blockId);
            }
            if (isBlockSelected && data.shiftKey) {
                canvasStateStore.unselect(blockId);
            }

            historyManager.resume();
        },
    };
}
