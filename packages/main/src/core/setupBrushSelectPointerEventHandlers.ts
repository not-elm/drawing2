import { assert } from "../lib/assert";
import type { App } from "./App";
import type { CanvasPointerEvent } from "./ModeController";
import { SelectEntityModeController } from "./SelectEntityModeController";

import type { MutableAtom } from "./atom/Atom";
import { Rect } from "./shape/Shape";

export function setupBrushSelectPointerEventHandlers(
    app: App,
    ev: CanvasPointerEvent,
    brushRectAtom: MutableAtom<Rect | null>,
) {
    const { mode } = app.state.get();
    assert(
        mode === SelectEntityModeController.MODE_NAME,
        `Invalid mode: ${mode}`,
    );

    const originalSelectedEntityIds =
        app.canvasStateStore.selectedEntityIds.get();

    brushRectAtom.set(new Rect(ev.point, ev.point));

    app.gestureRecognizer
        .addPointerMoveHandler(ev.pointerId, (app, ev) => {
            const rect = Rect.fromPoints(ev.startPoint, ev.point);
            brushRectAtom.set(rect);

            const selectedEntityIds = new Set(originalSelectedEntityIds);
            for (const entity of app.canvasStateStore.page
                .get()
                .entities.values()) {
                if (app.entityHandle.getShape(entity).isOverlapWith(rect)) {
                    selectedEntityIds.add(entity.id);
                }
            }

            app.canvasStateStore.setSelectedEntityIds(selectedEntityIds);
        })
        .addPointerUpHandler(ev.pointerId, () => {
            brushRectAtom.set(null);
        });
}
