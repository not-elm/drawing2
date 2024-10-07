import type { StateProvider } from "../../lib/Store";
import { randomId } from "../../lib/randomId";
import type { PointEntity } from "../../model/Page";
import { Transaction } from "../../model/Transaction";
import type { CanvasStateStore } from "../../store/CanvasStateStore";
import { testHitEntities } from "../../store/HoverStateStore";
import type { ViewportStore } from "../../store/ViewportStore";
import type { HistoryManager } from "../HistoryManager";
import type { PointerEventSession } from "./PointerEventSession";

export interface MovePointPointerEventSession extends PointerEventSession {
    type: "move-point";
}

export function createMovePointPointerEventSession(
    originalPoint: PointEntity,
    canvasStateStore: CanvasStateStore,
    viewportProvider: StateProvider<ViewportStore>,
    historyManager: HistoryManager,
): MovePointPointerEventSession {
    const ignoreEntityIds = new Set([originalPoint.id]);
    const connectedLineIds = canvasStateStore
        .getState()
        .page.dependencies.getByFromEntityId(originalPoint.id)
        .map((dep) => dep.to);
    for (const lineId of connectedLineIds) {
        ignoreEntityIds.add(lineId);
    }

    const dependenciesToPoint = canvasStateStore
        .getState()
        .page.dependencies.getByToEntityId(originalPoint.id)
        .filter(
            (dep) => dep.type === "pointOnShape" || dep.type === "pointOnLine",
        );
    historyManager.pause();

    return {
        type: "move-point",
        onPointerMove: (data) => {
            const hitTestResult = testHitEntities(
                canvasStateStore.getState().page,
                data.newX,
                data.newY,
                viewportProvider.getState().scale,
            );

            const hitPointEntry = hitTestResult.points.filter(
                (item) => !ignoreEntityIds.has(item.target.id),
            )[0];
            const hitBlockEntry = hitTestResult.blocks.filter(
                (item) => !ignoreEntityIds.has(item.target.id),
            )[0];
            const hitEntry = hitPointEntry ?? hitBlockEntry;

            const x =
                hitEntry?.point.x ??
                originalPoint.x + (data.newX - data.startX);
            const y =
                hitEntry?.point.y ??
                originalPoint.y + (data.newY - data.startY);

            canvasStateStore.setPage(
                new Transaction(canvasStateStore.getState().page)
                    .setPointPosition(originalPoint.id, x, y)
                    .commit(),
            );
        },
        onPointerUp: (data) => {
            const transaction = new Transaction(
                canvasStateStore.getState().page,
            );
            transaction.deleteDependencies(
                dependenciesToPoint.map((dep) => dep.id),
            );

            const hitTestResult = testHitEntities(
                canvasStateStore.getState().page,
                data.newX,
                data.newY,
                viewportProvider.getState().scale,
            );

            const hitPointEntry = hitTestResult.points.filter(
                (item) => !ignoreEntityIds.has(item.target.id),
            )[0];
            const hitBlockEntry = hitTestResult.blocks.filter(
                (item) => !ignoreEntityIds.has(item.target.id),
            )[0];

            if (hitPointEntry !== undefined) {
                transaction.mergePoints(
                    originalPoint.id,
                    hitPointEntry.target.id,
                );
            } else {
                switch (hitBlockEntry?.target.type) {
                    case "line": {
                        const width =
                            hitBlockEntry.target.x2 - hitBlockEntry.target.x1;
                        const height =
                            hitBlockEntry.target.y2 - hitBlockEntry.target.y1;

                        const r =
                            width > height
                                ? (hitBlockEntry.point.x -
                                      hitBlockEntry.target.x1) /
                                  width
                                : (hitBlockEntry.point.y -
                                      hitBlockEntry.target.y1) /
                                  height;

                        transaction.addDependencies([
                            {
                                id: randomId(),
                                type: "pointOnLine",
                                from: hitBlockEntry.target.id,
                                to: originalPoint.id,
                                r: r,
                            },
                        ]);
                        break;
                    }
                    case "shape": {
                        const rx =
                            (hitBlockEntry.point.x - hitBlockEntry.target.x) /
                            hitBlockEntry.target.width;
                        const ry =
                            (hitBlockEntry.point.y - hitBlockEntry.target.y) /
                            hitBlockEntry.target.height;

                        transaction.addDependencies([
                            {
                                id: randomId(),
                                type: "pointOnShape",
                                from: hitBlockEntry.target.id,
                                to: originalPoint.id,
                                rx,
                                ry,
                            },
                        ]);
                        break;
                    }
                }
            }

            canvasStateStore.setPage(transaction.commit());
            historyManager.resume();
        },
    };
}
