import { adjustAngle } from "../../geo/adjustAngle";
import type { StateProvider } from "../../lib/Store";
import { randomId } from "../../lib/randomId";
import { type LineBlock, type PointEntity, PointKey } from "../../model/Page";
import { Transaction } from "../../model/Transaction";
import type { AppStateStore } from "../../store/AppStateStore";
import {
    type CanvasStateStore,
    fromCanvasCoordinate,
} from "../../store/CanvasStateStore";
import { testHitEntities } from "../../store/HoverStateStore";
import type { ViewportStore } from "../../store/ViewportStore";
import type { Controller } from "../Controller";
import type { PointerEventHandlers } from "./PointerEventSession";

export interface NewLinePointerEventSession extends PointerEventHandlers {
    type: "new-line";
    currentX: number;
    currentY: number;
}

export function createNewLinePointerEventSession(
    controller: Controller,
    ev: PointerEvent,
    canvasStateStore: CanvasStateStore,
    viewportProvider: StateProvider<ViewportStore>,
    appStateStore: AppStateStore,
): NewLinePointerEventSession {
    const [x, y] = fromCanvasCoordinate(
        ev.clientX,
        ev.clientY,
        viewportProvider.getState(),
    );

    return {
        type: "new-line",
        currentX: x,
        currentY: y,
        onPointerMove(data) {
            if (data.shiftKey) {
                const [x, y] = adjustAngle(
                    data.startX,
                    data.startY,
                    data.newX,
                    data.newY,
                    0,
                    Math.PI / 12,
                );
                this.currentX = x;
                this.currentY = y;
            } else {
                this.currentX = data.newX;
                this.currentY = data.newY;
            }
        },
        onPointerUp(data) {
            const page = canvasStateStore.getState().page;
            const scale = viewportProvider.getState().scale;
            const transaction = new Transaction(
                canvasStateStore.getState().page,
            );

            let p1: PointEntity;
            const hitTestResult1 = testHitEntities(
                page,
                data.startX,
                data.startY,
                scale,
            );

            if (hitTestResult1.entities.length === 0) {
                p1 = {
                    type: "point",
                    id: randomId(),
                    x: data.startX,
                    y: data.startY,
                };
                transaction.insertPoints([p1]);
            } else if (hitTestResult1.points.length > 0) {
                p1 = hitTestResult1.points[0].target;
            } else {
                const hitEntry = hitTestResult1.blocks[0];
                switch (hitEntry.target.type) {
                    case "line": {
                        const width = hitEntry.target.x2 - hitEntry.target.x1;
                        const height = hitEntry.target.y2 - hitEntry.target.y1;
                        const relativePosition =
                            width > height
                                ? (hitEntry.point.x - hitEntry.target.x1) /
                                  width
                                : (hitEntry.point.y - hitEntry.target.y1) /
                                  height;
                        p1 = {
                            type: "point",
                            id: randomId(),
                            x: hitEntry.point.x,
                            y: hitEntry.point.y,
                        };
                        transaction.insertPoints([p1]).addDependencies([
                            {
                                type: "pointOnLine",
                                id: randomId(),
                                from: hitEntry.target.id,
                                to: p1.id,
                                r: relativePosition,
                            },
                        ]);
                        break;
                    }
                    case "shape":
                    case "text": {
                        const rx =
                            (hitEntry.point.x - hitEntry.target.x) /
                            hitEntry.target.width;
                        const ry =
                            (hitEntry.point.y - hitEntry.target.y) /
                            hitEntry.target.height;
                        p1 = {
                            type: "point",
                            id: randomId(),
                            x: hitEntry.point.x,
                            y: hitEntry.point.y,
                        };
                        transaction.insertPoints([p1]).addDependencies([
                            {
                                type: "pointOnShape",
                                id: randomId(),
                                from: hitEntry.target.id,
                                to: p1.id,
                                rx,
                                ry,
                            },
                        ]);
                    }
                }
            }

            let p2: PointEntity;
            const hitTestResult2 = testHitEntities(
                page,
                data.newX,
                data.newY,
                scale,
            );

            if (hitTestResult2.entities.length === 0) {
                p2 = {
                    type: "point",
                    id: randomId(),
                    x: this.currentX,
                    y: this.currentY,
                };
                transaction.insertPoints([p2]);
            } else if (hitTestResult2.points.length > 0) {
                p2 = hitTestResult2.points[0].target;
            } else {
                const hitEntry = hitTestResult2.blocks[0];
                switch (hitEntry.target.type) {
                    case "line": {
                        const width = hitEntry.target.x2 - hitEntry.target.x1;
                        const height = hitEntry.target.y2 - hitEntry.target.y1;
                        const relativePosition =
                            width > height
                                ? (hitEntry.point.x - hitEntry.target.x1) /
                                  width
                                : (hitEntry.point.y - hitEntry.target.y1) /
                                  height;
                        p2 = {
                            type: "point",
                            id: randomId(),
                            x: hitEntry.point.x,
                            y: hitEntry.point.y,
                        };
                        transaction.insertPoints([p2]).addDependencies([
                            {
                                type: "pointOnLine",
                                id: randomId(),
                                from: hitEntry.target.id,
                                to: p2.id,
                                r: relativePosition,
                            },
                        ]);
                        break;
                    }
                    case "shape":
                    case "text": {
                        const rx =
                            (hitEntry.point.x - hitEntry.target.x) /
                            hitEntry.target.width;
                        const ry =
                            (hitEntry.point.y - hitEntry.target.y) /
                            hitEntry.target.height;
                        p2 = {
                            type: "point",
                            id: randomId(),
                            x: hitEntry.point.x,
                            y: hitEntry.point.y,
                        };
                        transaction.insertPoints([p2]).addDependencies([
                            {
                                type: "pointOnShape",
                                id: randomId(),
                                from: hitEntry.target.id,
                                to: p2.id,
                                rx,
                                ry,
                            },
                        ]);
                    }
                }
            }

            const line: LineBlock = {
                id: randomId(),
                type: "line",
                x1: p1.x,
                y1: p1.y,
                endType1: appStateStore.getState().defaultLineEndType1,
                x2: p2.x,
                y2: p2.y,
                endType2: appStateStore.getState().defaultLineEndType2,
                colorId: appStateStore.getState().defaultColorId,
                strokeStyle: appStateStore.getState().defaultStrokeStyle,
            };
            transaction.insertBlocks([line]).addDependencies([
                {
                    id: randomId(),
                    type: "blockToPoint",
                    pointKey: PointKey.LINE_P1,
                    from: p1.id,
                    to: line.id,
                },
                {
                    id: randomId(),
                    type: "blockToPoint",
                    pointKey: PointKey.LINE_P2,
                    from: p2.id,
                    to: line.id,
                },
            ]);

            canvasStateStore.setPage(transaction.commit());
            controller.setMode({ type: "select" });
            canvasStateStore.unselectAll();
            canvasStateStore.select(line.id);
        },
    };
}
