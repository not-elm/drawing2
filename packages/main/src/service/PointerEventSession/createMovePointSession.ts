import { adjustAngle } from "../../geo/adjustAngle";
import type { StateProvider } from "../../lib/Store";
import type { LineBlock } from "../../model/Page";
import { Transaction } from "../../model/Transaction";
import type { CanvasStateStore } from "../../store/CanvasStateStore";
import type { ViewportStore } from "../../store/ViewportStore";
import type { HistoryManager } from "../HistoryManager";
import type { PointerEventHandlers } from "./PointerEventSession";

export function createMovePointSession(
    line: LineBlock,
    point: "p1" | "p2",
    canvasStateStore: CanvasStateStore,
    viewportProvider: StateProvider<ViewportStore>,
    historyManager: HistoryManager,
): PointerEventHandlers {
    // TODO(link)
    // const ignoreEntityIds = new Set([originalPoint.id]);
    //
    // const page = canvasStateStore.getState().page;
    // const connectedLineIds = page.dependencies
    //     .getByFromEntityId(originalPoint.id)
    //     .map((dep) => dep.to);
    // for (const lineId of connectedLineIds) {
    //     ignoreEntityIds.add(lineId);
    // }

    // const dependenciesToPoint = canvasStateStore
    //     .getState()
    //     .page.dependencies.getByToEntityId(originalPoint.id)
    //     .filter(
    //         (dep) => dep.type === "pointOnShape" || dep.type === "pointOnLine",
    //     );

    historyManager.pause();

    const originalPoint =
        point === "p1"
            ? {
                  x: line.x1,
                  y: line.y1,
              }
            : {
                  x: line.x2,
                  y: line.y2,
              };
    const otherPoint =
        point === "p1"
            ? {
                  x: line.x2,
                  y: line.y2,
              }
            : {
                  x: line.x1,
                  y: line.y1,
              };

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

            // TODO(link)
            // const hitTestResult = testHitEntities(
            //     canvasStateStore.getState().page,
            //     x,
            //     y,
            //     viewportProvider.getState().scale,
            //     0,
            // );
            //
            // const hitPointEntry = hitTestResult.points.filter(
            //     (item) => !ignoreEntityIds.has(item.target.id),
            // )[0];
            // const hitBlockEntry = hitTestResult.blocks.filter(
            //     (item) => !ignoreEntityIds.has(item.target.id),
            // )[0];
            // const hitEntry = hitPointEntry ?? hitBlockEntry;
            //
            // x = hitEntry?.point.x ?? x;
            // y = hitEntry?.point.y ?? y;

            canvasStateStore.setPage(
                new Transaction(canvasStateStore.getState().page)
                    .setPointPosition(line.id, point, x, y)
                    .commit(),
            );
        },
        onPointerUp: (data) => {
            const transaction = new Transaction(
                canvasStateStore.getState().page,
            );

            // TODO(link)
            // transaction.deleteDependencies(
            //     dependenciesToPoint.map((dep) => dep.id),
            // );
            //
            // const hitTestResult = testHitEntities(
            //     canvasStateStore.getState().page,
            //     data.newX,
            //     data.newY,
            //     viewportProvider.getState().scale,
            //     0,
            // );
            //
            // const hitPointEntry = hitTestResult.points.filter(
            //     (item) => !ignoreEntityIds.has(item.target.id),
            // )[0];
            // const hitBlockEntry = hitTestResult.blocks.filter(
            //     (item) => !ignoreEntityIds.has(item.target.id),
            // )[0];

            // if (hitPointEntry !== undefined) {
            //     transaction.mergePoints(
            //         originalPoint.id,
            //         hitPointEntry.target.id,
            //     );
            // } else {
            //     switch (hitBlockEntry?.target.type) {
            //         case "line": {
            //             const width =
            //                 hitBlockEntry.target.x2 - hitBlockEntry.target.x1;
            //             const height =
            //                 hitBlockEntry.target.y2 - hitBlockEntry.target.y1;
            //
            //             const r =
            //                 width > height
            //                     ? (hitBlockEntry.point.x -
            //                           hitBlockEntry.target.x1) /
            //                       width
            //                     : (hitBlockEntry.point.y -
            //                           hitBlockEntry.target.y1) /
            //                       height;
            //
            //             transaction.addDependencies([
            //                 {
            //                     id: randomId(),
            //                     type: "pointOnLine",
            //                     from: hitBlockEntry.target.id,
            //                     to: originalPoint.id,
            //                     r: r,
            //                 },
            //             ]);
            //             break;
            //         }
            //         case "shape": {
            //             const rx =
            //                 (hitBlockEntry.point.x - hitBlockEntry.target.x) /
            //                 hitBlockEntry.target.width;
            //             const ry =
            //                 (hitBlockEntry.point.y - hitBlockEntry.target.y) /
            //                 hitBlockEntry.target.height;
            //
            //             transaction.addDependencies([
            //                 {
            //                     id: randomId(),
            //                     type: "pointOnShape",
            //                     from: hitBlockEntry.target.id,
            //                     to: originalPoint.id,
            //                     rx,
            //                     ry,
            //                 },
            //             ]);
            //             break;
            //         }
            //     }
            // }

            canvasStateStore.setPage(transaction.commit());
            historyManager.resume();
        },
    };
}
