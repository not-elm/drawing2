import type { Line } from "../../geo/Line";
import { randomId } from "../../lib/randomId";
import type { Block, PathBlock } from "../../model/Page";
import { Transaction } from "../../model/Transaction";
import type { AppStateStore } from "../../store/AppStateStore";
import type { CanvasStateStore } from "../../store/CanvasStateStore";
import type { ViewportStore } from "../../store/ViewportStore";
import type {
    AppController,
    PointerDownEventHandlerData,
} from "../AppController";
import type { GestureRecognizer } from "../GestureRecognizer";
import type { HistoryManager } from "../HistoryManager";
import { createMovePointSession } from "../PointerEventSession/createMovePointSession";
import { ModeController } from "./ModeController";

export class NewPathModeController extends ModeController {
    constructor(
        private readonly canvasStateStore: CanvasStateStore,
        private readonly appStateStore: AppStateStore,
        private readonly controller: AppController,
        private readonly historyManager: HistoryManager,
        private readonly viewportStore: ViewportStore,
        private readonly gestureRecognizer: GestureRecognizer,
    ) {
        super();
    }

    getType() {
        return "new-path";
    }

    onBlockPointerDown(data: PointerDownEventHandlerData, _block: Block) {
        this.onCanvasPointerDown(data);
    }

    onCanvasPointerDown(data: PointerDownEventHandlerData): void {
        const pathBlock = this.insertNewPath({
            x1: data.x,
            y1: data.y,
            x2: data.x + 1,
            y2: data.y + 1,
        });

        this.controller.setMode({ type: "select" });
        this.canvasStateStore.unselectAll();
        this.canvasStateStore.select(pathBlock.id);

        this.gestureRecognizer.addSessionHandlers(
            data.pointerId,
            createMovePointSession(
                pathBlock,
                "p2",
                this.canvasStateStore,
                this.viewportStore,
                this.historyManager,
            ),
        );
    }

    private insertNewPath(line: Line): PathBlock {
        const pathBlock: PathBlock = {
            type: "path",
            id: randomId(),
            x1: line.x1,
            y1: line.y1,
            x2: line.x2,
            y2: line.y2,
            endType1: this.appStateStore.getState().defaultLineEndType1,
            endType2: this.appStateStore.getState().defaultLineEndType2,
            colorId: this.appStateStore.getState().defaultColorId,
            strokeStyle: this.appStateStore.getState().defaultStrokeStyle,
        };
        const transaction = new Transaction(
            this.canvasStateStore.getState().page,
        );
        transaction.insertBlocks([pathBlock]);

        this.canvasStateStore.setPage(transaction.commit());
        return pathBlock;
    }
}
