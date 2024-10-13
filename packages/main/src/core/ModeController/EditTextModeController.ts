import type { AppController } from "../AppController";
import type { Entity } from "../model/Entity";
import type { Mode } from "../model/Mode";
import {
    type ModeChangeEvent,
    ModeController,
    type PointerDownEvent,
} from "./ModeController";
import type { SelectModeController } from "./SelectModeController";

export class EditTextModeController extends ModeController {
    constructor(
        private readonly appController: AppController,
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
        this.appController.setMode({ type: "select" });
        this.selectModeController.onEntityPointerDown(data, entity);
    }

    onCanvasPointerDown(data: PointerDownEvent): void {
        this.appController.setMode({ type: "select" });
        this.selectModeController.onCanvasPointerDown(data);
    }
}
