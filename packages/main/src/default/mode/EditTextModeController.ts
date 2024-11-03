import type { App } from "../../core/App";
import {
    type CanvasPointerEvent,
    type ModeChangeEvent,
    ModeController,
} from "../../core/ModeController";
import { SelectEntityModeController } from "../../core/mode/SelectEntityModeController";

export class EditTextModeController extends ModeController {
    static readonly type = "edit-text";

    onRegistered(app: App) {
        app.keyboard.addBinding({
            key: "Escape",
            mode: [EditTextModeController.type],
            enableInEditTextMode: true,
            action: (app, ev) => {
                app.setMode(SelectEntityModeController.type);
            },
        });
    }

    onBeforeEnterMode(app: App, ev: ModeChangeEvent) {
        if (
            ev.oldMode === EditTextModeController.type &&
            ev.newMode === EditTextModeController.type
        ) {
            ev.abort();
        }

        app.history.addCheckpoint();
    }

    onAfterEnterMode(app: App, ev: ModeChangeEvent) {
        for (const entity of app.canvas.selectedEntities.get()) {
            app.entityHandle.getHandle(entity).onTextEditStart(entity, app);
        }
    }

    onBeforeExitMode(app: App, ev: ModeChangeEvent) {
        for (const entity of app.canvas.selectedEntities.get()) {
            app.entityHandle.getHandle(entity).onTextEditEnd(entity, app);
        }
    }

    onPointerDown(app: App, ev: CanvasPointerEvent): void {
        app.setMode(SelectEntityModeController.type);
        app.getModeController().onPointerDown(app, ev);
    }
}
