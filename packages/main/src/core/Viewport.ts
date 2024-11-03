import { Point } from "./shape/Point";
import { Rect } from "./shape/Shape";
import { scale, translate } from "./shape/TransformMatrix";

export class Viewport {
    constructor(
        public rect: Rect,
        public scale: number,
    ) {}

    move(deltaCanvasX: number, deltaCanvasY: number): Viewport {
        return new Viewport(
            translate(
                deltaCanvasX / this.scale,
                deltaCanvasY / this.scale,
            ).apply(this.rect),
            this.scale,
        );
    }

    setScale(
        newScale: number,
        centerCanvasX: number,
        centerCanvasY: number,
    ): Viewport {
        // C: scale origin in canvas coordinate
        // c: scale origin in content coordinate
        // v1, v2: top left position of old and new viewport in content coordinate
        // s1, s2: old and new scale (size in canvas / size in content)

        // C.x = (c.x - v1.x) * s1 = (c.x - v2.x) * s2
        // C.x / s1 = c.x - v1.x
        // C.x / s2 = c.x - v2.x
        // C.x * (1/s1 - 1/s2) = -v1.x + v2.x
        // v2.x = v1.x + C.x * (1/s1 - 1/s2)
        const oldScale = this.scale;
        const newLeft =
            this.rect.left + centerCanvasX * (1 / oldScale - 1 / newScale);
        const newTop =
            this.rect.top + centerCanvasY * (1 / oldScale - 1 / newScale);
        const newWidth = (this.rect.width * oldScale) / newScale;
        const newHeight = (this.rect.height * oldScale) / newScale;

        return new Viewport(
            Rect.of(newLeft, newTop, newWidth, newHeight),
            newScale,
        );
    }

    resize(width: number, height: number): Viewport {
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
