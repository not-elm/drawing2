import { Store } from "../lib/Store";
import { assert } from "../lib/assert";
import { isNotNullish } from "../lib/isNullish";
import { ClipboardService } from "../service/ClipboardService";
import type { RestoreViewportService } from "../service/RestoreViewportService";
import { CanvasState } from "./CanvasState";
import type { ColorId } from "./Colors";
import type { FillMode } from "./FillMode";
import { Line } from "./Line";
import type { Mode } from "./Mode";
import { Page } from "./Page";
import { Rect } from "./Rect";
import { Shape } from "./Shape";
import type { TextAlignment } from "./TextAlignment";
import type { Viewport } from "./Viewport";

export type DragType =
	| { type: "none" }
	| { type: "select"; originalSelectedShapeIds: string[] }
	| {
			type: "move"; // moving multiple objects
			shapes: Shape[];
			lines: Line[];
	  }
	| {
			type: "move-point"; // moving a point in a path
			line: Line;
			point: 1 | 2;
	  }
	| {
			type: "nwse-resize";
			originX: number;
			originY: number;
			shapes: Shape[];
			lines: Line[];
	  }
	| {
			type: "nesw-resize";
			originX: number;
			originY: number;
			shapes: Shape[];
			lines: Line[];
	  }
	| {
			type: "ns-resize";
			originY: number;
			shapes: Shape[];
			lines: Line[];
	  }
	| {
			type: "ew-resize";
			originX: number;
			shapes: Shape[];
			lines: Line[];
	  };

export function fromCanvasCoordinate(
	canvasX: number,
	canvasY: number,
	viewport: Viewport,
): [x: number, y: number] {
	return [
		canvasX / viewport.scale + viewport.x,
		canvasY / viewport.scale + viewport.y,
	];
}

export function isOverlapped(obj1: Shape | Line, obj2: Shape | Line): boolean {
	if ("width" in obj1) {
		const rect1 = new Rect({
			x: obj1.x,
			y: obj1.y,
			width: obj1.width,
			height: obj1.height,
		});

		if ("width" in obj2) {
			return rect1.isOverlapWithRect(obj2);
		} else {
			return rect1.isOverlapWithLine(obj2);
		}
	} else {
		if ("width" in obj2) {
			const rect2 = new Rect({
				x: obj2.x,
				y: obj2.y,
				width: obj2.width,
				height: obj2.height,
			});
			return rect2.isOverlapWithLine(obj1);
		} else {
			return Line.isOverlap(obj1, obj2);
		}
	}
}

export abstract class CanvasStateStore extends Store<CanvasState> {
	constructor(
		protected readonly restoreViewportService: RestoreViewportService,
	) {
		super(
			new CanvasState({
				page: Page.create(),
				mode: "select",
				viewport: {
					x: 0,
					y: 0,
					scale: 1,
				},
				selectedShapeIds: [],
				dragType: { type: "none" },
				dragging: false,
				dragStartX: 0,
				dragStartY: 0,
				dragCurrentX: 0,
				dragCurrentY: 0,
				defaultColorId: 0,
				defaultFillMode: "mono",
				defaultTextAlignX: "center",
				defaultTextAlignY: "center",
			}),
		);

		this.restoreViewportService.restore().then((viewport) => {
			if (viewport !== null) {
				this.setState(this.state.copy({ viewport }));
			}
		});
	}

	abstract addLine(line: Line): void;

	abstract addShape(shape: Shape): void;

	abstract deleteShapes(ids: string[]): void;

	/**
	 * Update the state in a batch and notify to down streams
	 * @param predicate
	 * @private
	 */
	abstract update(predicate: () => void): void;

	abstract moveShapes(
		deltaX: number,
		deltaY: number,
		shapes: Shape[],
		lines: Line[],
	): void;

	abstract scaleShapes(
		scaleX: number,
		scaleY: number,
		originX: number,
		originY: number,
		shapes: Shape[],
		lines: Line[],
	): void;

	abstract resumeHistory(): void;

