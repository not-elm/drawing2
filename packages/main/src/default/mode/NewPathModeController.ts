import type { App } from "../../core/App";
import { LinkToRect } from "../../core/Link";
import {
    type CanvasPointerEvent,
    ModeController,
} from "../../core/ModeController";
import type { PathNode } from "../../core/Path";
import { setupMovePointPointerEventHandlers } from "../../core/setupMovePointPointerEventHandlers";
import { Line } from "../../lib/geo/Line";
import { translate } from "../../lib/geo/TransformMatrix";
import { randomId } from "../../lib/randomId";
import { testHitEntities } from "../../lib/testHitEntities";
import { PathEntity } from "../entity/PathEntity/PathEntity";
import { PROPERTY_KEY_COLOR_ID } from "../property/Colors";
import { PROPERTY_KEY_STROKE_STYLE } from "../property/StrokeStyle";
import { PROPERTY_KEY_STROKE_WIDTH } from "../property/StrokeWidth";

export class NewPathModeController extends ModeController {
    onCanvasPointerDown(app: App, ev: CanvasPointerEvent): void {
        app.historyManager.pause();
        const hit = testHitEntities(
            app.canvasStateStore.getState().page,
            ev.point,
            app.viewportStore.getState().scale,
        );

        const pathEntity = this.insertNewPath(
            app,
            new Line({
                p1: ev.point,
                p2: translate(1, 1).apply(ev.point),
            }),
        );

        if (hit.entities.length > 0) {
            const { target } = hit.entities[0];
            app.canvasStateStore.edit((draft) =>
                draft.addLink(
                    new LinkToRect(
                        randomId(),
                        pathEntity.props.id,
                        pathEntity.getNodes()[0].id,
                        target.props.id,
                    ),
                ),
            );
        }

        app.setMode({ type: "select" });
        app.canvasStateStore.unselectAll();
        app.canvasStateStore.select(pathEntity.props.id);

        setupMovePointPointerEventHandlers(
            app,
            ev,
            pathEntity,
            pathEntity.getNodes()[1].id,
        );
    }

    private insertNewPath(app: App, line: Line): PathEntity {
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
            nodes: new Map([
                [node1.id, node1],
                [node2.id, node2],
            ]),
            edges: [[node1.id, node2.id]],
            [PROPERTY_KEY_COLOR_ID]: app.defaultPropertyStore
                .getState()
                .getOrDefault(PROPERTY_KEY_COLOR_ID, 0),
            [PROPERTY_KEY_STROKE_STYLE]: app.defaultPropertyStore
                .getState()
                .getOrDefault(PROPERTY_KEY_STROKE_STYLE, "solid"),
            [PROPERTY_KEY_STROKE_WIDTH]: app.defaultPropertyStore
                .getState()
                .getOrDefault(PROPERTY_KEY_STROKE_WIDTH, 2),
        });

        app.canvasStateStore.edit((draft) => {
            draft.setEntity(pathEntity);
        });
        return pathEntity;
    }
}
