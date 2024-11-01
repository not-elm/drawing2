import type { App } from "../App";
import { Point } from "../shape/Point";
import { type TransformMatrix, translate } from "../shape/TransformMatrix";
import {
    AbstractTransformEntityModeController,
    type Axis,
} from "./AbstractTransformEntityModeController";
import { SelectEntityModeController } from "./SelectEntityModeController";

export class MoveEntityModeController extends AbstractTransformEntityModeController {
    static readonly type = "move-entity";

    onRegistered(app: App) {
        app.keyboard.addBinding({
            key: "Escape",
            mode: [MoveEntityModeController.type],
            action: () => {
                app.setMode(SelectEntityModeController.type);
            },
        });
    }

    protected getSnapPoints(point: Point) {
        const dx = point.x - this.startPoint.x;
        const dy = point.y - this.startPoint.y;
        const transform = translate(dx, dy);
        const rect = transform.apply(this.originalSelectionRect);

        return {
            x: [
                rect.topLeft,
                rect.topRight,
                rect.bottomLeft,
                rect.bottomRight,
                rect.center,
            ],
            y: [
                rect.topLeft,
                rect.topRight,
                rect.bottomLeft,
                rect.bottomRight,
                rect.center,
            ],
        };
    }

    protected applyConstraint(point: Point, snapAxis: Axis | null): Point {
        const dx = Math.abs(point.x - this.startPoint.x);
        const dy = Math.abs(point.y - this.startPoint.y);

        if (dx < dy) {
            return new Point(this.startPoint.x, point.y);
        } else {
            return new Point(point.x, this.startPoint.y);
        }
    }

    protected getTransform(
        startPoint: Point,
        currentPoint: Point,
    ): TransformMatrix {
        return translate(
            currentPoint.x - startPoint.x,
            currentPoint.y - startPoint.y,
        );
    }
}
