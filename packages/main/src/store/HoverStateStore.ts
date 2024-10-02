import { distanceFromPointToLine } from "../geo/Line";
import { Store } from "../lib/Store";
import { assert } from "../lib/assert";
import type { Page } from "../model/Page";
import type { CanvasStateStore } from "./CanvasStateStore";
import type { PointerStateStore } from "./PointerStateStore";
import type { ViewportStore } from "./ViewportStore";

interface NearestPoint {
	x: number;
	y: number;
	distance: number;
	pointId: string | null;
	lineId: string | null;
}

/**
 * The distance threshold for highlighting a point in canvas coordinate (px).
 */
const THRESHOLD = 16;

export function getNearestPoint(
	page: Page,
	x: number,
	y: number,
	scale: number,
	ignorePointIds: string[],
	threshold = THRESHOLD,
) {
	const ignoreIdSet = new Set();
	for (const pointId of ignorePointIds) {
		const point = page.points.get(pointId);
		assert(point !== undefined, `Point not found: ${pointId}`);

		ignoreIdSet.add(point.id);
		for (const lineId of point.children) {
			const line = page.objects.get(lineId);
			assert(line !== undefined, `Line not found: ${lineId}`);
			assert(line.type === "line", `Expected line: ${lineId}`);

			ignoreIdSet.add(lineId);
			ignoreIdSet.add(line.p1Id);
			ignoreIdSet.add(line.p2Id);
		}
	}

	let nearestPoint: NearestPoint | null = null;
	for (const point of page.points.values()) {
		if (ignoreIdSet.has(point.id)) continue;

		const distance = Math.hypot(point.x - x, point.y - y) * scale;
		if (distance < threshold) {
			if (distance < (nearestPoint?.distance ?? Number.POSITIVE_INFINITY)) {
				nearestPoint = {
					x: point.x,
					y: point.y,
					distance,
					pointId: point.id,
					lineId: null,
				};
			}
		}
	}
	// Prioritize the point over the line
	if (nearestPoint !== null) return nearestPoint;

	for (const object of page.objects.values()) {
		if (ignoreIdSet.has(object.id)) continue;

		if (object.type === "line") {
			const { point, distance } = distanceFromPointToLine({ x, y }, object);
			if (distance < threshold) {
				if (point.x === object.x1 && point.y === object.y1) continue;
				if (point.x === object.x2 && point.y === object.y2) continue;

				if (distance < (nearestPoint?.distance ?? Number.POSITIVE_INFINITY)) {
					nearestPoint = {
						x: point.x,
						y: point.y,
						distance,
						pointId: null,
						lineId: object.id,
					};
				}
			}
		}
	}
	if (nearestPoint !== null) return nearestPoint;

	return null;
}

export class HoverStateStore extends Store<{
	nearestPoint: NearestPoint | null;
}> {
	constructor(
		private readonly canvasStateStore: CanvasStateStore,
		private readonly pointerStateStore: PointerStateStore,
		private readonly viewportStore: ViewportStore,
	) {
		super({
			nearestPoint: null,
		});

		canvasStateStore.addListener(() => this.recompute());
		pointerStateStore.addListener(() => this.recompute());
	}

	recompute(): void {
		const { page } = this.canvasStateStore.getState();
		const { scale } = this.viewportStore.getState();
		const { x, y } = this.pointerStateStore.getState();

		const nearestPoint = getNearestPoint(page, x, y, scale, []);

		this.setState({ nearestPoint });
	}
}
