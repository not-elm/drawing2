import { Store } from "../lib/Store";
import { Viewport } from "./Viewport";
import { Point } from "./geo/Point";
import { Rect } from "./geo/Rect";
import { scale, translate } from "./geo/TransformMatrix";

export class ViewportStore extends Store<Viewport> {
    constructor(
        // private readonly restoreViewportService: RestoreViewportService,
    ) {
        super(new Viewport(Rect.of(0, 0, 1, 1), 1));
    }

    movePosition(deltaCanvasX: number, deltaCanvasY: number) {
        this.setState(
            new Viewport(
                translate(deltaCanvasX, deltaCanvasY).apply(this.state.rect),
                this.state.scale,
            ),
        );
        // this.restoreViewportService.save(this.state);
    }

    setScale(newScale: number, centerCanvasX: number, centerCanvasY: number) {
        const transform = scale(
            new Point(
                centerCanvasX / this.state.scale,
                centerCanvasY / this.state.scale,
            ),

            // Viewport is transformed inversely (when scaled up 2x,
            // the viewport rect is scaled down 2x)
            this.state.scale / newScale,
            this.state.scale / newScale,
        );

        const p0 = transform.apply(this.state.rect.p0);
        const p1 = transform.apply(this.state.rect.p1);

        this.setState(new Viewport(new Rect({ p0, p1 }), newScale));
        // this.restoreViewportService.save(this.state);
    }

    setViewportSize(canvasWidth: number, canvasHeight: number) {
        this.setState(
            new Viewport(
                Rect.fromSize(
                    this.state.rect.topLeft,
                    canvasWidth / this.state.scale,
                    canvasHeight / this.state.scale,
                ),
                this.state.scale,
            ),
        );
        // this.restoreViewportService.save(this.state);
    }
}
