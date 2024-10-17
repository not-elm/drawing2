import { Rect } from "../lib/geo/Rect";
import type { App } from "./App";
import type { BrushStore } from "./BrushStore";
import type { CanvasPointerEvent } from "./ModeController";

export function setupBrushSelectPointerEventHandlers(
    app: App,
    ev: CanvasPointerEvent,
    brushStore: BrushStore,
) {
    const originalSelectedEntityIds =
        app.canvasStateStore.getState().selectedEntityIds;

    brushStore.setActive(true);
    brushStore.setRect(new Rect({ p0: ev.point, p1: ev.point }));

    app.gestureRecognizer
        .addPointerMoveHandler(ev.pointerId, (app, ev) => {
            const rect = Rect.fromPoints(ev.startPoint, ev.point);
            brushStore.setRect(rect);

            const selectedEntityIds = new Set(originalSelectedEntityIds);
            for (const entity of app.canvasStateStore
                .getState()
                .page.entities.values()) {
                if (entity.isOverlapWith(rect)) {
                    selectedEntityIds.add(entity.props.id);
                }
            }

            app.canvasStateStore.setSelectedEntityIds([...selectedEntityIds]);
        })
        .addPointerUpHandler(ev.pointerId, () => {
            brushStore.setActive(false);
        });
}
