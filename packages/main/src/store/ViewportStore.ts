import { Store } from "../lib/Store";
import type { Viewport } from "../model/Viewport";
import type { RestoreViewportService } from "../service/RestoreViewportService";

export class ViewportStore extends Store<Viewport> {
	constructor(private readonly restoreViewportService: RestoreViewportService) {
		super({ x: 0, y: 0, scale: 1 });
	}

	movePosition(deltaCanvasX: number, deltaCanvasY: number) {
		this.setState({
			...this.state,
			x: this.state.x + deltaCanvasX / this.state.scale,
			y: this.state.y + deltaCanvasY / this.state.scale,
		});
		this.restoreViewportService.save(this.state);
	}

	setScale(newScale: number, centerCanvasX: number, centerCanvasY: number) {
		this.setState({
			x:
				centerCanvasX / this.state.scale -
				centerCanvasX / newScale +
				this.state.x,
			y:
				centerCanvasY / this.state.scale -
				centerCanvasY / newScale +
				this.state.y,
			scale: newScale,
		});
		this.restoreViewportService.save(this.state);
	}
}