	abstract pauseHistory(): void;

	setMode(mode: Mode) {
		if (this.state.dragging) {
			this.endDrag();
		}

		this.setState(this.state.copy({ mode }));

		if (mode !== "select" && mode !== "text") {
			this.clearSelection();
		}
	}

	endDrag() {
		assert(this.state.dragging, "Cannot end drag while not dragging");

		this.resumeHistory();
		this.setState(
			this.state.copy({
				dragging: false,
				dragType: { type: "none" },
			}),
		);

		switch (this.state.mode) {
			case "select": {
				break;
			}
			case "shape": {
				const width = Math.abs(this.state.dragCurrentX - this.state.dragStartX);
				const height = Math.abs(
					this.state.dragCurrentY - this.state.dragStartY,
				);
				if (width === 0 || height === 0) break;

				const x = Math.min(this.state.dragStartX, this.state.dragCurrentX);
				const y = Math.min(this.state.dragStartY, this.state.dragCurrentY);
				const shape = Shape.create(
					x,
					y,
					width,
					height,
					"",
					this.state.defaultTextAlignX,
					this.state.defaultTextAlignY,
					this.state.defaultColorId,
					this.state.defaultFillMode,
				);
				this.addShape(shape);
				this.setMode("select");
				break;
			}
			case "line": {
				const line = Line.create(
					this.state.dragStartX,
					this.state.dragStartY,
					this.state.dragCurrentX,
					this.state.dragCurrentY,
					this.state.defaultColorId,
				);
				this.addLine(line);
				this.setMode("select");
			}
		}
	}

	clearSelection() {
		this.setSelectedShapeIds([]);
	}

	setSelectedShapeIds(ids: string[]) {
		this.setState(
			this.state.copy({
				selectedShapeIds: ids,
			}),
		);
	}

	moveViewportPosition(deltaCanvasX: number, deltaCanvasY: number) {
		this.setState(
			this.state.copy({
				viewport: {
					...this.state.viewport,
					x: this.state.viewport.x + deltaCanvasX / this.state.viewport.scale,
					y: this.state.viewport.y + deltaCanvasY / this.state.viewport.scale,
				},
			}),
		);
		this.restoreViewportService.save(this.state.viewport);
	}

	setViewportScale(
		newScale: number,
		centerCanvasX: number,
		centerCanvasY: number,
	) {
		this.setState(
			this.state.copy({
				viewport: {
					x:
						centerCanvasX / this.state.viewport.scale -
						centerCanvasX / newScale +
						this.state.viewport.x,
					y:
						centerCanvasY / this.state.viewport.scale -
						centerCanvasY / newScale +
						this.state.viewport.y,
					scale: newScale,
				},
			}),
		);
		this.restoreViewportService.save(this.state.viewport);
	}

	select(id: string) {
		this.setState(
			this.state.copy({
				selectedShapeIds: [...this.state.selectedShapeIds, id],
			}),
		);
	}

	unselect(id: string) {
		this.setState(
			this.state.copy({
				selectedShapeIds: this.state.selectedShapeIds.filter((i) => i !== id),
			}),
		);
	}

	toggleSelect(id: string) {
		if (this.state.selectedShapeIds.includes(id)) {
			this.unselect(id);
		} else {
			this.select(id);
		}
	}

	deleteSelectedShapes() {
		this.deleteShapes(this.state.selectedShapeIds);
	}

	abstract undo(): void;

	abstract redo(): void;

	copy() {
		if (this.state.selectedShapeIds.length === 0) return;

		const shapes = this.state.selectedShapeIds
			.map((id) => this.state.page.shapes.get(id))
			.filter(isNotNullish);
		const lines = this.state.selectedShapeIds
			.map((id) => this.state.page.lines.get(id))
			.filter(isNotNullish);

		ClipboardService.copy(shapes, lines);
	}

	async cut() {
		this.copy();
		this.deleteSelectedShapes();
	}

