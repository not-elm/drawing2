import { Point } from "./shape/Point";
import type { Rect } from "./shape/Shape";
import { scale, translate } from "./shape/TransformMatrix";

export class Viewport {
    constructor(
        public rect: Rect,
        public scale: number,
    ) {}

    get transform() {
        return translate(-this.rect.left, -this.rect.top).scale(
            new Point(0, 0),
            this.scale,
            this.scale,
        );
    }

    get fromCanvasCoordinateTransform() {
        return scale(new Point(0, 0), 1 / this.scale, 1 / this.scale).translate(
            this.rect.left,
            this.rect.top,
        );
    }
}
