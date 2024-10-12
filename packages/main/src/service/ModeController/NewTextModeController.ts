import type { Rect } from "../../geo/Rect";
import { randomId } from "../../lib/randomId";
import type { Block, TextBlock } from "../../model/Page";
import { Transaction } from "../../model/Transaction";
import type { AppStateStore } from "../../store/AppStateStore";
import type { CanvasStateStore } from "../../store/CanvasStateStore";
import type {
    AppController,
    PointerDownEventHandlerData,
} from "../AppController";
import { ModeController } from "./ModeController";

export class NewTextModeController extends ModeController {
    constructor(
        private readonly canvasStateStore: CanvasStateStore,
        private readonly appStateStore: AppStateStore,
        private readonly controller: AppController,
    ) {
        super();
    }

    getType() {
        return "new-text";
    }

    onBlockPointerDown(data: PointerDownEventHandlerData, _block: Block) {
        this.onCanvasPointerDown(data);
    }

    onCanvasPointerDown(data: PointerDownEventHandlerData): void {
        const text = this.insertNewText({
            x: data.x,
            y: data.y,
            width: 1,
            height: 1,
        });

        this.controller.setMode({
            type: "edit-text",
            blockId: text.id,
        });

        // To leave focus at the new text block
        data.preventDefault();
    }

    private insertNewText(rect: Rect): TextBlock {
        const text: TextBlock = {
            id: randomId(),
            type: "text",
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            content: "",
            textAlignment:
                this.appStateStore.getState().defaultTextBlockTextAlignment,
            sizingMode: "content",
        };

        this.canvasStateStore.setPage(
            new Transaction(this.canvasStateStore.getState().page)
                .insertBlocks([text])
                .commit(),
        );

        return text;
    }
}
