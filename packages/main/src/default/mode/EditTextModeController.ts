import type { App } from "../../core/App";
import type { Entity } from "../../core/Entity";
import {
    type Mode,
    type ModeChangeEvent,
    ModeController,
    type PointerDownEvent,
} from "../../core/ModeController";
import type { SelectModeController } from "./select/SelectModeController";

export class EditTextModeController extends ModeController {
    constructor(
        private readonly app: App,
        private readonly selectModeController: SelectModeController,
    ) {
        super();
    }

    static createMode(entityId: string): Mode {
        return { type: "edit-text", entityId };
    }

    getType() {
        return "edit-text";
    }

    onBeforeEnterMode(ev: ModeChangeEvent) {
        if (
            ev.oldMode.type === "edit-text" &&
            ev.newMode.type === "edit-text" &&
            ev.oldMode.entityId === ev.newMode.entityId
        ) {
            ev.abort();
        }
    }

    onEntityPointerDown(data: PointerDownEvent, entity: Entity) {
        this.app.setMode({ type: "select" });
        this.selectModeController.onEntityPointerDown(data, entity);
    }

    onCanvasPointerDown(data: PointerDownEvent): void {
        this.app.setMode({ type: "select" });
        this.selectModeController.onCanvasPointerDown(data);
    }
}

export interface EditTextMode extends Mode {
    type: "edit-text";
    entityId: string;
}

export function isEditTextMode(mode: Mode): mode is EditTextMode {
    return mode.type === "edit-text";
}
