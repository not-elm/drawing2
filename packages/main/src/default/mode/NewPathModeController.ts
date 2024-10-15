import type { App } from "../../core/App";
import type { AppStateStore } from "../../core/AppStateStore";
import type { CanvasStateStore } from "../../core/CanvasStateStore";
import type { Entity } from "../../core/Entity";
import type { GestureRecognizer } from "../../core/GestureRecognizer";
import type { HistoryManager } from "../../core/HistoryManager";
import {
    ModeController,
    type PointerDownEvent,
} from "../../core/ModeController";
import type { PathNode } from "../../core/Path";
import { createMovePointSession } from "../../core/createMovePointSession";
import { Line } from "../../lib/geo/Line";
import { randomId } from "../../lib/randomId";
import { PathEntity } from "../entity/PathEntity/PathEntity";
import { PROPERTY_KEY_COLOR_ID } from "../property/Colors";
import { PROPERTY_KEY_STROKE_STYLE } from "../property/StrokeStyle";

export class NewPathModeController extends ModeController {
    constructor(
        private readonly canvasStateStore: CanvasStateStore,
        private readonly appStateStore: AppStateStore,
        private readonly app: App,
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

        this.app.setMode({ type: "select" });
        this.canvasStateStore.unselectAll();
        this.canvasStateStore.select(pathEntity.props.id);

        this.gestureRecognizer.addSessionHandlers(
            data.pointerId,
            createMovePointSession(
                pathEntity,
                pathEntity.props.edges[0][1],
                this.app,
                this.historyManager,
            ),
        );
    }

    private insertNewPath(line: Line): PathEntity {
        const node1: PathNode = {
            id: randomId(),
            point: line.p1,
        };
        const node2: PathNode = {
            id: randomId(),
            point: line.p2,
        };
        const pathEntity = new PathEntity({
            id: randomId(),
            nodes: {
                [node1.id]: node1,
                [node2.id]: node2,
            },
            edges: [[node1.id, node2.id]],
            [PROPERTY_KEY_COLOR_ID]: this.app.defaultPropertyStore
                .getState()
                .getOrDefault(PROPERTY_KEY_COLOR_ID, 0),
            [PROPERTY_KEY_STROKE_STYLE]: this.app.defaultPropertyStore
                .getState()
                .getOrDefault(PROPERTY_KEY_STROKE_STYLE, "solid"),
        });

        this.app.edit((tx) => {
            tx.insertEntities([pathEntity]);
        });
        return pathEntity;
    }
}
