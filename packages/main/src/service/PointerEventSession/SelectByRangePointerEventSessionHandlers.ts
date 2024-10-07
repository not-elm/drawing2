import { isRectOverlapWithLine, isRectOverlapWithRect } from "../../geo/Rect";
import type { CanvasStateStore } from "../../store/CanvasStateStore";
import type { PointerEventSession } from "./PointerEventSession";

interface SelectByRangePointerEventSessionHandlers extends PointerEventSession {
    type: "selector";
}

export function createSelectByRangePointerEventSession(
    canvasStateStore: CanvasStateStore,
): SelectByRangePointerEventSessionHandlers {
    const originalSelectedBlockIds =
        canvasStateStore.getState().selectedBlockIds;

    return {
        type: "selector",
        onPointerMove: (data) => {
            const selectionRect = {
                x: Math.min(data.startX, data.newX),
                y: Math.min(data.startY, data.newY),
                width: Math.abs(data.newX - data.startX),
                height: Math.abs(data.newY - data.startY),
            };
            const selectedBlockIds = new Set(originalSelectedBlockIds);

            for (const block of Object.values(
                canvasStateStore.getState().page.blocks,
            )) {
                switch (block.type) {
                    case "shape":
                    case "text": {
                        if (isRectOverlapWithRect(selectionRect, block)) {
                            selectedBlockIds.add(block.id);
                        }
                        break;
                    }
                    case "line": {
                        if (isRectOverlapWithLine(selectionRect, block)) {
                            selectedBlockIds.add(block.id);
                        }
                        break;
                    }
                }
            }

            canvasStateStore.setSelectedBlockIds([...selectedBlockIds]);
        },
    };
}
