import { LiveObject, type Room } from "@liveblocks/client";
import { Store } from "../lib/Store";
import { assert } from "../lib/assert";
import { isNotNullish } from "../lib/isNullish";
import { ClipboardService } from "../service/ClipboardService";
import type { RestoreViewportService } from "../service/RestoreViewportService";
import { CanvasState } from "./CanvasState";
import type { ColorId } from "./ColorPaletteBase";
import type { FillMode } from "./FillMode";
import { Line } from "./Line";
import type { Mode } from "./Mode";
import { Page } from "./Page";
import { Rect } from "./Rect";
import { Shape } from "./Shape";
import type { TextAlignment } from "./TextAlignment";
import type { Viewport } from "./Viewport";

export class CanvasStateStore
	extends Store<CanvasState>
	implements CanvasEventHandlers
{
	constructor(
		private readonly room: Room,
		private readonly storage: { root: LiveObject<Liveblocks["Storage"]> },
		private readonly restoreViewportService: RestoreViewportService,
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

	syncWithLiveBlockStorage() {
		const page = this.storage.root.get("page").toImmutable() as Page;

		const state = this.state.copy({
			page,
			selectedShapeIds: this.state.selectedShapeIds.filter(
				(id) => page.shapes.get(id) || page.lines.get(id),
			),
		});
		this.setState(state);
	}

	private update(predicate: () => void) {
		this.room.batch(() => {
			predicate();
		});
		this.syncWithLiveBlockStorage();
	}

	private addShape(shape: Shape) {
		this.update(() => {
			this.storage.root
				.get("page")
				.get("shapes")
				.set(shape.id, new LiveObject(shape));
		});
	}

	private addLine(line: Line) {
		this.update(() => {
			this.storage.root
				.get("page")
				.get("lines")
				.set(line.id, new LiveObject(line));
		});
	}

	private deleteShapes(ids: string[]) {
		this.update(() => {
			const shapes = this.storage.root.get("page").get("shapes");
			const lines = this.storage.root.get("page").get("lines");

			for (const id of ids) {
				shapes.delete(id);
			}
			for (const id of ids) {
				lines.delete(id);
			}
		});
	}

	private moveShapes(
		deltaX: number,
		deltaY: number,
		shapes: Shape[],
		lines: Line[],
	) {
		this.update(() => {
			const currentShapes = this.storage.root.get("page").get("shapes");
			const currentLines = this.storage.root.get("page").get("lines");

			for (const shape of shapes) {
				const currentShape = currentShapes.get(shape.id);
				if (currentShape === undefined) continue;

				currentShape.set("x", shape.x + deltaX);
				currentShape.set("y", shape.y + deltaY);
			}
			for (const line of lines) {
				const currentLine = currentLines.get(line.id);
				if (currentLine === undefined) continue;

				currentLine.set("x1", line.x1 + deltaX);
				currentLine.set("y1", line.y1 + deltaY);
				currentLine.set("x2", line.x2 + deltaX);
				currentLine.set("y2", line.y2 + deltaY);
			}
		});
	}

	private scaleShapes(
		scaleX: number,
		scaleY: number,
		originX: number,
		originY: number,
		shapes: Shape[],
		lines: Line[],
	) {
		this.update(() => {
			const currentShapes = this.storage.root.get("page").get("shapes");
			const currentLines = this.storage.root.get("page").get("lines");

			for (const shape of shapes) {
				const currentShape = currentShapes.get(shape.id);
				if (currentShape === undefined) continue;

				let x = (shape.x - originX) * scaleX + originX;
				let y = (shape.y - originY) * scaleY + originY;
				let width = shape.width * scaleX;
				let height = shape.height * scaleY;
				if (width < 0) {
					x += width;
					width = -width;
				}
				if (height < 0) {
					y += height;
					height = -height;
				}

				currentShape.set("x", x);
				currentShape.set("y", y);
				currentShape.set("width", width);
				currentShape.set("height", height);
			}
			for (const line of lines) {
				const currentLine = currentLines.get(line.id);
				if (currentLine === undefined) continue;

				const x1 = (line.x1 - originX) * scaleX + originX;
				const y1 = (line.y1 - originY) * scaleY + originY;
				const x2 = (line.x2 - originX) * scaleX + originX;
				const y2 = (line.y2 - originY) * scaleY + originY;

				currentLine.set("x1", x1);
				currentLine.set("y1", y1);
				currentLine.set("x2", x2);
				currentLine.set("y2", y2);
			}
		});
	}

	private setMode(mode: Mode) {
		if (this.state.dragging) {
			this.handleDragEnd();
		}

		this.setState(this.state.copy({ mode }));

		if (mode !== "select" && mode !== "text") {
			this.clearSelection();
		}
	}

	private moveViewportPosition(deltaCanvasX: number, deltaCanvasY: number) {
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

	private setViewportScale(
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

	private select(id: string) {
		this.setState(
			this.state.copy({
				selectedShapeIds: [...this.state.selectedShapeIds, id],
			}),
		);
	}

	private unselect(id: string) {
		this.setState(
			this.state.copy({
				selectedShapeIds: this.state.selectedShapeIds.filter((i) => i !== id),
			}),
		);
	}

	private toggleSelect(id: string) {
		if (this.state.selectedShapeIds.includes(id)) {
			this.unselect(id);
		} else {
			this.select(id);
		}
	}

	private clearSelection() {
		this.setSelectedShapeIds([]);
	}

	private setSelectedShapeIds(ids: string[]) {
		this.setState(
			this.state.copy({
				selectedShapeIds: ids,
			}),
		);
	}

	private deleteSelectedShapes() {
		this.deleteShapes(this.state.selectedShapeIds);
	}

	private undo() {
		this.room.history.undo();
	}

	private redo() {
		this.room.history.redo();
	}

	private copy() {
		if (this.state.selectedShapeIds.length === 0) return;

		const shapes = this.state.selectedShapeIds
			.map((id) => this.state.page.shapes.get(id))
			.filter(isNotNullish);
		const lines = this.state.selectedShapeIds
			.map((id) => this.state.page.lines.get(id))
			.filter(isNotNullish);

		ClipboardService.copy(shapes, lines);
	}

	private async cut() {
		this.copy();
		this.deleteSelectedShapes();
	}

	private async paste(): Promise<void> {
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

	/// ---------------------------------------------------------------------------
	/// handlers

	handleCanvasMouseDown(
		canvasX: number,
		canvasY: number,
		mouseButton: number,
		modifiers: { shiftKey: boolean },
	) {
		switch (mouseButton) {
			case MouseButton.Left: {
				switch (this.state.mode) {
					case "select": {
						const selectionRect = this.state.selectionRect;
						const [x, y] = fromCanvasCoordinate(
							canvasX,
							canvasY,
							this.state.viewport,
						);
						if (selectionRect?.isOverlapWithPoint(x, y) ?? false) {
							this.handleDragStart(canvasX, canvasY, {
								type: "move",
								shapes: this.state.selectedShapeIds
									.map((id) => this.state.page.shapes.get(id))
									.filter(isNotNullish),
								lines: this.state.selectedShapeIds
									.map((id) => this.state.page.lines.get(id))
									.filter(isNotNullish),
							});
						} else {
							if (!modifiers.shiftKey) {
								this.clearSelection();
							}
							this.handleDragStart(canvasX, canvasY, {
								type: "select",
								originalSelectedShapeIds: this.state.selectedShapeIds.slice(),
							});
						}
						break;
					}
					case "line":
					case "shape": {
						this.handleDragStart(canvasX, canvasY, { type: "none" });
						break;
					}
					case "text": {
						this.setMode("select");
						this.clearSelection();
						break;
					}
				}
				break;
			}
		}
	}

	handleCanvasMouseMove(canvasX: number, canvasY: number) {
		if (this.state.dragging) {
			this.handleDragMove(canvasX, canvasY);
		}
	}

	handleCanvasMouseUp() {
		if (this.state.dragging) {
			this.handleDragEnd();
		}
	}

	handleShapeMouseDown(
		id: string,
		canvasX: number,
		canvasY: number,
		mouseButton: number,
		modifiers: { shiftKey: boolean },
	): boolean {
		switch (mouseButton) {
			case MouseButton.Left: {
				switch (this.state.mode) {
					case "select": {
						if (modifiers.shiftKey) {
							this.toggleSelect(id);
						} else {
							if (this.state.selectedShapeIds.includes(id)) {
								// Do nothing
							} else {
								this.clearSelection();
								this.select(id);
							}
						}
						this.handleDragStart(canvasX, canvasY, {
							type: "move",
							shapes: this.state.selectedShapeIds
								.map((id) => this.state.page.shapes.get(id))
								.filter(isNotNullish),
							lines: this.state.selectedShapeIds
								.map((id) => this.state.page.lines.get(id))
								.filter(isNotNullish),
						});
						return true;
					}
					case "text": {
						this.setMode("select");
						this.handleDragStart(canvasX, canvasY, {
							type: "move",
							shapes: this.state.selectedShapeIds
								.map((id) => this.state.page.shapes.get(id))
								.filter(isNotNullish),
							lines: this.state.selectedShapeIds
								.map((id) => this.state.page.lines.get(id))
								.filter(isNotNullish),
						});
						return true;
					}
				}
				break;
			}
		}
		return false;
	}

	handleShapeDoubleClick(
		id: string,
		canvasX: number,
		canvasY: number,
		mouseButton: number,
		modifiers: { shiftKey: boolean },
	) {
		switch (mouseButton) {
			case MouseButton.Left: {
				this.setSelectedShapeIds([id]);
				this.setMode("text");
				return true;
			}
		}
	}

	handleSelectionRectHandleMouseDown(
		canvasX: number,
		canvasY: number,
		mouseButton: number,
		handle: SelectionRectHandleType,
	) {
		switch (mouseButton) {
			case MouseButton.Left: {
				const selectionRect = computeUnionRect(
					this.state.selectedShapeIds
						.map((id) => this.state.page.shapes.get(id))
						.filter(isNotNullish),
					this.state.selectedShapeIds
						.map((id) => this.state.page.lines.get(id))
						.filter(isNotNullish),
				);
				assert(selectionRect !== null, "Cannot resize without a selection");

				let dragType: DragType;
				switch (handle) {
					case "center": {
						dragType = {
							type: "move",
							shapes: this.state.selectedShapeIds
								.map((id) => this.state.page.shapes.get(id))
								.filter(isNotNullish),
							lines: this.state.selectedShapeIds
								.map((id) => this.state.page.lines.get(id))
								.filter(isNotNullish),
						};
						break;
					}
					case "topLeft":
						dragType = {
							type: "nwse-resize",
							originX: selectionRect.x + selectionRect.width,
							originY: selectionRect.y + selectionRect.height,
							shapes: this.state.selectedShapeIds
								.map((id) => this.state.page.shapes.get(id))
								.filter(isNotNullish),
							lines: this.state.selectedShapeIds
								.map((id) => this.state.page.lines.get(id))
								.filter(isNotNullish),
						};
						break;
					case "top":
						dragType = {
							type: "ns-resize",
							originY: selectionRect.y + selectionRect.height,
							shapes: this.state.selectedShapeIds
								.map((id) => this.state.page.shapes.get(id))
								.filter(isNotNullish),
							lines: this.state.selectedShapeIds
								.map((id) => this.state.page.lines.get(id))
								.filter(isNotNullish),
						};
						break;
					case "topRight":
						dragType = {
							type: "nesw-resize",
							originX: selectionRect.x,
							originY: selectionRect.y + selectionRect.height,
							shapes: this.state.selectedShapeIds
								.map((id) => this.state.page.shapes.get(id))
								.filter(isNotNullish),
							lines: this.state.selectedShapeIds
								.map((id) => this.state.page.lines.get(id))
								.filter(isNotNullish),
						};
						break;
					case "right":
						dragType = {
							type: "ew-resize",
							originX: selectionRect.x,
							shapes: this.state.selectedShapeIds
								.map((id) => this.state.page.shapes.get(id))
								.filter(isNotNullish),
							lines: this.state.selectedShapeIds
								.map((id) => this.state.page.lines.get(id))
								.filter(isNotNullish),
						};
						break;
					case "bottomRight":
						dragType = {
							type: "nwse-resize",
							originX: selectionRect.x,
							originY: selectionRect.y,
							shapes: this.state.selectedShapeIds
								.map((id) => this.state.page.shapes.get(id))
								.filter(isNotNullish),
							lines: this.state.selectedShapeIds
								.map((id) => this.state.page.lines.get(id))
								.filter(isNotNullish),
						};
						break;
					case "bottomLeft":
						dragType = {
							type: "nesw-resize",
							originX: selectionRect.x + selectionRect.width,
							originY: selectionRect.y,
							shapes: this.state.selectedShapeIds
								.map((id) => this.state.page.shapes.get(id))
								.filter(isNotNullish),
							lines: this.state.selectedShapeIds
								.map((id) => this.state.page.lines.get(id))
								.filter(isNotNullish),
						};
						break;
					case "left":
						dragType = {
							type: "ew-resize",
							originX: selectionRect.x + selectionRect.width,
							shapes: this.state.selectedShapeIds
								.map((id) => this.state.page.shapes.get(id))
								.filter(isNotNullish),
							lines: this.state.selectedShapeIds
								.map((id) => this.state.page.lines.get(id))
								.filter(isNotNullish),
						};
						break;
					case "bottom":
						dragType = {
							type: "ns-resize",
							originY: selectionRect.y,
							shapes: this.state.selectedShapeIds
								.map((id) => this.state.page.shapes.get(id))
								.filter(isNotNullish),
							lines: this.state.selectedShapeIds
								.map((id) => this.state.page.lines.get(id))
								.filter(isNotNullish),
						};
						break;
				}

				this.handleDragStart(canvasX, canvasY, dragType);
				break;
			}
		}
	}

	handleSelectionLineHandleMouseDown(
		canvasX: number,
		canvasY: number,
		mouseButton: number,
		point: 1 | 2,
	) {
		switch (mouseButton) {
			case MouseButton.Left: {
				const line = this.state.page.lines.get(this.state.selectedShapeIds[0]);
				assert(isNotNullish(line), "Cannot edit without selecting a line");

				const dragType: DragType = { type: "move-point", line, point };
				this.handleDragStart(canvasX, canvasY, dragType);
				break;
			}
		}
	}

	handleDragStart(startCanvasX: number, startCanvasY: number, type: DragType) {
		assert(!this.state.dragging, "Cannot start dragging while dragging");

		const [startX, startY] = fromCanvasCoordinate(
			startCanvasX,
			startCanvasY,
			this.state.viewport,
		);

		this.room.history.pause();
		this.setState(
			this.state.copy({
				dragType: type,
				dragging: true,
				dragStartX: startX,
				dragStartY: startY,
				dragCurrentX: startX,
				dragCurrentY: startY,
			}),
		);
	}

	handleDragMove(currentCanvasX: number, currentCanvasY: number) {
		assert(this.state.dragging, "Cannot move drag while not dragging");

		const [currentX, currentY] = fromCanvasCoordinate(
			currentCanvasX,
			currentCanvasY,
			this.state.viewport,
		);

		this.setState(
			this.state.copy({
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
							const currentLine = this.storage.root
								.get("page")
								.get("lines")
								.get(line.id);
							if (currentLine === undefined) return;

							if (point === 1) {
								currentLine.set(
									"x1",
									line.x1 + currentX - this.state.dragStartX,
								);
								currentLine.set(
									"y1",
									line.y1 + currentY - this.state.dragStartY,
								);
							} else {
								currentLine.set(
									"x2",
									line.x2 + currentX - this.state.dragStartX,
								);
								currentLine.set(
									"y2",
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

	handleDragEnd() {
		assert(this.state.dragging, "Cannot end drag while not dragging");

		this.room.history.resume();
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

	handleScroll(deltaCanvasX: number, deltaCanvasY: number) {
		this.moveViewportPosition(deltaCanvasX, deltaCanvasY);
	}

	handleScale(newScale: number, centerCanvasX: number, centerCanvasY: number) {
		this.setViewportScale(newScale, centerCanvasX, centerCanvasY);
	}

	handleKeyDown(
		key: string,
		modifiers: { metaKey: boolean; ctrlKey: boolean; shiftKey: boolean },
	): boolean {
		switch (key) {
			case "a": {
				switch (this.state.mode) {
					case "line":
					case "shape":
					case "select": {
						if (modifiers.metaKey || modifiers.ctrlKey) {
							this.setMode("select");
							this.setSelectedShapeIds([
								...this.state.page.shapes.keys(),
								...this.state.page.lines.keys(),
							]);
							return true;
						}
					}
				}
				break;
			}
			case "r": {
				switch (this.state.mode) {
					case "shape":
					case "select": {
						this.setMode("shape");
						return true;
					}
				}
				break;
			}
			case "l": {
				switch (this.state.mode) {
					case "shape":
					case "select": {
						this.setMode("line");
						return true;
					}
				}
				break;
			}
			case "z": {
				switch (this.state.mode) {
					case "line":
					case "shape":
					case "select": {
						if (modifiers.metaKey || modifiers.ctrlKey) {
							if (modifiers.shiftKey) {
								this.redo();
							} else {
								this.undo();
							}
							return true;
						}
					}
				}
				break;
			}
			case "x": {
				switch (this.state.mode) {
					case "select": {
						if (modifiers.metaKey || modifiers.ctrlKey) {
							this.cut();
						}
						return true;
					}
				}
				break;
			}
			case "c": {
				switch (this.state.mode) {
					case "select": {
						if (modifiers.metaKey || modifiers.ctrlKey) {
							this.copy();
						}
						return true;
					}
				}
				break;
			}
			case "v": {
				switch (this.state.mode) {
					case "select": {
						if (modifiers.metaKey || modifiers.ctrlKey) {
							this.paste();
						}
						return true;
					}
				}
				break;
			}
			case "Escape": {
				switch (this.state.mode) {
					case "select": {
						this.clearSelection();
						return true;
					}
					default: {
						this.setMode("select");
						return true;
					}
				}
			}
			case "Delete":
			case "Backspace": {
				switch (this.state.mode) {
					case "select": {
						this.deleteSelectedShapes();
						return true;
					}
				}
				break;
			}
		}

		return false;
	}

	handleModeChange(mode: Mode) {
		this.setMode(mode);
	}

	handleLabelChange(shapeId: string, value: string) {
		this.update(() => {
			const shape = this.storage.root.get("page").get("shapes").get(shapeId);

			if (shape !== undefined) {
				shape.set("label", value);
			}
		});
	}

	handleTextAlignButtonClick(alignX: TextAlignment, alignY: TextAlignment) {
		this.update(() => {
			for (const id of this.state.selectedShapeIds) {
				const shape = this.storage.root.get("page").get("shapes").get(id);

				if (shape !== undefined) {
					shape.set("textAlignX", alignX);
					shape.set("textAlignY", alignY);
				}
			}
		});
		this.setState(
			this.state.copy({ defaultTextAlignX: alignX, defaultTextAlignY: alignY }),
		);
	}

	handleColorButtonClick(colorId: ColorId) {
		this.update(() => {
			for (const id of this.state.selectedShapeIds) {
				const shape = this.storage.root.get("page").get("shapes").get(id);
				if (shape !== undefined) {
					shape.set("colorId", colorId);
				}

				const line = this.storage.root.get("page").get("lines").get(id);
				if (line !== undefined) {
					line.set("colorId", colorId);
				}
			}
		});
		this.setState(this.state.copy({ defaultColorId: colorId }));
	}

	handleFillModeButtonClick(fillMode: FillMode) {
		this.update(() => {
			for (const id of this.state.selectedShapeIds) {
				const shape = this.storage.root.get("page").get("shapes").get(id);
				if (shape !== undefined) {
					shape.set("fillMode", fillMode);
				}
			}
		});
		this.setState(this.state.copy({ defaultFillMode: fillMode }));
	}
}

export interface CanvasEventHandlers {
	handleCanvasMouseDown(
		canvasX: number,
		canvasY: number,
		mouseButton: number,
		modifiers: { shiftKey: boolean },
	): void;
	handleCanvasMouseMove(canvasX: number, canvasY: number): void;
	handleCanvasMouseUp(): void;
	handleShapeMouseDown(
		id: string,
		canvasX: number,
		canvasY: number,
		mouseButton: number,
		modifiers: {
			shiftKey: boolean;
		},
	): boolean;
	handleShapeDoubleClick(
		id: string,
		canvasX: number,
		canvasY: number,
		mouseButton: number,
		modifiers: {
			shiftKey: boolean;
		},
	): boolean;
	handleSelectionRectHandleMouseDown(
		canvasX: number,
		canvasY: number,
		mouseButton: number,
		handle: SelectionRectHandleType,
	): void;
	handleSelectionLineHandleMouseDown(
		canvasX: number,
		canvasY: number,
		mouseButton: number,
		point: 1 | 2,
	): void;
	handleDragStart(
		startCanvasX: number,
		startCanvasY: number,
		handle: DragType,
	): void;
	handleDragMove(currentCanvasX: number, currentCanvasY: number): void;
	handleDragEnd(): void;
	handleScroll(deltaCanvasX: number, deltaCanvasY: number): void;
	handleScale(
		newScale: number,
		centerCanvasX: number,
		centerCanvasY: number,
	): void;
	handleKeyDown(
		key: string,
		modifiers: {
			metaKey: boolean;
			ctrlKey: boolean;
			shiftKey: boolean;
		},
	): boolean;
	handleModeChange(mode: Mode): void;
	handleLabelChange(shapeId: string, value: string): void;
	handleTextAlignButtonClick(
		alignX: TextAlignment,
		alignY: TextAlignment,
	): void;
	handleColorButtonClick(colorId: ColorId): void;
	handleFillModeButtonClick(fillMode: FillMode): void;
}

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

export function toCanvasCoordinate(
	x: number,
	y: number,
	viewport: Viewport,
): [canvasX: number, canvasY: number] {
	return [(x - viewport.x) * viewport.scale, (y - viewport.y) * viewport.scale];
}

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
