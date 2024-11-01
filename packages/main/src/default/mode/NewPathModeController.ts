import type { App } from "../../core/App";
import type { Entity } from "../../core/Entity";
import { LinkToEdge, LinkToRect } from "../../core/Link";
import {
    type CanvasPointerEvent,
    ModeController,
} from "../../core/ModeController";
import type { Page } from "../../core/Page";
import { MoveNodeModeController } from "../../core/mode/MoveNodeModeController";
import { SelectEntityModeController } from "../../core/mode/SelectEntityModeController";
import { SelectPathModeController } from "../../core/mode/SelectPathModeController";
import { Graph, GraphNode } from "../../core/shape/Graph";
import { Line } from "../../core/shape/Line";
import { translate } from "../../core/shape/TransformMatrix";
import { randomId } from "../../lib/randomId";
import { testHitEntities } from "../../lib/testHitEntities";
import {
    PROPERTY_KEY_ARROW_HEAD_NODE_IDS,
    PROPERTY_KEY_CORNER_RADIUS,
    type PathEntity,
    PathEntityHandle,
} from "../entity/PathEntity/PathEntity";
import { PROPERTY_KEY_COLOR_ID } from "../property/Colors";
import { PROPERTY_KEY_FILL_STYLE } from "../property/FillStyle";
import { PROPERTY_KEY_STROKE_STYLE } from "../property/StrokeStyle";
import { PROPERTY_KEY_STROKE_WIDTH } from "../property/StrokeWidth";

export class NewPathModeController extends ModeController {
    static readonly type = "new-path";

    onRegistered(app: App) {
        app.keyboard.addBinding({
            key: "a",
            // To avoid conflicts with 'Select All' binding
            metaKey: false,
            ctrlKey: false,
            action: (app, ev) => {
                app.setMode(NewPathModeController.type);
            },
        });
        app.keyboard.addBinding({
            key: "l",
            action: (app, ev) => {
                app.setMode(NewPathModeController.type);
            },
        });
        app.keyboard.addBinding({
            key: "Escape",
            mode: [NewPathModeController.type],
            action: (app, ev) => {
                app.canvas.unselectAll();
                app.setMode(SelectEntityModeController.type);
            },
        });
    }

    onPointerDown(app: App, ev: CanvasPointerEvent): void {
        app.history.pause();
        const hit = testHitEntities(
            app.canvas.page.get(),
            ev.point,
            app.viewport.get().scale,
            app.entityHandle,
        );

        const path = this.insertNewPath(
            app,
            new Line(ev.point, translate(1, 1).apply(ev.point)),
        );

        if (hit.entities.length > 0) {
            const { target } = hit.entities[0];
            registerLinkToRect(
                app,
                path,
                PathEntityHandle.getNodes(path)[0],
                target,
            );
        }

        app.setMode(SelectPathModeController.type);
        app.canvas.unselectAll();
        app.canvas.select(path.id);

        app.getModeControllerByClass(
            SelectPathModeController,
        ).selectedNodeIds.set(new Set([PathEntityHandle.getNodes(path)[1].id]));

        app.setMode(MoveNodeModeController.type);
        app.gesture.addPointerUpHandler(ev.pointerId, (app, ev) => {
            if (ev.isTap) {
                app.canvas.edit((builder) => builder.deleteEntity(path.id));
            }
        });
    }

    private insertNewPath(app: App, line: Line): PathEntity {
        const node1 = new GraphNode(randomId(), line.p1);
        const node2 = new GraphNode(randomId(), line.p2);
        const graph = Graph.create();
        graph.addEdge(node1, node2);

        const pathEntity: PathEntity = {
            id: randomId(),
            type: "path",
            nodes: [
                { id: node1.id, x: node1.x, y: node1.y },
                { id: node2.id, x: node2.x, y: node2.y },
            ],
            edges: [[node1.id, node2.id]],
            [PROPERTY_KEY_COLOR_ID]: app.getSelectedPropertyValue(
                PROPERTY_KEY_COLOR_ID,
                0,
            ),
            [PROPERTY_KEY_STROKE_STYLE]: app.getSelectedPropertyValue(
                PROPERTY_KEY_STROKE_STYLE,
                "solid",
            ),
            [PROPERTY_KEY_STROKE_WIDTH]: app.getSelectedPropertyValue(
                PROPERTY_KEY_STROKE_WIDTH,
                2,
            ),
            [PROPERTY_KEY_FILL_STYLE]: app.getSelectedPropertyValue(
                PROPERTY_KEY_FILL_STYLE,
                "none",
            ),
            [PROPERTY_KEY_CORNER_RADIUS]: 0,
            [PROPERTY_KEY_ARROW_HEAD_NODE_IDS]: [],
        };

        app.canvas.edit((builder) => builder.setEntity(pathEntity));
        return pathEntity;
    }
}

export function registerLinkToRect(
    app: App,
    nodeOwner: Entity,
    node: GraphNode,
    target: Entity,
) {
    if (nodeOwner.id === target.id) {
        return;
    }
    if (isOwnedLabel(app.canvas.page.get(), nodeOwner, target)) {
        return;
    }

    app.canvas.edit((builder) =>
        builder.addLink(
            new LinkToRect(randomId(), nodeOwner.id, node.id, target.id),
        ),
    );
}

function isOwnedLabel(page: Page, nodeOwner: Entity, label: Entity): boolean {
    return page.links
        .getByEntityId(nodeOwner.id)
        .some(
            (link) => link instanceof LinkToEdge && link.entityId === label.id,
        );
}
