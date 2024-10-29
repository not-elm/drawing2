import { Point } from "./shape/Point";
import { Rect } from "./shape/Shape";
import { scale, translate } from "./shape/TransformMatrix";

export class Viewport {
    constructor(
        public rect: Rect,
        public scale: number,
    ) {}

    movePosition(deltaCanvasX: number, deltaCanvasY: number): Viewport {
        return new Viewport(
            translate(deltaCanvasX, deltaCanvasY).apply(this.rect),
            this.scale,
        );
    }

    setScale(
        newScale: number,
        centerCanvasX: number,
        centerCanvasY: number,
    ): Viewport {
        const transform = scale(
            new Point(centerCanvasX / this.scale, centerCanvasY / this.scale),
            this.scale / newScale,
            this.scale / newScale,
        );

        const p0 = transform.apply(this.rect.p0);
        const p1 = transform.apply(this.rect.p1);

        return new Viewport(new Rect(p0, p1), newScale);
    }

    setSize(width: number, height: number): Viewport {
        return new Viewport(
            Rect.fromSize(
                this.rect.topLeft,
                width / this.scale,
                height / this.scale,
            ),
            this.scale,
        );
    }

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
