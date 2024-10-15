import { assert } from "../lib/assert";
import { adjustAngle } from "../lib/geo/adjustAngle";
import type { App } from "./App";
import type { Entity } from "./Entity";
import type { HistoryManager } from "./HistoryManager";
import type { PointerEventHandlers } from "./PointerEventSession";

export function createMovePointSession(
    entity: Entity,
    nodeId: string,
    app: App,
    historyManager: HistoryManager,
): PointerEventHandlers {
    historyManager.pause();

    const nodes = entity.getNodes();
    const edges = entity.getEdges();
    const originalNode = nodes.find((node) => node.id === nodeId);
    assert(originalNode !== undefined);

    const edge = edges.find((e) => e[0].id === nodeId || e[1].id === nodeId);
    assert(edge !== undefined);

    const otherNode = edge[0].id === nodeId ? edge[1] : edge[0];

    return {
        onPointerMove: (data) => {
            let newPoint = originalNode.point.translate(
                data.new.x - data.start.x,
                data.new.y - data.start.y,
            );

            if (data.shiftKey && otherNode !== undefined) {
                newPoint = adjustAngle(
                    otherNode.point,
                    newPoint,
                    0,
                    Math.PI / 12,
                );
            }

            app.edit((tx) => {
                tx.setPointPosition(entity.props.id, nodeId, newPoint);
            });
        },
        onPointerUp: () => {
            historyManager.resume();
        },
    };
}
