import { entityHandleMap } from "../../instance";
import { Rect } from "../../lib/geo/Rect";
import type { BrushStore } from "../store/BrushStore";
import type { CanvasStateStore } from "../store/CanvasStateStore";
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
                if (entityHandleMap().isOverlapWith(entity, rect)) {
                    selectedEntityIds.add(entity.id);
                }
            }

            canvasStateStore.setSelectedEntityIds([...selectedEntityIds]);
        },
        onPointerUp: () => {
            brushStore.setActive(false);
        },
    };
}
