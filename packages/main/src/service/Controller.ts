import { isRectOverlapWithPoint } from "../geo/Rect";
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
	fromCanvasCoordinate,
} from "../store/CanvasStateStore";
import { HoverStateStore } from "../store/HoverStateStore";
import { PointerStateStore } from "../store/PointerStateStore";
import { ViewportStore } from "../store/ViewportStore";
import { getRestoreViewportService } from "./RestoreViewportService";

export class Controller {
	readonly pointerStore = new PointerStateStore();
	readonly hoverStateStore: HoverStateStore;
	readonly viewportStore = new ViewportStore(getRestoreViewportService());

	constructor(private readonly store: CanvasStateStore) {
		this.hoverStateStore = new HoverStateStore(
			store,
			this.pointerStore,
			this.viewportStore,
		);
		this.store.setHoverStateProvider(this.hoverStateStore);
		this.store.setViewportProvider(this.viewportStore);
	}

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
						const selectionRect = this.store.getState().getSelectionRect();
						const [x, y] = fromCanvasCoordinate(
							canvasX,
							canvasY,
							this.viewportStore.getState(),
						);
						if (
							selectionRect !== null &&
							isRectOverlapWithPoint(selectionRect, { x, y })
						) {
							this.handleDragStart(canvasX, canvasY, {
								type: "move",
								objects: this.store.getState().getSelectedObjects(),
							});
						} else {
							if (!modifiers.shiftKey) {
								this.store.unselectAll();
							}
							this.handleDragStart(canvasX, canvasY, {
								type: "select",
								originalSelectedObjectIds: this.store
									.getState()
									.selectedObjectIds.slice(),
							});
						}
						break;
					}
					case "line": {
						this.handleDragStart(canvasX, canvasY, {
							type: "new-line",
							p1Id: this.hoverStateStore.getState().pointIds[0] ?? null,
						});
						break;
					}
					case "shape": {
						this.handleDragStart(canvasX, canvasY, { type: "none" });
						break;
					}
					case "text": {
						this.store.setMode("select");
						this.store.unselectAll();
						break;
					}
				}
				break;
			}
		}
	}

	handleCanvasMouseMove(canvasX: number, canvasY: number) {
		const viewport = this.viewportStore.getState();
		this.pointerStore.setPosition(
			canvasX / viewport.scale + viewport.x,
			canvasY / viewport.scale + viewport.y,
		);

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
							if (this.store.getState().selectedObjectIds.includes(id)) {
								// Do nothing
							} else {
								this.store.unselectAll();
								this.store.select(id);
							}
						}
						this.handleDragStart(canvasX, canvasY, {
							type: "move",
							objects: this.store.getState().getSelectedObjects(),
						});
						return true;
					}
					case "text": {
						this.store.setMode("select");
						this.handleDragStart(canvasX, canvasY, {
							type: "move",
							objects: this.store.getState().getSelectedObjects(),
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
				this.store.unselectAll();
				this.store.select(id);
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
				const selectionRect = this.store.getState().getSelectionRect();
				assert(selectionRect !== null, "Cannot resize without a selection");

				let dragType: DragType;
				switch (handle) {
					case "center": {
						dragType = {
							type: "move",
							objects: this.store.getState().getSelectedObjects(),
						};
						break;
					}
					case "topLeft":
						dragType = {
							type: "nwse-resize",
							originX: selectionRect.x + selectionRect.width,
							originY: selectionRect.y + selectionRect.height,
							objects: this.store.getState().getSelectedObjects(),
						};
						break;
					case "top":
						dragType = {
							type: "ns-resize",
							originY: selectionRect.y + selectionRect.height,
							objects: this.store.getState().getSelectedObjects(),
						};
						break;
					case "topRight":
						dragType = {
							type: "nesw-resize",
							originX: selectionRect.x,
							originY: selectionRect.y + selectionRect.height,
							objects: this.store.getState().getSelectedObjects(),
						};
						break;
					case "right":
						dragType = {
							type: "ew-resize",
							originX: selectionRect.x,
							objects: this.store.getState().getSelectedObjects(),
						};
						break;
					case "bottomRight":
						dragType = {
							type: "nwse-resize",
							originX: selectionRect.x,
							originY: selectionRect.y,
							objects: this.store.getState().getSelectedObjects(),
						};
						break;
					case "bottomLeft":
						dragType = {
							type: "nesw-resize",
							originX: selectionRect.x + selectionRect.width,
							originY: selectionRect.y,
							objects: this.store.getState().getSelectedObjects(),
						};
						break;
					case "left":
						dragType = {
							type: "ew-resize",
							originX: selectionRect.x + selectionRect.width,
							objects: this.store.getState().getSelectedObjects(),
						};
						break;
					case "bottom":
						dragType = {
							type: "ns-resize",
							originY: selectionRect.y,
							objects: this.store.getState().getSelectedObjects(),
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
				const line = this.store.getState().getSelectedObjects()[0];
				assert(isNotNullish(line), "Cannot edit without selecting a line");
				assert(line.type === "line", "Cannot edit a shape with line handles");

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
		this.viewportStore.movePosition(deltaCanvasX, deltaCanvasY);
	}

	handleScale(newScale: number, centerCanvasX: number, centerCanvasY: number) {
		this.viewportStore.setScale(newScale, centerCanvasX, centerCanvasY);
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
							this.store.selectAll();
							return true;
						}
					}
				}
				break;
			}
			case "r": {
				switch (this.store.getState().mode) {
					case "line":
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
						this.store.unselectAll();
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
						this.store.deleteSelectedObjects();
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

	handleLabelChange(id: string, label: string) {
		this.store.setLabel(id, label);
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
