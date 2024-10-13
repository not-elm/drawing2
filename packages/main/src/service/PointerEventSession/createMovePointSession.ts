import { adjustAngle } from "../../geo/adjustAngle";
import { assert } from "../../lib/assert";
import type { PathEntity } from "../../model/PathEntity";
import { Transaction } from "../../model/Transaction";
import type { CanvasStateStore } from "../../store/CanvasStateStore";
import type { HistoryManager } from "../HistoryManager";
import type { PointerEventHandlers } from "./PointerEventSession";

export function createMovePointSession(
    path: PathEntity,
    nodeId: string,
    canvasStateStore: CanvasStateStore,
    historyManager: HistoryManager,
): PointerEventHandlers {
    historyManager.pause();

    const originalNode = path.nodes[nodeId];
    const edge = path.edges.find((e) => e[0] === nodeId || e[1] === nodeId);
    assert(edge !== undefined);

    const otherNode =
        edge[0] === nodeId ? path.nodes[edge[1]] : path.nodes[edge[0]];

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

            canvasStateStore.setPage(
                new Transaction(canvasStateStore.getState().page)
                    .setPointPosition(path.id, nodeId, newPoint)
                    .commit(),
            );
        },
        onPointerUp: (data) => {
            const transaction = new Transaction(
                canvasStateStore.getState().page,
            );

            canvasStateStore.setPage(transaction.commit());
            historyManager.resume();
        },
    };
}