	async paste(): Promise<void> {
		const { shapes, lines } = await ClipboardService.paste();
		if (shapes.length === 0 && lines.length === 0) return;

		this.update(() => {
			for (const shape of shapes) {
				this.addShape(shape);
			}
			for (const line of lines) {
				this.addLine(line);
			}
		});

		this.setSelectedShapeIds([
			...shapes.map((shape) => shape.id),
			...lines.map((line) => line.id),
		]);
	}

	/**
	 * Find the overlapped object with the given object from the objects
	 * located in front of it, and return the most-backward object.
	 */
	findForwardOverlappedObject(
		objectId: string,
		ignoreObjectIds: Set<string>,
	): { objectId: string; globalIndex: number } | null {
		let globalIndex = 0;
		for (; globalIndex < this.state.page.objectIds.length; globalIndex++) {
			if (this.state.page.objectIds[globalIndex] === objectId) break;
		}

		const refObject =
			this.state.page.shapes.get(objectId) ??
			this.state.page.lines.get(objectId);
		assert(refObject !== undefined, "Cannot find the reference object");
		globalIndex++;

		for (; globalIndex < this.state.page.objectIds.length; globalIndex++) {
			const objectId = this.state.page.objectIds[globalIndex];
			if (ignoreObjectIds.has(objectId)) {
				continue;
			}

			const otherObject =
				this.state.page.shapes.get(objectId) ??
				this.state.page.lines.get(objectId);

			if (otherObject === undefined) continue;

			if (isOverlapped(refObject, otherObject)) {
				return { objectId, globalIndex };
			}
		}

		return null;
	}

	/**
	 * Find the overlapped object with the given object from the objects
	 * located behind of it, and return the most-forward object.
	 */
	findBackwardOverlappedObject(
		objectId: string,
		ignoreObjectIds: Set<string>,
	): { objectId: string; globalIndex: number } | null {
		let globalIndex = this.state.page.objectIds.length - 1;
		for (; globalIndex >= 0; globalIndex--) {
			if (this.state.page.objectIds[globalIndex] === objectId) break;
		}

		const refObject =
			this.state.page.shapes.get(objectId) ??
			this.state.page.lines.get(objectId);
		assert(refObject !== undefined, "Cannot find the reference object");
		globalIndex--;

		for (; globalIndex >= 0; globalIndex--) {
			const objectId = this.state.page.objectIds[globalIndex];
			if (ignoreObjectIds.has(objectId)) {
				continue;
			}

			const otherObject =
				this.state.page.shapes.get(objectId) ??
				this.state.page.lines.get(objectId);

			if (otherObject === undefined) continue;

			if (isOverlapped(refObject, otherObject)) {
				return { objectId, globalIndex };
			}
		}

		return null;
	}

	startDrag(startCanvasX: number, startCanvasY: number, type: DragType) {
		assert(!this.getState().dragging, "Cannot start dragging while dragging");

		const [startX, startY] = fromCanvasCoordinate(
			startCanvasX,
			startCanvasY,
			this.getState().viewport,
		);

		this.pauseHistory();
		this.setState(
			this.getState().copy({
				dragType: type,
				dragging: true,
				dragStartX: startX,
				dragStartY: startY,
				dragCurrentX: startX,
				dragCurrentY: startY,
			}),
		);
	}

	abstract updateLinePoint(
		lineId: string,
		point: 1 | 2,
		x: number,
		y: number,
	): void;

