import type { App } from "../App";
import type { ModeChangeEvent } from "../ModeController";
import { Point } from "../shape/Point";
import { type TransformMatrix, scale } from "../shape/TransformMatrix";
import {
    AbstractTransformEntityModeController,
    type Axis,
} from "./AbstractTransformEntityModeController";
import { SelectEntityModeController } from "./SelectEntityModeController";

const MARGIN = 16;

export class ResizeEntityModeController extends AbstractTransformEntityModeController {
    static readonly type = "resize-entity";
    private resizeOrigin = new Point(0, 0);
    private resizeInXAxis = false;
    private resizeInYAxis = false;

    onRegistered(app: App) {
        app.keyboard.addBinding({
            key: "Escape",
            mode: [ResizeEntityModeController.type],
            action: () => {
                app.setMode(SelectEntityModeController.type);
            },
        });
    }

    onAfterEnterMode(app: App, ev: ModeChangeEvent): void {
        super.onAfterEnterMode(app, ev);

        const selectionRect = this.originalSelectionRect;
        const point = app.pointerPosition.get();

        if (point.x < selectionRect.left + MARGIN) {
            if (point.y < selectionRect.top + MARGIN) {
                this.startPoint = selectionRect.topLeft;
                this.resizeOrigin = selectionRect.bottomRight;
                this.resizeInXAxis = true;
                this.resizeInYAxis = true;
            } else if (point.y > selectionRect.bottom - MARGIN) {
                this.startPoint = selectionRect.bottomLeft;
                this.resizeOrigin = selectionRect.topRight;
                this.resizeInXAxis = true;
                this.resizeInYAxis = true;
            } else {
                this.startPoint = selectionRect.centerLeft;
                this.resizeOrigin = selectionRect.centerRight;
                this.resizeInXAxis = true;
                this.resizeInYAxis = false;
            }
        } else if (point.x > selectionRect.right - MARGIN) {
            if (point.y < selectionRect.top + MARGIN) {
                this.startPoint = selectionRect.topRight;
                this.resizeOrigin = selectionRect.bottomLeft;
                this.resizeInXAxis = true;
                this.resizeInYAxis = true;
            } else if (point.y > selectionRect.bottom - MARGIN) {
                this.startPoint = selectionRect.bottomRight;
                this.resizeOrigin = selectionRect.topLeft;
                this.resizeInXAxis = true;
                this.resizeInYAxis = true;
            } else {
                this.startPoint = selectionRect.centerRight;
                this.resizeOrigin = selectionRect.centerLeft;
                this.resizeInXAxis = true;
                this.resizeInYAxis = false;
            }
        } else {
            if (point.y < selectionRect.center.y) {
                this.resizeOrigin = selectionRect.topCenter;
                this.resizeOrigin = selectionRect.bottomCenter;
                this.resizeInXAxis = false;
                this.resizeInYAxis = true;
            } else {
                this.resizeOrigin = selectionRect.bottomCenter;
                this.resizeOrigin = selectionRect.topCenter;
                this.resizeInXAxis = false;
                this.resizeInYAxis = true;
            }
        }
    }

    protected getSnapPoints(point: Point) {
        const transform = this.getTransform(this.startPoint, point);
        const rect = transform.apply(this.originalSelectionRect);

        const xs: Point[] = [];
        const ys: Point[] = [];
        if (this.resizeInXAxis) {
            if (this.resizeInYAxis) {
                xs.push(point);
                xs.push(new Point(point.x, this.resizeOrigin.y));
                ys.push(point);
                ys.push(new Point(this.resizeOrigin.x, point.y));
            } else {
                xs.push(new Point(point.x, rect.top));
                xs.push(new Point(point.x, rect.bottom));
            }
        } else if (this.resizeInYAxis) {
            ys.push(new Point(rect.left, point.y));
            ys.push(new Point(rect.right, point.y));
        }

        return { x: xs, y: ys };
    }

    protected getTransform(
        startPoint: Point,
        currentPoint: Point,
    ): TransformMatrix {
        const scaleX = this.resizeInXAxis
            ? (currentPoint.x - this.resizeOrigin.x) /
              (startPoint.x - this.resizeOrigin.x)
            : 1;
        const scaleY = this.resizeInYAxis
            ? (currentPoint.y - this.resizeOrigin.y) /
              (startPoint.y - this.resizeOrigin.y)
            : 1;

        return scale(this.resizeOrigin, scaleX, scaleY);
    }

    protected applyConstraint(point: Point, snapAxis: Axis | null): Point {
        if (!this.resizeInXAxis || !this.resizeInYAxis) {
            return point;
        }
        const dx = point.x - this.resizeOrigin.x;
        const dy = point.y - this.resizeOrigin.y;

        let adjustedDx: number;
        let adjustedDy: number;
        if (
            snapAxis === "x" ||
            (snapAxis !== "y" &&
                this.originalSelectionRect.width >
                    this.originalSelectionRect.height)
        ) {
            adjustedDx = dx;
            adjustedDy =
                (dx * this.originalSelectionRect.height) /
                this.originalSelectionRect.width;
            if (adjustedDy * dy < 0) {
                adjustedDy = -adjustedDy;
            }
        } else {
            adjustedDy = dy;
            adjustedDx =
                (dy * this.originalSelectionRect.width) /
                this.originalSelectionRect.height;
            if (adjustedDx * dx < 0) {
                adjustedDx = -adjustedDx;
            }
        }

        const adjustedX = this.resizeOrigin.x + adjustedDx;
        const adjustedY = this.resizeOrigin.y + adjustedDy;

        return new Point(adjustedX, adjustedY);
    }
}
