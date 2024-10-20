import { assert } from "../lib/assert";
import { Rect } from "../lib/geo/Rect";
import type { App } from "./App";
import type { BrushStore } from "./BrushStore";
import type { CanvasPointerEvent } from "./ModeController";
import { isSelectEntityMode } from "./SelectEntityModeController";

export function setupBrushSelectPointerEventHandlers(
    app: App,
    ev: CanvasPointerEvent,
    brushStore: BrushStore,
) {
    const mode = app.appStateStore.getState().mode;
    assert(isSelectEntityMode(mode), `Invalid mode: ${mode.type}`);

    const originalSelectedEntityIds = mode.entityIds;

    brushStore.setActive(true);
    brushStore.setRect(new Rect({ p0: ev.point, p1: ev.point }));

    app.gestureRecognizer
        .addPointerMoveHandler(ev.pointerId, (app, ev) => {
            const rect = Rect.fromPoints(ev.startPoint, ev.point);
            brushStore.setRect(rect);

            const selectedEntityIds = new Set(originalSelectedEntityIds);
            for (const entity of app.canvasStateStore
                .getState()
                .entities.values()) {
                if (entity.isOverlapWith(rect)) {
                    selectedEntityIds.add(entity.props.id);
                }
            }

            app.setSelectedEntityIds([...selectedEntityIds]);
        })
        .addPointerUpHandler(ev.pointerId, () => {
            brushStore.setActive(false);
        });
}
