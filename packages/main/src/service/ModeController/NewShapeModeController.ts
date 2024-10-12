import type { Rect } from "../../geo/Rect";
import { getRectanglePath } from "../../geo/path";
import { randomId } from "../../lib/randomId";
import { Direction } from "../../model/Direction";
import {
    type Block,
    type PointEntity,
    PointKey,
    type ShapeBlock,
} from "../../model/Page";
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
        const [shape, p1, p2] = this.insertNewShape({
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

    private insertNewShape(rect: Rect): [ShapeBlock, PointEntity, PointEntity] {
        const p1: PointEntity = {
            type: "point",
            id: randomId(),
            x: rect.x,
            y: rect.y,
        };
        const p2: PointEntity = {
            type: "point",
            id: randomId(),
            x: rect.x + rect.width,
            y: rect.y + rect.height,
        };
        const shape: ShapeBlock = {
            type: "shape",
            id: randomId(),
            x: p1.x,
            y: p1.y,
            width: 0,
            height: 0,
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y,
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
        )
            .insertBlocks([shape])
            .insertPoints([p1, p2])
            .addDependencies([
                {
                    id: randomId(),
                    type: "blockToPoint",
                    pointKey: PointKey.SHAPE_P1,
                    from: p1.id,
                    to: shape.id,
                },
                {
                    id: randomId(),
                    type: "blockToPoint",
                    pointKey: PointKey.SHAPE_P2,
                    from: p2.id,
                    to: shape.id,
                },
            ]);
        this.canvasStateStore.setPage(transaction.commit());

        return [shape, p1, p2];
    }
}
