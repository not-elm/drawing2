import { Line } from "../../geo/Line";
import { randomId } from "../../lib/randomId";
import type { Entity } from "../../model/Entity";
import type { PathEntity } from "../../model/PathEntity";
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

    onEntityPointerDown(data: PointerDownEventHandlerData, entity: Entity) {
        this.onCanvasPointerDown(data);
    }

    onCanvasPointerDown(data: PointerDownEventHandlerData): void {
        const pathEntity = this.insertNewPath(
            new Line({
                p1: data.point,
                p2: data.point.translate(1, 1),
            }),
        );

        this.controller.setMode({ type: "select" });
        this.canvasStateStore.unselectAll();
        this.canvasStateStore.select(pathEntity.id);

        this.gestureRecognizer.addSessionHandlers(
            data.pointerId,
            createMovePointSession(
                pathEntity,
                pathEntity.edges[0][1],
                this.canvasStateStore,
                this.historyManager,
            ),
        );
    }

    private insertNewPath(line: Line): PathEntity {
        const node1 = {
            id: randomId(),
            point: line.p1,
            endType: this.appStateStore.getState().defaultLineEndType1,
        };
        const node2 = {
            id: randomId(),
            point: line.p2,
            endType: this.appStateStore.getState().defaultLineEndType2,
        };
        const pathEntity: PathEntity = {
            type: "path",
            id: randomId(),
            nodes: {
                [node1.id]: node1,
                [node2.id]: node2,
            },
            edges: [[node1.id, node2.id]],
            colorId: this.appStateStore.getState().defaultColorId,
            strokeStyle: this.appStateStore.getState().defaultStrokeStyle,
        };
        const transaction = new Transaction(
            this.canvasStateStore.getState().page,
        );
        transaction.insertEntities([pathEntity]);

        this.canvasStateStore.setPage(transaction.commit());
        return pathEntity;
    }
}
