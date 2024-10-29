import type { App } from "../../core/App";
import {
    type CanvasPointerEvent,
    type ModeChangeEvent,
    ModeController,
} from "../../core/ModeController";
import { SelectEntityModeController } from "../../core/SelectEntityModeController";

export class EditTextModeController extends ModeController {
    static readonly MODE_NAME = "edit-text";

    onRegistered(app: App) {
        app.keyboard.addBinding({
            key: "Escape",
            mode: [EditTextModeController.MODE_NAME],
            enableInEditTextMode: true,
            action: (app, ev) => {
                app.setMode(SelectEntityModeController.MODE_NAME);
            },
        });
    }

    onBeforeEnterMode(app: App, ev: ModeChangeEvent) {
        if (
            ev.oldMode === EditTextModeController.MODE_NAME &&
            ev.newMode === EditTextModeController.MODE_NAME
        ) {
            ev.abort();
        }
        app.historyManager.pause();
    }

    onAfterEnterMode(app: App, ev: ModeChangeEvent) {
        for (const entity of app.canvasStateStore.selectedEntities.get()) {
            app.entityHandle.getHandle(entity).onTextEditStart(entity, app);
        }
    }

    onBeforeExitMode(app: App, ev: ModeChangeEvent) {
        for (const entity of app.canvasStateStore.selectedEntities.get()) {
            app.entityHandle.getHandle(entity).onTextEditEnd(entity, app);
        }
        app.historyManager.resume();
    }

    onCanvasPointerDown(app: App, ev: CanvasPointerEvent): void {
        app.canvasStateStore.unselectAll();
        app.setMode(SelectEntityModeController.MODE_NAME);
        app.getModeController().onCanvasPointerDown(app, ev);
    }
}
