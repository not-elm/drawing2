import type { App } from "../../core/App";
import {
    type CanvasPointerEvent,
    type Mode,
    type ModeChangeEvent,
    ModeController,
} from "../../core/ModeController";
import { createSelectEntityMode } from "../../core/SelectEntityModeController";
import { assert } from "../../lib/assert";

export class EditTextModeController extends ModeController {
    static createMode(entityId: string): Mode {
        return { type: "edit-text", entityId };
    }

    onRegistered(app: App) {
        app.keyboard.addBinding({
            key: "Escape",
            mode: ["edit-text"],
            action: (app, ev) => {
                const mode = app.appStateStore.getState().mode;
                assert(isEditTextMode(mode), `Invalid mode: ${mode.type}`);
                app.setMode(createSelectEntityMode(new Set(mode.entityId)));
            },
        });
    }

    onBeforeEnterMode(app: App, ev: ModeChangeEvent) {
        if (
            ev.oldMode.type === "edit-text" &&
            ev.newMode.type === "edit-text" &&
            ev.oldMode.entityId === ev.newMode.entityId
        ) {
            ev.abort();
        }
        app.historyManager.pause();
    }

    onAfterEnterMode(app: App, ev: ModeChangeEvent) {
        const newMode = ev.newMode;
        assert(isEditTextMode(newMode));

        const entity = app.canvasStateStore
            .getState()
            .entities.get(newMode.entityId);
        assert(entity !== undefined, `Entity ${newMode.entityId} not found`);

        entity.onTextEditStart(app);
    }

    onBeforeExitMode(app: App, ev: ModeChangeEvent) {
        const oldMode = ev.oldMode;
        assert(isEditTextMode(oldMode));

        const entity = app.canvasStateStore
            .getState()
            .entities.get(oldMode.entityId);
        assert(entity !== undefined, `Entity ${oldMode.entityId} not found`);

        app.historyManager.resume();
        entity.onTextEditEnd(app);
    }

    onCanvasPointerDown(app: App, ev: CanvasPointerEvent): void {
        app.setMode(createSelectEntityMode(new Set()));
        app.getModeController().onCanvasPointerDown(app, ev);
    }
}

export interface EditTextMode extends Mode {
    type: "edit-text";
    entityId: string;
}

export function isEditTextMode(mode: Mode): mode is EditTextMode {
    return mode.type === "edit-text";
}
