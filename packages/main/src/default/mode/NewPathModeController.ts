import type { App } from "../../core/App";
import type { Entity } from "../../core/Entity";
import { Graph, GraphNode } from "../../core/Graph";
import { LinkToEdge, LinkToRect } from "../../core/Link";
import {
    type CanvasPointerEvent,
    ModeController,
} from "../../core/ModeController";
import type { Page } from "../../core/Page";
import { createSelectEntityMode } from "../../core/SelectEntityModeController";
import { setupMoveNodesPointerEventHandlers } from "../../core/setupMoveNodesPointerEventHandlers";
import { Line } from "../../lib/geo/Line";
import { translate } from "../../lib/geo/TransformMatrix";
import { randomId } from "../../lib/randomId";
import { testHitEntities } from "../../lib/testHitEntities";
import {
    PROPERTY_KEY_CORNER_RADIUS,
    PathEntity,
} from "../entity/PathEntity/PathEntity";
import { PROPERTY_KEY_COLOR_ID } from "../property/Colors";
import { PROPERTY_KEY_FILL_STYLE } from "../property/FillStyle";
import { PROPERTY_KEY_STROKE_STYLE } from "../property/StrokeStyle";
import { PROPERTY_KEY_STROKE_WIDTH } from "../property/StrokeWidth";

export class NewPathModeController extends ModeController {
    onRegistered(app: App) {
        app.keyboard.addBinding({
            key: "a",
            // To avoid conflicts with 'Select All' binding
            metaKey: false,
            ctrlKey: false,
            action: (app, ev) => {
                app.setMode({ type: "new-path" });
            },
        });
        app.keyboard.addBinding({
            key: "l",
            action: (app, ev) => {
                app.setMode({ type: "new-path" });
            },
        });
        app.keyboard.addBinding({
            key: "Escape",
            mode: ["new-path"],
            action: (app, ev) => {
                app.setMode(createSelectEntityMode(new Set()));
            },
        });
    }

    onCanvasPointerDown(app: App, ev: CanvasPointerEvent): void {
        app.historyManager.pause();
        const hit = testHitEntities(
            app.canvasStateStore.getState(),
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
            registerLinkToRect(
                app,
                pathEntity,
                pathEntity.getNodes()[0],
                target,
            );
        }

        app.setMode(createSelectEntityMode(new Set(pathEntity.props.id)));
        app.unselectAll();
        app.select(pathEntity.props.id);

        setupMoveNodesPointerEventHandlers(app, ev, pathEntity, [
            pathEntity.getNodes()[1].id,
        ]);
    }

    private insertNewPath(app: App, line: Line): PathEntity {
        const node1 = new GraphNode(randomId(), line.p1.x, line.p1.y);
        const node2 = new GraphNode(randomId(), line.p2.x, line.p2.y);
        const graph = Graph.create();
        graph.addEdge(node1, node2);

        const pathEntity = new PathEntity(
            {
                id: randomId(),
                [PROPERTY_KEY_COLOR_ID]: app.defaultPropertyStore
                    .getState()
                    .getOrDefault(PROPERTY_KEY_COLOR_ID, 0),
                [PROPERTY_KEY_STROKE_STYLE]: app.defaultPropertyStore
                    .getState()
                    .getOrDefault(PROPERTY_KEY_STROKE_STYLE, "solid"),
                [PROPERTY_KEY_STROKE_WIDTH]: app.defaultPropertyStore
                    .getState()
                    .getOrDefault(PROPERTY_KEY_STROKE_WIDTH, 2),
                [PROPERTY_KEY_FILL_STYLE]: app.defaultPropertyStore
                    .getState()
                    .getOrDefault(PROPERTY_KEY_FILL_STYLE, "none"),
                [PROPERTY_KEY_CORNER_RADIUS]: 0,
            },
            graph,
        );

        app.canvasStateStore.edit((draft) => {
            draft.setEntity(pathEntity);
        });
        return pathEntity;
    }
}

export function registerLinkToRect(
    app: App,
    nodeOwner: Entity,
    node: GraphNode,
    target: Entity,
) {
    if (nodeOwner.props.id === target.props.id) {
        return;
    }
    if (isOwnedLabel(app.canvasStateStore.getState(), nodeOwner, target)) {
        return;
    }

    app.canvasStateStore.edit((draft) =>
        draft.addLink(
            new LinkToRect(
                randomId(),
                nodeOwner.props.id,
                node.id,
                target.props.id,
            ),
        ),
    );
}

function isOwnedLabel(page: Page, nodeOwner: Entity, label: Entity): boolean {
    return page.links
        .getByEntityId(nodeOwner.props.id)
        .some(
            (link) =>
                link instanceof LinkToEdge && link.entityId === label.props.id,
        );
}
