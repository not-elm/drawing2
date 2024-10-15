import type { BrushStore } from "../default/mode/select/BrushStore";
import { Rect } from "../lib/geo/Rect";
import type { CanvasStateStore } from "./CanvasStateStore";
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
                if (entity.isOverlapWith(rect)) {
                    selectedEntityIds.add(entity.props.id);
                }
            }

            canvasStateStore.setSelectedEntityIds([...selectedEntityIds]);
        },
        onPointerUp: () => {
            brushStore.setActive(false);
        },
    };
}
