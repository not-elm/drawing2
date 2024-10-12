import { adjustAngle } from "../../geo/adjustAngle";
import type { StateProvider } from "../../lib/Store";
import { assert } from "../../lib/assert";
import type { PathEntity } from "../../model/Page";
import { Transaction } from "../../model/Transaction";
import type { CanvasStateStore } from "../../store/CanvasStateStore";
import type { ViewportStore } from "../../store/ViewportStore";
import type { HistoryManager } from "../HistoryManager";
import type { PointerEventHandlers } from "./PointerEventSession";

export function createMovePointSession(
    path: PathEntity,
    nodeId: string,
    canvasStateStore: CanvasStateStore,
    viewportProvider: StateProvider<ViewportStore>,
    historyManager: HistoryManager,
): PointerEventHandlers {
    historyManager.pause();

    const originalPoint = path.nodes[nodeId];
    const edge = path.edges.find((e) => e[0] === nodeId || e[1] === nodeId);
    assert(edge !== undefined);

    const otherPoint =
        edge[0] === nodeId ? path.nodes[edge[1]] : path.nodes[edge[0]];

    return {
        onPointerMove: (data) => {
            let x = originalPoint.x + (data.newX - data.startX);
            let y = originalPoint.y + (data.newY - data.startY);

            if (data.shiftKey && otherPoint !== undefined) {
                [x, y] = adjustAngle(
                    otherPoint.x,
                    otherPoint.y,
                    x,
                    y,
                    0,
                    Math.PI / 12,
                );
            }

            canvasStateStore.setPage(
                new Transaction(canvasStateStore.getState().page)
                    .setPointPosition(path.id, nodeId, x, y)
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
