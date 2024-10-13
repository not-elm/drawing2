import { Rect } from "../../geo/Rect";
import { getRectanglePath } from "../../geo/path";
import { randomId } from "../../lib/randomId";
import { Direction } from "../../model/Direction";
import type { Entity } from "../../model/Entity";
import type { ShapeEntity } from "../../model/ShapeEntity";
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

    onEntityPointerDown(data: PointerDownEventHandlerData, entity: Entity) {
        this.onCanvasPointerDown(data);
    }

    onCanvasPointerDown(data: PointerDownEventHandlerData): void {
        const shape = this.insertNewShape(
            new Rect({
                p0: data.point,
                p1: data.point.translate(1, 1),
            }),
        );

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

    private insertNewShape(rect: Rect): ShapeEntity {
        const shape: ShapeEntity = {
            type: "shape",
            id: randomId(),
            rect,
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
        ).insertEntities([shape]);
        this.canvasStateStore.setPage(transaction.commit());

        return shape;
    }
}