	updateDrag(currentCanvasX: number, currentCanvasY: number) {
		assert(this.getState().dragging, "Cannot move drag while not dragging");

		const [currentX, currentY] = fromCanvasCoordinate(
			currentCanvasX,
			currentCanvasY,
			this.getState().viewport,
		);

		this.setState(
			this.getState().copy({
				dragCurrentX: currentX,
				dragCurrentY: currentY,
			}),
		);

		switch (this.state.mode) {
			case "select": {
				switch (this.state.dragType.type) {
					case "select": {
						const selectionRect = this.state.selectorRect;
						assert(selectionRect !== null, "Cannot select without a selection");
						const selectedShapeIds =
							this.state.dragType.originalSelectedShapeIds.slice();

						for (const shape of this.state.page.shapes.values()) {
							if (selectionRect.isOverlapWithRect(shape)) {
								selectedShapeIds.push(shape.id);
							}
						}
						for (const line of this.state.page.lines.values()) {
							if (selectionRect.isOverlapWithLine(line)) {
								selectedShapeIds.push(line.id);
							}
						}
						this.setSelectedShapeIds(selectedShapeIds);
						break;
					}
					case "move": {
						this.moveShapes(
							this.state.dragCurrentX - this.state.dragStartX,
							this.state.dragCurrentY - this.state.dragStartY,
							this.state.dragType.shapes,
							this.state.dragType.lines,
						);
						break;
					}
					case "move-point": {
						const { point, line } = this.state.dragType;
						this.update(() => {
							if (point === 1) {
								this.updateLinePoint(
									line.id,
									1,
									line.x1 + currentX - this.state.dragStartX,
									line.y1 + currentY - this.state.dragStartY,
								);
							} else {
								this.updateLinePoint(
									line.id,
									2,
									line.x2 + currentX - this.state.dragStartX,
									line.y2 + currentY - this.state.dragStartY,
								);
							}
						});
						break;
					}
					case "nwse-resize":
					case "nesw-resize": {
						this.scaleShapes(
							(this.state.dragCurrentX - this.state.dragType.originX) /
								(this.state.dragStartX - this.state.dragType.originX),
							(this.state.dragCurrentY - this.state.dragType.originY) /
								(this.state.dragStartY - this.state.dragType.originY),
							this.state.dragType.originX,
							this.state.dragType.originY,
							this.state.dragType.shapes,
							this.state.dragType.lines,
						);
						break;
					}
					case "ns-resize": {
						this.scaleShapes(
							1,
							(this.state.dragCurrentY - this.state.dragType.originY) /
								(this.state.dragStartY - this.state.dragType.originY),
							0,
							this.state.dragType.originY,
							this.state.dragType.shapes,
							this.state.dragType.lines,
						);
						break;
					}
					case "ew-resize": {
						this.scaleShapes(
							(this.state.dragCurrentX - this.state.dragType.originX) /
								(this.state.dragStartX - this.state.dragType.originX),
							1,
							this.state.dragType.originX,
							0,
							this.state.dragType.shapes,
							this.state.dragType.lines,
						);
						break;
					}
				}
				break;
			}
		}
	}

	abstract setLabel(shapeId: string, value: string): void;

	abstract setTextAlign(alignX: TextAlignment, alignY: TextAlignment): void;

	abstract setColor(colorId: ColorId): void;

	abstract setFillMode(fillMode: FillMode): void;

	abstract bringToFront(): void;

	abstract bringForward(): void;

	abstract sendBackward(): void;

	abstract sendToBack(): void;
}

export type SelectionRectHandleType =
	| "center"
	| "topLeft"
	| "top"
	| "topRight"
	| "right"
	| "bottomRight"
	| "bottom"
	| "bottomLeft"
	| "left";

export function computeUnionRect(shapes: Shape[], lines: Line[]): Rect | null {
	if (shapes.length === 0 && lines.length === 0) return null;

	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;

	for (const shape of shapes) {
		minX = Math.min(minX, shape.x);
		minY = Math.min(minY, shape.y);
		maxX = Math.max(maxX, shape.x + shape.width);
		maxY = Math.max(maxY, shape.y + shape.height);
	}

	for (const line of lines) {
		minX = Math.min(minX, line.x1, line.x2);
		minY = Math.min(minY, line.y1, line.y2);
		maxX = Math.max(maxX, line.x1, line.x2);
		maxY = Math.max(maxY, line.y1, line.y2);
	}

	return new Rect({
		x: minX,
		y: minY,
		width: maxX - minX,
		height: maxY - minY,
	});
}

export const MouseButton = {
	Left: 0,
	Middle: 1,
	Right: 2,
};
