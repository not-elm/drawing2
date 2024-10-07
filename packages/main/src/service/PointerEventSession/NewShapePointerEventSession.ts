import { adjustAngle } from "../../geo/adjustAngle";
import { getRectanglePath } from "../../geo/path";
import type { StateProvider } from "../../lib/Store";
import { randomId } from "../../lib/randomId";
import { type PointEntity, PointKey, type ShapeBlock } from "../../model/Page";
import { Transaction } from "../../model/Transaction";
import type { AppStateStore } from "../../store/AppStateStore";
import {
    type CanvasStateStore,
    fromCanvasCoordinate,
} from "../../store/CanvasStateStore";
import type { ViewportStore } from "../../store/ViewportStore";
import type { Controller } from "../Controller";
import type { PointerEventSession } from "./PointerEventSession";

export interface NewShapePointerEventSession extends PointerEventSession {
    type: "new-shape";
    currentX: number;
    currentY: number;
}

export function createNewShapePointerEventSession(
    ev: PointerEvent,
    controller: Controller,
    canvasStateStore: CanvasStateStore,
    appStateStore: AppStateStore,
    viewportProvider: StateProvider<ViewportStore>,
): NewShapePointerEventSession {
    const [x, y] = fromCanvasCoordinate(
        ev.clientX,
        ev.clientY,
        viewportProvider.getState(),
    );

    return {
        type: "new-shape",
        currentX: x,
        currentY: y,
        onPointerMove(data) {
            if (data.shiftKey) {
                const [x, y] = adjustAngle(
                    data.startX,
                    data.startY,
                    data.newX,
                    data.newY,
                    Math.PI / 4,
                    Math.PI / 2,
                );
                this.currentX = x;
                this.currentY = y;
            } else {
                this.currentX = data.newX;
                this.currentY = data.newY;
            }
        },
        onPointerUp(data) {
            const width = Math.abs(this.currentX - data.startX);
            const height = Math.abs(this.currentY - data.startY);
            if (width === 0 || height === 0) return;

            const x = Math.min(data.startX, this.currentX);
            const y = Math.min(data.startY, this.currentY);
            const shape: ShapeBlock = {
                type: "shape",
                id: randomId(),
                x,
                y,
                width,
                height,
                x1: x,
                y1: y,
                x2: x + width,
                y2: y + height,
                label: "",
                textAlignX: appStateStore.getState().defaultTextAlignX,
                textAlignY: appStateStore.getState().defaultTextAlignY,
                colorId: appStateStore.getState().defaultColorId,
                fillMode: appStateStore.getState().defaultFillMode,
                path: getRectanglePath(),
            };
            const p1: PointEntity = { type: "point", id: randomId(), x, y };
            const p2: PointEntity = {
                type: "point",
                id: randomId(),
                x: x + width,
                y: y + height,
            };
            const transaction = new Transaction(
                canvasStateStore.getState().page,
            )
                .insertBlocks([shape])
                .insertPoints([p1, p2])
                .addDependencies([
                    {
                        id: randomId(),
                        type: "blockToPoint",
                        pointKey: PointKey.SHAPE_P1,
                        from: p1.id,
                        to: shape.id,
                    },
                    {
                        id: randomId(),
                        type: "blockToPoint",
                        pointKey: PointKey.SHAPE_P2,
                        from: p2.id,
                        to: shape.id,
                    },
                ]);
            canvasStateStore.setPage(transaction.commit());
            controller.setMode({ type: "select" });
            canvasStateStore.unselectAll();
            canvasStateStore.select(shape.id);
        },
    };
}
