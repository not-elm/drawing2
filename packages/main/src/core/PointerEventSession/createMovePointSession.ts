import { entityHandleMap } from "../../instance";
import { assert } from "../../lib/assert";
import { adjustAngle } from "../../lib/geo/adjustAngle";
import type { AppController } from "../AppController";
import type { HistoryManager } from "../HistoryManager";
import type { Entity } from "../model/Entity";
import type { PointerEventHandlers } from "./PointerEventSession";

export function createMovePointSession(
    entity: Entity,
    nodeId: string,
    appController: AppController,
    historyManager: HistoryManager,
): PointerEventHandlers {
    historyManager.pause();

    const nodes = entityHandleMap().getNodes(entity);
    const edges = entityHandleMap().getEdges(entity);
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

            appController.edit((tx) => {
                tx.setPointPosition(entity.id, nodeId, newPoint);
            });
        },
        onPointerUp: () => {
            historyManager.resume();
        },
    };
}
