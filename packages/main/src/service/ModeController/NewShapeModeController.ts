import type { Rect } from "../../geo/Rect";
import { getRectanglePath } from "../../geo/path";
import { randomId } from "../../lib/randomId";
import { Direction } from "../../model/Direction";
import type { Block, ShapeBlock } from "../../model/Page";
import { Transaction } from "../../model/Transaction";
import { createScaleTransformHandle } from "../../model/TransformHandle";
import type { AppStateStore } from "../../store/AppStateStore";
import type { CanvasStateStore } from "../../store/CanvasStateStore";
import type { SnapGuideStore } from "../../store/SnapGuideStore";
import type { ViewportStore } from "../../store/ViewportStore";
import type {
    AppController,
    PointerDownEventHandlerData,
} from "../AppController";
import type { GestureRecognizer } from "../GestureRecognizer";
import type { HistoryManager } from "../HistoryManager";
import { createTransformSession } from "../PointerEventSession/createTransformSession";
import { ModeController } from "./ModeController";

export class NewShapeModeController extends ModeController {
    constructor(
        private readonly canvasStateStore: CanvasStateStore,
        private readonly appStateStore: AppStateStore,
        private readonly controller: AppController,
        private readonly historyManager: HistoryManager,
        private readonly viewportStore: ViewportStore,
        private readonly snapGuideStore: SnapGuideStore,
        private readonly gestureRecognizer: GestureRecognizer,
    ) {
        super();
    }

    getType() {
        return "new-shape";
    }

    onBlockPointerDown(data: PointerDownEventHandlerData, _block: Block) {
        this.onCanvasPointerDown(data);
    }

    onCanvasPointerDown(data: PointerDownEventHandlerData): void {
        const shape = this.insertNewShape({
            x: data.x,
            y: data.y,
            width: 1,
            height: 1,
        });

        this.controller.setMode({ type: "select" });
        this.canvasStateStore.unselectAll();
        this.canvasStateStore.select(shape.id);

        this.gestureRecognizer.addSessionHandlers(
            data.pointerId,
            createTransformSession(
                this.historyManager,
                createScaleTransformHandle(
                    this.canvasStateStore,
                    this.viewportStore,
                    this.snapGuideStore,
                    Direction.bottomRight,
                ),
            ),
        );
    }

    private insertNewShape(rect: Rect): ShapeBlock {
        const shape: ShapeBlock = {
            type: "shape",
            id: randomId(),
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            label: "",
            textAlignX: this.appStateStore.getState().defaultTextAlignX,
            textAlignY: this.appStateStore.getState().defaultTextAlignY,
            colorId: this.appStateStore.getState().defaultColorId,
            fillMode: this.appStateStore.getState().defaultFillMode,
            strokeStyle: this.appStateStore.getState().defaultStrokeStyle,
            path: getRectanglePath(),
        };
        const transaction = new Transaction(
            this.canvasStateStore.getState().page,
        ).insertBlocks([shape]);
        this.canvasStateStore.setPage(transaction.commit());

        return shape;
    }
}
