import type { AppController } from "../../core/AppController";
import type { GestureRecognizer } from "../../core/GestureRecognizer";
import type { HistoryManager } from "../../core/HistoryManager";
import {
    ModeController,
    type PointerDownEvent,
} from "../../core/ModeController/ModeController";
import { createMovePointSession } from "../../core/PointerEventSession/createMovePointSession";
import type { Entity } from "../../core/model/Entity";
import type { AppStateStore } from "../../core/store/AppStateStore";
import type { CanvasStateStore } from "../../core/store/CanvasStateStore";
import { PROPERTY_KEY_COLOR_ID } from "../../core/view/PropertySection/ColorPropertySection/ColorPropertySection";
import { colorPropertySection } from "../../instance";
import { Line } from "../../lib/geo/Line";
import { randomId } from "../../lib/randomId";
import type { PathEntity } from "./PathEntity";

export class NewPathModeController extends ModeController {
    constructor(
        private readonly canvasStateStore: CanvasStateStore,
        private readonly appStateStore: AppStateStore,
        private readonly appController: AppController,
        private readonly historyManager: HistoryManager,
        private readonly gestureRecognizer: GestureRecognizer,
    ) {
        super();
    }

    getType() {
        return "new-path";
    }

    onEntityPointerDown(data: PointerDownEvent, entity: Entity) {
        this.onCanvasPointerDown(data);
    }

    onCanvasPointerDown(data: PointerDownEvent): void {
        const pathEntity = this.insertNewPath(
            new Line({
                p1: data.point,
                p2: data.point.translate(1, 1),
            }),
        );

        this.appController.setMode({ type: "select" });
        this.canvasStateStore.unselectAll();
        this.canvasStateStore.select(pathEntity.id);

        this.gestureRecognizer.addSessionHandlers(
            data.pointerId,
            createMovePointSession(
                pathEntity,
                pathEntity.edges[0][1],
                this.appController,
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
            [PROPERTY_KEY_COLOR_ID]:
                colorPropertySection().getState().defaultColorId,
            strokeStyle: this.appStateStore.getState().defaultStrokeStyle,
        };

        this.appController.edit((tx) => {
            tx.insertEntities([pathEntity]);
        });
        return pathEntity;
    }
}
