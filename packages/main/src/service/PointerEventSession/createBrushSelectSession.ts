import { Rect } from "../../geo/Rect";
import { getBoundingRect } from "../../model/Entity";
import { getEdgesFromPath } from "../../model/PathEntity";
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
            brushStore.setRect(
                new Rect({
                    p0: data.start,
                    p1: data.start,
                }),
            );
        },
        onPointerMove: (data) => {
            const rect = Rect.fromPoints(data.start, data.new);
            brushStore.setRect(rect);

            const selectedEntityIds = new Set(originalSelectedEntityIds);
            for (const entity of Object.values(
                canvasStateStore.getState().page.entities,
            )) {
                switch (entity.type) {
                    case "shape":
                    case "text": {
                        if (rect.isOverlappedWith(getBoundingRect(entity))) {
                            selectedEntityIds.add(entity.id);
                        }
                        break;
                    }
                    case "path": {
                        if (
                            getEdgesFromPath(entity).some((line) =>
                                rect.isOverlappedWith(line),
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
