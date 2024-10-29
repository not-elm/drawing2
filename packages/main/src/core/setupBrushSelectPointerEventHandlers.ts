import type { App } from "./App";
import type { CanvasPointerEvent } from "./ModeController";

import type { Cell } from "./cell/ICell";
import { Rect } from "./shape/Shape";

export function setupBrushSelectPointerEventHandlers(
    app: App,
    ev: CanvasPointerEvent,
    brushRect: Cell<Rect | null>,
) {
    const originalSelectedEntityIds = app.canvas.selectedEntityIds.get();

    brushRect.set(new Rect(ev.point, ev.point));

    app.gesture
        .addPointerMoveHandler(ev.pointerId, (app, ev) => {
            const rect = Rect.fromPoints(ev.startPoint, ev.point);
            brushRect.set(rect);

            const selectedEntityIds = new Set(originalSelectedEntityIds);
            for (const entity of app.canvas.page.get().entities.values()) {
                if (app.entityHandle.getShape(entity).isOverlapWith(rect)) {
                    selectedEntityIds.add(entity.id);
                }
            }

            app.canvas.setSelectedEntityIds(selectedEntityIds);
        })
        .addPointerUpHandler(ev.pointerId, () => {
            brushRect.set(null);
        });
}
