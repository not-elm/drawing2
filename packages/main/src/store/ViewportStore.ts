import { Point } from "../geo/Point";
import { Rect } from "../geo/Rect";
import { Transform } from "../geo/Transform";
import { Store } from "../lib/Store";
import { dataclass } from "../lib/dataclass";
import type { RestoreViewportService } from "../service/RestoreViewportService";

class ViewportState extends dataclass<{
    rect: Rect;
    scale: number;
}>() {}

export class ViewportStore extends Store<ViewportState> {
    constructor(
        private readonly restoreViewportService: RestoreViewportService,
    ) {
        super(
            new ViewportState({
                rect: Rect.of(0, 0, 0, 0),
                scale: 1,
            }),
        );

        this.addListener(() => {
            document.title = `x: ${this.state.rect.left.toFixed(
                0,
            )}, y: ${this.state.rect.top.toFixed(
                0,
            )}, scale: ${this.state.scale.toFixed(2)}`;
        });
    }

    movePosition(deltaCanvasX: number, deltaCanvasY: number) {
        this.setState(
            this.state.copy({
                rect: this.state.rect.translate(deltaCanvasX, deltaCanvasY),
            }),
        );
        // this.restoreViewportService.save(this.state);
    }

    setScale(newScale: number, centerCanvasX: number, centerCanvasY: number) {
        const transform = Transform.scale(
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

        this.setState(
            this.state.copy({
                rect: new Rect({ p0, p1 }),
                scale: newScale,
            }),
        );
        // this.restoreViewportService.save(this.state);
    }

    setViewportSize(canvasWidth: number, canvasHeight: number) {
        this.setState(
            this.state.copy({
                rect: Rect.fromSize(
                    this.state.rect.topLeft,
                    canvasWidth / this.state.scale,
                    canvasHeight / this.state.scale,
                ),
            }),
        );
        // this.restoreViewportService.save(this.state);
    }
}
