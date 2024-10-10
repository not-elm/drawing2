import { Store } from "../lib/Store";
import { dataclass } from "../lib/dataclass";
import type { RestoreViewportService } from "../service/RestoreViewportService";

class ViewportState extends dataclass<{
    x: number;
    y: number;
    scale: number;
    canvasWidth: number;
    canvasHeight: number;
}>() {
    get width() {
        return this.canvasWidth / this.scale;
    }

    get height() {
        return this.canvasHeight / this.scale;
    }
}

export class ViewportStore extends Store<ViewportState> {
    constructor(
        private readonly restoreViewportService: RestoreViewportService,
    ) {
        super(
            new ViewportState({
                x: 0,
                y: 0,
                canvasWidth: 0,
                canvasHeight: 0,
                scale: 1,
            }),
        );
    }

    movePosition(deltaCanvasX: number, deltaCanvasY: number) {
        this.setState(
            this.state.copy({
                x: this.state.x + deltaCanvasX / this.state.scale,
                y: this.state.y + deltaCanvasY / this.state.scale,
            }),
        );
        // this.restoreViewportService.save(this.state);
    }

    setScale(newScale: number, centerCanvasX: number, centerCanvasY: number) {
        this.setState(
            this.state.copy({
                x:
                    centerCanvasX / this.state.scale -
                    centerCanvasX / newScale +
                    this.state.x,
                y:
                    centerCanvasY / this.state.scale -
                    centerCanvasY / newScale +
                    this.state.y,
                scale: newScale,
            }),
        );
        // this.restoreViewportService.save(this.state);
    }

    setViewportSize(canvasWidth: number, canvasHeight: number) {
        this.setState(
            this.state.copy({
                canvasWidth,
                canvasHeight,
            }),
        );
        // this.restoreViewportService.save(this.state);
    }
}
