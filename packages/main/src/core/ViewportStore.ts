import { Viewport } from "./Viewport";
import { atom } from "./atom/Atom";
import { Rect } from "./shape/Shape";

export class ViewportStore {
    readonly state = atom(new Viewport(Rect.of(0, 0, 1, 1), 1));

    // constructor(
    //     private readonly restoreViewportService: RestoreViewportService,
    // ) {}

    movePosition(deltaCanvasX: number, deltaCanvasY: number) {
        this.state.set(
            this.state.get().movePosition(deltaCanvasX, deltaCanvasY),
        );
        // this.restoreViewportService.save(this.state);
    }

    setScale(newScale: number, centerCanvasX: number, centerCanvasY: number) {
        this.state.set(
            this.state.get().setScale(newScale, centerCanvasX, centerCanvasY),
        );
        // this.restoreViewportService.save(this.state);
    }

    setViewportSize(canvasWidth: number, canvasHeight: number) {
        this.state.set(this.state.get().setSize(canvasWidth, canvasHeight));
        // this.restoreViewportService.save(this.state);
    }
}
