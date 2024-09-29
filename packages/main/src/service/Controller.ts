import { assert } from "../lib/assert";
import { isNotNullish } from "../lib/isNullish";
import type { ColorId } from "../model/Colors";
import type { FillMode } from "../model/FillMode";
import type { Mode } from "../model/Mode";
import type { TextAlignment } from "../model/TextAlignment";
import {
	type CanvasStateStore,
	type DragType,
	MouseButton,
	type SelectionRectHandleType,
	computeUnionRect,
	fromCanvasCoordinate,
} from "../store/CanvasStateStore";

export class Controller {
	constructor(private readonly store: CanvasStateStore) {}

	handleCanvasMouseDown(
		canvasX: number,
		canvasY: number,
		mouseButton: number,
		modifiers: { shiftKey: boolean },
	) {
		switch (mouseButton) {
			case MouseButton.Left: {
				switch (this.store.getState().mode) {
					case "select": {
						const selectionRect = this.store.getState().selectionRect;
						const [x, y] = fromCanvasCoordinate(
							canvasX,
							canvasY,
							this.store.getState().viewport,
						);
						if (selectionRect?.isOverlapWithPoint(x, y) ?? false) {
							this.handleDragStart(canvasX, canvasY, {
								type: "move",
								shapes: this.store
									.getState()
									.selectedShapeIds.map((id) =>
										this.store.getState().page.shapes.get(id),
									)
									.filter(isNotNullish),
								lines: this.store
									.getState()
									.selectedShapeIds.map((id) =>
										this.store.getState().page.lines.get(id),
									)
									.filter(isNotNullish),
							});
						} else {
							if (!modifiers.shiftKey) {
								this.store.clearSelection();
							}
							this.handleDragStart(canvasX, canvasY, {
								type: "select",
								originalSelectedShapeIds: this.store
									.getState()
									.selectedShapeIds.slice(),
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
						this.store.setMode("select");
						this.store.clearSelection();
						break;
					}
				}
				break;
			}
		}
	}

	handleCanvasMouseMove(canvasX: number, canvasY: number) {
		if (this.store.getState().dragging) {
			this.handleDragMove(canvasX, canvasY);
		}
	}

	handleCanvasMouseUp() {
		if (this.store.getState().dragging) {
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
				switch (this.store.getState().mode) {
					case "select": {
						if (modifiers.shiftKey) {
							this.store.toggleSelect(id);
						} else {
							if (this.store.getState().selectedShapeIds.includes(id)) {
								// Do nothing
							} else {
								this.store.clearSelection();
								this.store.select(id);
							}
						}
						this.handleDragStart(canvasX, canvasY, {
							type: "move",
							shapes: this.store
								.getState()
								.selectedShapeIds.map((id) =>
									this.store.getState().page.shapes.get(id),
								)
								.filter(isNotNullish),
							lines: this.store
								.getState()
								.selectedShapeIds.map((id) =>
									this.store.getState().page.lines.get(id),
								)
								.filter(isNotNullish),
						});
						return true;
					}
					case "text": {
						this.store.setMode("select");
						this.handleDragStart(canvasX, canvasY, {
							type: "move",
							shapes: this.store
								.getState()
								.selectedShapeIds.map((id) =>
									this.store.getState().page.shapes.get(id),
								)
								.filter(isNotNullish),
							lines: this.store
								.getState()
								.selectedShapeIds.map((id) =>
									this.store.getState().page.lines.get(id),
								)
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
				this.store.setSelectedShapeIds([id]);
				this.store.setMode("text");
				return true;
			}
		}

		return false;
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
					this.store
						.getState()
						.selectedShapeIds.map((id) =>
							this.store.getState().page.shapes.get(id),
						)
						.filter(isNotNullish),
					this.store
						.getState()
						.selectedShapeIds.map((id) =>
							this.store.getState().page.lines.get(id),
						)
						.filter(isNotNullish),
				);
				assert(selectionRect !== null, "Cannot resize without a selection");

				let dragType: DragType;
				switch (handle) {
					case "center": {
						dragType = {
							type: "move",
							shapes: this.store
								.getState()
								.selectedShapeIds.map((id) =>
									this.store.getState().page.shapes.get(id),
								)
								.filter(isNotNullish),
							lines: this.store
								.getState()
								.selectedShapeIds.map((id) =>
									this.store.getState().page.lines.get(id),
								)
								.filter(isNotNullish),
						};
						break;
					}
					case "topLeft":
						dragType = {
							type: "nwse-resize",
							originX: selectionRect.x + selectionRect.width,
							originY: selectionRect.y + selectionRect.height,
							shapes: this.store
								.getState()
								.selectedShapeIds.map((id) =>
									this.store.getState().page.shapes.get(id),
								)
								.filter(isNotNullish),
							lines: this.store
								.getState()
								.selectedShapeIds.map((id) =>
									this.store.getState().page.lines.get(id),
								)
								.filter(isNotNullish),
						};
						break;
					case "top":
						dragType = {
							type: "ns-resize",
							originY: selectionRect.y + selectionRect.height,
							shapes: this.store
								.getState()
								.selectedShapeIds.map((id) =>
									this.store.getState().page.shapes.get(id),
								)
								.filter(isNotNullish),
							lines: this.store
								.getState()
								.selectedShapeIds.map((id) =>
									this.store.getState().page.lines.get(id),
								)
								.filter(isNotNullish),
						};
						break;
					case "topRight":
						dragType = {
							type: "nesw-resize",
							originX: selectionRect.x,
							originY: selectionRect.y + selectionRect.height,
							shapes: this.store
								.getState()
								.selectedShapeIds.map((id) =>
									this.store.getState().page.shapes.get(id),
								)
								.filter(isNotNullish),
							lines: this.store
								.getState()
								.selectedShapeIds.map((id) =>
									this.store.getState().page.lines.get(id),
								)
								.filter(isNotNullish),
						};
						break;
					case "right":
						dragType = {
							type: "ew-resize",
							originX: selectionRect.x,
							shapes: this.store
								.getState()
								.selectedShapeIds.map((id) =>
									this.store.getState().page.shapes.get(id),
								)
								.filter(isNotNullish),
							lines: this.store
								.getState()
								.selectedShapeIds.map((id) =>
									this.store.getState().page.lines.get(id),
								)
								.filter(isNotNullish),
						};
						break;
					case "bottomRight":
						dragType = {
							type: "nwse-resize",
							originX: selectionRect.x,
							originY: selectionRect.y,
							shapes: this.store
								.getState()
								.selectedShapeIds.map((id) =>
									this.store.getState().page.shapes.get(id),
								)
								.filter(isNotNullish),
							lines: this.store
								.getState()
								.selectedShapeIds.map((id) =>
									this.store.getState().page.lines.get(id),
								)
								.filter(isNotNullish),
						};
						break;
					case "bottomLeft":
						dragType = {
							type: "nesw-resize",
							originX: selectionRect.x + selectionRect.width,
							originY: selectionRect.y,
							shapes: this.store
								.getState()
								.selectedShapeIds.map((id) =>
									this.store.getState().page.shapes.get(id),
								)
								.filter(isNotNullish),
							lines: this.store
								.getState()
								.selectedShapeIds.map((id) =>
									this.store.getState().page.lines.get(id),
								)
								.filter(isNotNullish),
						};
						break;
					case "left":
						dragType = {
							type: "ew-resize",
							originX: selectionRect.x + selectionRect.width,
							shapes: this.store
								.getState()
								.selectedShapeIds.map((id) =>
									this.store.getState().page.shapes.get(id),
								)
								.filter(isNotNullish),
							lines: this.store
								.getState()
								.selectedShapeIds.map((id) =>
									this.store.getState().page.lines.get(id),
								)
								.filter(isNotNullish),
						};
						break;
					case "bottom":
						dragType = {
							type: "ns-resize",
							originY: selectionRect.y,
							shapes: this.store
								.getState()
								.selectedShapeIds.map((id) =>
									this.store.getState().page.shapes.get(id),
								)
								.filter(isNotNullish),
							lines: this.store
								.getState()
								.selectedShapeIds.map((id) =>
									this.store.getState().page.lines.get(id),
								)
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
				const line = this.store
					.getState()
					.page.lines.get(this.store.getState().selectedShapeIds[0]);
				assert(isNotNullish(line), "Cannot edit without selecting a line");

				const dragType: DragType = { type: "move-point", line, point };
				this.handleDragStart(canvasX, canvasY, dragType);
				break;
			}
		}
	}

	handleDragStart(startCanvasX: number, startCanvasY: number, type: DragType) {
		this.store.startDrag(startCanvasX, startCanvasY, type);
	}

	handleDragMove(currentCanvasX: number, currentCanvasY: number) {
		this.store.updateDrag(currentCanvasX, currentCanvasY);
	}

	handleDragEnd() {
		this.store.endDrag();
	}

	handleScroll(deltaCanvasX: number, deltaCanvasY: number) {
		this.store.moveViewportPosition(deltaCanvasX, deltaCanvasY);
	}

	handleScale(newScale: number, centerCanvasX: number, centerCanvasY: number) {
		this.store.setViewportScale(newScale, centerCanvasX, centerCanvasY);
	}

	handleKeyDown(
		key: string,
		modifiers: { metaKey: boolean; ctrlKey: boolean; shiftKey: boolean },
	): boolean {
		switch (key) {
			case "a": {
				switch (this.store.getState().mode) {
					case "line":
					case "shape":
					case "select": {
						if (modifiers.metaKey || modifiers.ctrlKey) {
							this.store.setMode("select");
							this.store.setSelectedShapeIds([
								...this.store.getState().page.shapes.keys(),
								...this.store.getState().page.lines.keys(),
							]);
							return true;
						}
					}
				}
				break;
			}
			case "r": {
				switch (this.store.getState().mode) {
					case "shape":
					case "select": {
						this.store.setMode("shape");
						return true;
					}
				}
				break;
			}
			case "l": {
				switch (this.store.getState().mode) {
					case "shape":
					case "select": {
						this.store.setMode("line");
						return true;
					}
				}
				break;
			}
			case "z": {
				switch (this.store.getState().mode) {
					case "line":
					case "shape":
					case "select": {
						if (modifiers.metaKey || modifiers.ctrlKey) {
							if (modifiers.shiftKey) {
								this.store.redo();
							} else {
								this.store.undo();
							}
							return true;
						}
					}
				}
				break;
			}
			case "x": {
				switch (this.store.getState().mode) {
					case "select": {
						if (modifiers.metaKey || modifiers.ctrlKey) {
							this.store.cut();
						}
						return true;
					}
				}
				break;
			}
			case "c": {
				switch (this.store.getState().mode) {
					case "select": {
						if (modifiers.metaKey || modifiers.ctrlKey) {
							this.store.copy();
						}
						return true;
					}
				}
				break;
			}
			case "v": {
				switch (this.store.getState().mode) {
					case "select": {
						if (modifiers.metaKey || modifiers.ctrlKey) {
							this.store.paste();
						}
						return true;
					}
				}
				break;
			}
			case "Escape": {
				switch (this.store.getState().mode) {
					case "select": {
						this.store.clearSelection();
						return true;
					}
					default: {
						this.store.setMode("select");
						return true;
					}
				}
			}
			case "Delete":
			case "Backspace": {
				switch (this.store.getState().mode) {
					case "select": {
						this.store.deleteSelectedShapes();
						return true;
					}
				}
				break;
			}
		}

		return false;
	}

	handleModeChange(mode: Mode) {
		this.store.setMode(mode);
	}

	handleLabelChange(shapeId: string, value: string) {
		this.store.setLabel(shapeId, value);
	}

	handleTextAlignButtonClick(alignX: TextAlignment, alignY: TextAlignment) {
		this.store.setTextAlign(alignX, alignY);
	}

	handleColorButtonClick(colorId: ColorId) {
		this.store.setColor(colorId);
	}

	handleFillModeButtonClick(fillMode: FillMode) {
		this.store.setFillMode(fillMode);
	}

	handleBringToFrontButtonClick() {
		this.store.bringToFront();
	}

	handleBringForwardButtonClick() {
		this.store.bringForward();
	}

	handleSendBackwardButtonClick() {
		this.store.sendBackward();
	}

	handleSendToBackButtonClick() {
		this.store.sendToBack();
	}
}
