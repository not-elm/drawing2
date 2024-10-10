import { isRectOverlapWithLine, isRectOverlapWithRect } from "../../geo/Rect";
import type { BrushStore } from "../../store/BrushStore";
import type { CanvasStateStore } from "../../store/CanvasStateStore";
import type { PointerEventHandlers } from "./PointerEventSession";

export function createBrushSelectSession(
    canvasStateStore: CanvasStateStore,
    brushStore: BrushStore,
): PointerEventHandlers {
    const originalSelectedBlockIds =
        canvasStateStore.getState().selectedBlockIds;

    return {
        onPointerDown: (data) => {
            brushStore.setActive(true);
            brushStore.setRect({
                x: data.startX,
                y: data.startY,
                width: 0,
                height: 0,
            });
        },
        onPointerMove: (data) => {
            const rect = {
                x: Math.min(data.startX, data.newX),
                y: Math.min(data.startY, data.newY),
                width: Math.abs(data.newX - data.startX),
                height: Math.abs(data.newY - data.startY),
            };
            brushStore.setRect(rect);

            const selectedBlockIds = new Set(originalSelectedBlockIds);
            for (const block of Object.values(
                canvasStateStore.getState().page.blocks,
            )) {
                switch (block.type) {
                    case "shape":
                    case "text": {
                        if (isRectOverlapWithRect(rect, block)) {
                            selectedBlockIds.add(block.id);
                        }
                        break;
                    }
                    case "line": {
                        if (isRectOverlapWithLine(rect, block)) {
                            selectedBlockIds.add(block.id);
                        }
                        break;
                    }
                }
            }

            canvasStateStore.setSelectedBlockIds([...selectedBlockIds]);
        },
        onPointerUp: () => {
            brushStore.setActive(false);
        },
    };
}
