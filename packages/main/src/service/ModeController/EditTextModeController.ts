import { assert } from "../../lib/assert";
import type { Mode } from "../../model/Mode";
import type { Block } from "../../model/Page";
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

        const blockId = mode.blockId;
        const block = this.canvasStateStore.getState().page.blocks[blockId];
        assert(block !== undefined, `Block ${blockId} is not found`);
        if (block.type === "text" && block.content === "") {
            this.canvasStateStore.setPage(
                new Transaction(this.canvasStateStore.getState().page)
                    .deleteBlocks([blockId])
                    .commit(),
            );
        }
    }

    onBlockPointerDown(data: PointerDownEventHandlerData, block: Block) {
        this.controller.setMode({ type: "select" });
        this.selectModeController.onBlockPointerDown(data, block);
    }

    onCanvasPointerDown(data: PointerDownEventHandlerData): void {
        this.controller.setMode({ type: "select" });
        this.selectModeController.onCanvasPointerDown(data);
    }
}
