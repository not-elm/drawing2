import { assert } from "../../lib/assert";
import type { Entity } from "../../model/Entity";
import type { Mode } from "../../model/Mode";
import { Transaction } from "../../model/Transaction";
import type { CanvasStateStore } from "../../store/CanvasStateStore";
import type {
    AppController,
    PointerDownEventHandlerData,
} from "../AppController";
import { ModeController } from "./ModeController";
import type { SelectModeController } from "./SelectModeController";

export class EditTextModeController extends ModeController {
    constructor(
        private readonly controller: AppController,
        private readonly selectModeController: SelectModeController,
        private readonly canvasStateStore: CanvasStateStore,
    ) {
        super();
    }

    getType() {
        return "edit-text";
    }

    onBeforeExitMode(mode: Mode) {
        assert(mode.type === "edit-text", `Unexpected mode ${mode.type}`);

        const entityId = mode.entityId;
        const entity = this.canvasStateStore.getState().page.entities[entityId];
        assert(entity !== undefined, `Entity ${entityId} is not found`);
        if (entity.type === "text" && entity.content === "") {
            this.canvasStateStore.setPage(
                new Transaction(this.canvasStateStore.getState().page)
                    .deleteEntities([entityId])
                    .commit(),
            );
        }
    }

    onEntityPointerDown(data: PointerDownEventHandlerData, entity: Entity) {
        this.controller.setMode({ type: "select" });
        this.selectModeController.onEntityPointerDown(data, entity);
    }

    onCanvasPointerDown(data: PointerDownEventHandlerData): void {
        this.controller.setMode({ type: "select" });
        this.selectModeController.onCanvasPointerDown(data);
    }
}
