import { Store } from "../lib/Store";
import type { CanvasStateStore } from "./CanvasStateStore";
import type { PointerStateStore } from "./PointerStateStore";

export class HoverStateStore extends Store<{
	pointIds: string[];
}> {
	/**
	 * The distance threshold for highlighting a point in canvas coordinate (px).
	 */
	private readonly THRESHOLD = 16;

	constructor(
		private readonly canvasStateStore: CanvasStateStore,
		private readonly pointerStateStore: PointerStateStore,
	) {
		super({
			pointIds: [],
		});

		canvasStateStore.addListener(() => this.recompute());
		pointerStateStore.addListener(() => this.recompute());
	}

	recompute(): void {
		const {
			page,
			viewport: { scale },
		} = this.canvasStateStore.getState();
		const { x: pointerX, y: pointerY } = this.pointerStateStore.getState();

		const pointIds: string[] = [];
		for (const point of page.points.values()) {
			const distance =
				Math.hypot(point.x - pointerX, point.y - pointerY) * scale;
			if (distance < this.THRESHOLD) {
				pointIds.push(point.id);
			}
		}

		this.setState({ pointIds });
	}
}
