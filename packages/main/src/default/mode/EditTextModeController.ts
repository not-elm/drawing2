import type { App } from "../../core/App";
import {
    type CanvasPointerEvent,
    type ModeChangeEvent,
    ModeController,
} from "../../core/ModeController";

export class EditTextModeController extends ModeController {
    onRegistered(app: App) {
        app.keyboard.addBinding({
            key: "Escape",
            mode: ["edit-text"],
            enableInEditTextMode: true,
            action: (app, ev) => {
                app.setMode("select-entity");
            },
        });
    }

    onBeforeEnterMode(app: App, ev: ModeChangeEvent) {
        if (ev.oldMode === "edit-text" && ev.newMode === "edit-text") {
            ev.abort();
        }
        app.historyManager.pause();
    }

    onAfterEnterMode(app: App, ev: ModeChangeEvent) {
        for (const entity of app.canvasStateStore
            .getState()
            .getSelectedEntities()) {
            entity.onTextEditStart(app);
        }
    }

    onBeforeExitMode(app: App, ev: ModeChangeEvent) {
        for (const entity of app.canvasStateStore
            .getState()
            .getSelectedEntities()) {
            entity.onTextEditEnd(app);
        }
        app.historyManager.resume();
    }

    onCanvasPointerDown(app: App, ev: CanvasPointerEvent): void {
        app.canvasStateStore.unselectAll();
        app.setMode("select-entity");
        app.getModeController().onCanvasPointerDown(app, ev);
    }
}
