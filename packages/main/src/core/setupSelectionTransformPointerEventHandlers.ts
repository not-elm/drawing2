import type { App } from "./App";
import type { CanvasPointerEvent } from "./ModeController";
import type { SelectionTransformController } from "./SelectionTransformController";

export function setupSelectionTransformPointerEventHandlers(
    app: App,
    ev: CanvasPointerEvent,
    transformController: SelectionTransformController,
) {
    app.historyManager.pause();

    app.gestureRecognizer
        .addPointerMoveHandler(ev.pointerId, (app, ev) => {
            transformController.move(ev.point, {
                constraint: ev.shiftKey,
                snap: true,
            });
        })
        .addPointerUpHandler(ev.pointerId, () => {
            transformController.complete();
            app.historyManager.resume();
        });
}
