import { isRectOverlapWithLine, isRectOverlapWithRect } from "../../geo/Rect";
import { getEdgesFromPath } from "../../model/Page";
import type { BrushStore } from "../../store/BrushStore";
import type { CanvasStateStore } from "../../store/CanvasStateStore";
import type { PointerEventHandlers } from "./PointerEventSession";

export function createBrushSelectSession(
    canvasStateStore: CanvasStateStore,
    brushStore: BrushStore,
): PointerEventHandlers {
    const originalSelectedEntityIds =
        canvasStateStore.getState().selectedEntityIds;

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

            const selectedEntityIds = new Set(originalSelectedEntityIds);
            for (const entity of Object.values(
                canvasStateStore.getState().page.entities,
            )) {
                switch (entity.type) {
                    case "shape":
                    case "text": {
                        if (isRectOverlapWithRect(rect, entity)) {
                            selectedEntityIds.add(entity.id);
                        }
                        break;
                    }
                    case "path": {
                        if (
                            getEdgesFromPath(entity).some((line) =>
                                isRectOverlapWithLine(rect, line),
                            )
                        ) {
                            selectedEntityIds.add(entity.id);
                        }
                        break;
                    }
                }
            }

            canvasStateStore.setSelectedEntityIds([...selectedEntityIds]);
        },
        onPointerUp: () => {
            brushStore.setActive(false);
        },
    };
}
