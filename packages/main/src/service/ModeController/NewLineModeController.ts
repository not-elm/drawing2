import type { Line } from "../../geo/Line";
import { randomId } from "../../lib/randomId";
import {
    type Block,
    type LineBlock,
    type PointEntity,
    PointKey,
} from "../../model/Page";
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

export class NewLineModeController extends ModeController {
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
        return "new-line";
    }

    onBlockPointerDown(data: PointerDownEventHandlerData, _block: Block) {
        this.onCanvasPointerDown(data);
    }

    onCanvasPointerDown(data: PointerDownEventHandlerData): void {
        const [lineBlock, p1, p2] = this.insertNewLine({
            x1: data.x,
            y1: data.y,
            x2: data.x + 1,
            y2: data.y + 1,
        });

        this.controller.setMode({ type: "select" });
        this.canvasStateStore.unselectAll();
        this.canvasStateStore.select(lineBlock.id);

        this.gestureRecognizer.addSessionHandlers(
            data.pointerId,
            createMovePointSession(
                p2,
                this.canvasStateStore,
                this.viewportStore,
                this.historyManager,
            ),
        );
    }

    private insertNewLine(line: Line): [LineBlock, PointEntity, PointEntity] {
        const p1: PointEntity = {
            type: "point",
            id: randomId(),
            x: line.x1,
            y: line.y1,
        };
        const p2: PointEntity = {
            type: "point",
            id: randomId(),
            x: line.x2,
            y: line.y2,
        };
        const lineBlock: LineBlock = {
            type: "line",
            id: randomId(),
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y,
            endType1: this.appStateStore.getState().defaultLineEndType1,
            endType2: this.appStateStore.getState().defaultLineEndType2,
            colorId: this.appStateStore.getState().defaultColorId,
            strokeStyle: this.appStateStore.getState().defaultStrokeStyle,
        };
        const transaction = new Transaction(
            this.canvasStateStore.getState().page,
        );
        transaction
            .insertBlocks([lineBlock])
            .insertPoints([p1, p2])
            .addDependencies([
                {
                    id: randomId(),
                    type: "blockToPoint",
                    pointKey: PointKey.LINE_P1,
                    from: p1.id,
                    to: lineBlock.id,
                },
                {
                    id: randomId(),
                    type: "blockToPoint",
                    pointKey: PointKey.LINE_P2,
                    from: p2.id,
                    to: lineBlock.id,
                },
            ]);

        this.canvasStateStore.setPage(transaction.commit());
        return [lineBlock, p1, p2];
    }
}
