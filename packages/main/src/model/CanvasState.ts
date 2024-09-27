import { LiveObject, type Room } from "@liveblocks/client";
import { Store } from "../lib/Store";
import { assert } from "../lib/assert";
import { isNotNullish } from "../lib/isNullish";
import { Line } from "./Line";
import { Page } from "./Page";
import { Rect } from "./Rect";
import type { ToolMode } from "./ToolMode";
import type { Viewport } from "./Viewport";

export interface CanvasState {
	page: Page;
	mode: ToolMode;
	viewport: Viewport;
	selectedShapeIds: string[];
	dragType: DragType;
	dragging: boolean;
	dragStartX: number;
	dragStartY: number;
	dragCurrentX: number;
	dragCurrentY: number;
	selectionRect: {
		x: number;
		y: number;
		width: number;
		height: number;
	} | null;
}

export class CanvasStateStore
	extends Store<CanvasState>
	implements CanvasEventHandlers
{
	constructor(
		private readonly room: Room,
		private readonly storage: { root: LiveObject<Liveblocks["Storage"]> },
	) {
		super({
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
			selectionRect: null,
		});
	}

	syncWithLiveBlockStorage() {
		const page = this.storage.root.get("page").toImmutable() as Page;

		const state = { ...this.state, page };
		state.selectedShapeIds = state.selectedShapeIds.filter(
			(id) =>
				page.rects.some((rect) => rect.id === id) ||
				page.lines.some((line) => line.id === id),
		);
		this.setState(state);
	}

	private addRect(rect: Rect) {
		this.storage.root.get("page").get("rects").push(new LiveObject(rect));
		this.syncWithLiveBlockStorage();
	}

	private deleteRect(id: string) {
		const rects = this.storage.root.get("page").get("rects");
		const index = rects.findIndex((rect) => rect.get("id") === id);
		rects.delete(index);
		this.syncWithLiveBlockStorage();
	}

	private addLine(line: Line) {
		this.storage.root.get("page").get("lines").push(new LiveObject(line));
		this.syncWithLiveBlockStorage();
	}

	private moveShapes(
		deltaX: number,
		deltaY: number,
		rects: Rect[],
		lines: Line[],
	) {
		this.room.batch(() => {
			for (const rect of rects) {
				const currentRect = this.storage.root
					.get("page")
					.get("rects")
					.find((r) => r.get("id") === rect.id);
				if (currentRect === undefined) continue;

				currentRect.set("x", rect.x + deltaX);
				currentRect.set("y", rect.y + deltaY);
			}
			for (const line of lines) {
				const currentLine = this.storage.root
					.get("page")
					.get("lines")
					.find((r) => r.get("id") === line.id);
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
		rects: Rect[],
		lines: Line[],
	) {
		this.room.batch(() => {
			for (const rect of rects) {
				const currentRect = this.storage.root
					.get("page")
					.get("rects")
					.find((r) => r.get("id") === rect.id);
				if (currentRect === undefined) continue;

				let x = (rect.x - originX) * scaleX + originX;
				let y = (rect.y - originY) * scaleY + originY;
				let width = rect.width * scaleX;
				let height = rect.height * scaleY;
				if (width < 0) {
					x += width;
					width = -width;
				}
				if (height < 0) {
					y += height;
					height = -height;
				}

				currentRect.set("x", x);
				currentRect.set("y", y);
				currentRect.set("width", width);
				currentRect.set("height", height);
			}
			for (const line of lines) {
				const currentLine = this.storage.root
					.get("page")
					.get("lines")
					.find((r) => r.get("id") === line.id);
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

	private setMode(mode: ToolMode) {
		this.setState({ ...this.state, mode });

		if (mode !== "select") {
			this.clearSelection();
		}
	}

	private moveViewportPosition(deltaCanvasX: number, deltaCanvasY: number) {
		this.setState({
			...this.state,
			viewport: {
				...this.state.viewport,
				x: this.state.viewport.x + deltaCanvasX / this.state.viewport.scale,
				y: this.state.viewport.y + deltaCanvasY / this.state.viewport.scale,
			},
		});
	}

	private setViewportScale(
		newScale: number,
		centerCanvasX: number,
		centerCanvasY: number,
	) {
		this.setState({
			...this.state,
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
		});
	}

	private selectShape(id: string) {
		this.setState({
			...this.state,
			selectedShapeIds: [...this.state.selectedShapeIds, id],
		});
	}

	private unselectShape(id: string) {
		this.setState({
			...this.state,
			selectedShapeIds: this.state.selectedShapeIds.filter((i) => i !== id),
		});
	}

	private clearSelection() {
		this.setSelectedShapeIds([]);
	}

	private toggleShapeSelect(id: string) {
		if (this.state.selectedShapeIds.includes(id)) {
			this.unselectShape(id);
		} else {
			this.selectShape(id);
		}
	}

	private setSelectedShapeIds(ids: string[]) {
		this.setState({
			...this.state,
			selectedShapeIds: ids,
		});
	}

	private deleteSelectedShapes() {
		for (const id of this.state.selectedShapeIds) {
			this.deleteRect(id);
		}
	}

	private undo() {
		this.room.history.undo();
	}

	private redo() {
		this.room.history.redo();
	}

	/// ---------------------------------------------------------------------------
	/// handlers

	handleCanvasMouseDown(
		canvasX: number,
		canvasY: number,
		modifiers: { shiftKey: boolean },
	) {
		switch (this.state.mode) {
			case "select": {
				if (!modifiers.shiftKey) {
					this.clearSelection();
				}
				this.handleDragStart(canvasX, canvasY, {
					type: "select",
					originalSelectedShapeIds: this.state.selectedShapeIds.slice(),
				});
				break;
			}
			case "line":
			case "rect": {
				this.handleDragStart(canvasX, canvasY, { type: "none" });
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
		modifiers: { shiftKey: boolean },
	) {
		if (modifiers.shiftKey) {
			this.toggleShapeSelect(id);
		} else {
			if (this.state.selectedShapeIds.includes(id)) {
				// Do nothing
			} else {
				this.clearSelection();
				this.selectShape(id);
			}
		}
		this.handleDragStart(canvasX, canvasY, {
			type: "move",
			rects: this.state.selectedShapeIds
				.map((id) => this.state.page.rects.find((r) => r.id === id))
				.filter(isNotNullish),
			lines: this.state.selectedShapeIds
				.map((id) => this.state.page.lines.find((r) => r.id === id))
				.filter(isNotNullish),
		});
	}

	handleSelectionHandleMouseDown(
		canvasX: number,
		canvasY: number,
		handle: SelectionRectHandleType,
	) {
		const selectionRect = computeUnionRect(
			this.state.selectedShapeIds
				.map((id) => this.state.page.rects.find((r) => r.id === id))
				.filter(isNotNullish),
			this.state.selectedShapeIds
				.map((id) => this.state.page.lines.find((r) => r.id === id))
				.filter(isNotNullish),
		);
		assert(selectionRect !== null, "Cannot resize without a selection");

		let dragType: DragType;
		switch (handle) {
			case "center": {
				dragType = {
					type: "move",
					rects: this.state.selectedShapeIds
						.map((id) => this.state.page.rects.find((r) => r.id === id))
						.filter(isNotNullish),
					lines: this.state.selectedShapeIds
						.map((id) => this.state.page.lines.find((r) => r.id === id))
						.filter(isNotNullish),
				};
				break;
			}
			case "topLeft":
				dragType = {
					type: "nwse-resize",
					originX: selectionRect.x + selectionRect.width,
					originY: selectionRect.y + selectionRect.height,
					rects: this.state.selectedShapeIds
						.map((id) => this.state.page.rects.find((r) => r.id === id))
						.filter(isNotNullish),
					lines: this.state.selectedShapeIds
						.map((id) => this.state.page.lines.find((r) => r.id === id))
						.filter(isNotNullish),
				};
				break;
			case "top":
				dragType = {
					type: "ns-resize",
					originY: selectionRect.y + selectionRect.height,
					rects: this.state.selectedShapeIds
						.map((id) => this.state.page.rects.find((r) => r.id === id))
						.filter(isNotNullish),
					lines: this.state.selectedShapeIds
						.map((id) => this.state.page.lines.find((r) => r.id === id))
						.filter(isNotNullish),
				};
				break;
			case "topRight":
				dragType = {
					type: "nesw-resize",
					originX: selectionRect.x,
					originY: selectionRect.y + selectionRect.height,
					rects: this.state.selectedShapeIds
						.map((id) => this.state.page.rects.find((r) => r.id === id))
						.filter(isNotNullish),
					lines: this.state.selectedShapeIds
						.map((id) => this.state.page.lines.find((r) => r.id === id))
						.filter(isNotNullish),
				};
				break;
			case "right":
				dragType = {
					type: "ew-resize",
					originX: selectionRect.x,
					rects: this.state.selectedShapeIds
						.map((id) => this.state.page.rects.find((r) => r.id === id))
						.filter(isNotNullish),
					lines: this.state.selectedShapeIds
						.map((id) => this.state.page.lines.find((r) => r.id === id))
						.filter(isNotNullish),
				};
				break;
			case "bottomRight":
				dragType = {
					type: "nwse-resize",
					originX: selectionRect.x,
					originY: selectionRect.y,
					rects: this.state.selectedShapeIds
						.map((id) => this.state.page.rects.find((r) => r.id === id))
						.filter(isNotNullish),
					lines: this.state.selectedShapeIds
						.map((id) => this.state.page.lines.find((r) => r.id === id))
						.filter(isNotNullish),
				};
				break;
			case "bottomLeft":
				dragType = {
					type: "nesw-resize",
					originX: selectionRect.x + selectionRect.width,
					originY: selectionRect.y,
					rects: this.state.selectedShapeIds
						.map((id) => this.state.page.rects.find((r) => r.id === id))
						.filter(isNotNullish),
					lines: this.state.selectedShapeIds
						.map((id) => this.state.page.lines.find((r) => r.id === id))
						.filter(isNotNullish),
				};
				break;
			case "left":
				dragType = {
					type: "ew-resize",
					originX: selectionRect.x + selectionRect.width,
					rects: this.state.selectedShapeIds
						.map((id) => this.state.page.rects.find((r) => r.id === id))
						.filter(isNotNullish),
					lines: this.state.selectedShapeIds
						.map((id) => this.state.page.lines.find((r) => r.id === id))
						.filter(isNotNullish),
				};
				break;
			case "bottom":
				dragType = {
					type: "ns-resize",
					originY: selectionRect.y,
					rects: this.state.selectedShapeIds
						.map((id) => this.state.page.rects.find((r) => r.id === id))
						.filter(isNotNullish),
					lines: this.state.selectedShapeIds
						.map((id) => this.state.page.lines.find((r) => r.id === id))
						.filter(isNotNullish),
				};
				break;
		}

		this.handleDragStart(canvasX, canvasY, dragType);
	}

	handleDragStart(startCanvasX: number, startCanvasY: number, type: DragType) {
		assert(!this.state.dragging, "Cannot start dragging while dragging");

		const [startX, startY] = fromCanvasCoordinate(
			startCanvasX,
			startCanvasY,
			this.state.viewport,
		);

		this.room.history.pause();
		this.setState({
			...this.state,
			dragType: type,
			dragging: true,
			dragStartX: startX,
			dragStartY: startY,
			dragCurrentX: startX,
			dragCurrentY: startY,
		});
	}

	handleDragMove(currentCanvasX: number, currentCanvasY: number) {
		assert(this.state.dragging, "Cannot move drag while not dragging");

		const [currentX, currentY] = fromCanvasCoordinate(
			currentCanvasX,
			currentCanvasY,
			this.state.viewport,
		);

		this.setState({
			...this.state,
			dragCurrentX: currentX,
			dragCurrentY: currentY,
		});

		switch (this.state.mode) {
			case "select": {
				switch (this.state.dragType.type) {
					case "select": {
						const selectionRect = {
							x: Math.min(this.state.dragStartX, currentX),
							y: Math.min(this.state.dragStartY, currentY),
							width: Math.abs(currentX - this.state.dragStartX),
							height: Math.abs(currentY - this.state.dragStartY),
						};
						this.setState({ ...this.state, selectionRect });
						const selectedShapeIds =
							this.state.dragType.originalSelectedShapeIds.slice();
						for (const rect of this.state.page.rects) {
							if (isOverlap(rect, selectionRect)) {
								selectedShapeIds.push(rect.id);
							}
						}
						this.setSelectedShapeIds(selectedShapeIds);
						break;
					}
					case "move": {
						this.moveShapes(
							this.state.dragCurrentX - this.state.dragStartX,
							this.state.dragCurrentY - this.state.dragStartY,
							this.state.dragType.rects,
							this.state.dragType.lines,
						);
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
							this.state.dragType.rects,
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
							this.state.dragType.rects,
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
							this.state.dragType.rects,
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
		this.setState({ ...this.state, dragging: false });

		switch (this.state.mode) {
			case "select": {
				switch (this.state.dragType.type) {
					case "select": {
						this.setState({
							...this.state,
							selectionRect: null,
						});
						break;
					}
				}
				break;
			}
			case "rect": {
				const width = Math.abs(this.state.dragCurrentX - this.state.dragStartX);
				const height = Math.abs(
					this.state.dragCurrentY - this.state.dragStartY,
				);
				const x = Math.min(this.state.dragStartX, this.state.dragCurrentX);
				const y = Math.min(this.state.dragStartY, this.state.dragCurrentY);
				const rect = Rect.create(x, y, width, height);
				this.addRect(rect);
				this.setMode("select");
				break;
			}
			case "line": {
				const line = Line.create(
					this.state.dragStartX,
					this.state.dragStartY,
					this.state.dragCurrentX,
					this.state.dragCurrentY,
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
			case "z": {
				if (modifiers.metaKey || modifiers.ctrlKey) {
					if (modifiers.shiftKey) {
						this.redo();
					} else {
						this.undo();
					}
				}
				return true;
			}
			case "Delete":
			case "Backspace": {
				this.deleteSelectedShapes();
				return true;
			}
		}

		return false;
	}

	handleModeChange(mode: ToolMode) {
		this.setMode(mode);
	}
}

export interface CanvasEventHandlers {
	handleCanvasMouseDown(
		canvasX: number,
		canvasY: number,
		modifiers: { shiftKey: boolean },
	): void;
	handleCanvasMouseMove(canvasX: number, canvasY: number): void;
	handleCanvasMouseUp(): void;
	handleShapeMouseDown(
		id: string,
		canvasX: number,
		canvasY: number,
		modifiers: {
			shiftKey: boolean;
		},
	): void;
	handleSelectionHandleMouseDown(
		canvasX: number,
		canvasY: number,
		handle: SelectionRectHandleType,
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
	handleModeChange(mode: ToolMode): void;
}

export function isOverlap(
	r1: { x: number; y: number; width: number; height: number },
	r2: { x: number; y: number; width: number; height: number },
) {
	return (
		r1.x < r2.x + r2.width &&
		r1.x + r1.width > r2.x &&
		r1.y < r2.y + r2.height &&
		r1.y + r1.height > r2.y
	);
}

export type DragType =
	| { type: "none" }
	| { type: "select"; originalSelectedShapeIds: string[] }
	| {
			type: "move";
			rects: Rect[];
			lines: Line[];
	  }
	| {
			type: "nwse-resize";
			originX: number;
			originY: number;
			rects: Rect[];
			lines: Line[];
	  }
	| {
			type: "nesw-resize";
			originX: number;
			originY: number;
			rects: Rect[];
			lines: Line[];
	  }
	| {
			type: "ns-resize";
			originY: number;
			rects: Rect[];
			lines: Line[];
	  }
	| {
			type: "ew-resize";
			originX: number;
			rects: Rect[];
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

export function computeUnionRect(
	rects: Rect[],
	lines: Line[],
): {
	x: number;
	y: number;
	width: number;
	height: number;
} | null {
	if (rects.length === 0 && lines.length === 0) return null;

	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;

	for (const rect of rects) {
		minX = Math.min(minX, rect.x);
		minY = Math.min(minY, rect.y);
		maxX = Math.max(maxX, rect.x + rect.width);
		maxY = Math.max(maxY, rect.y + rect.height);
	}

	for (const line of lines) {
		minX = Math.min(minX, line.x1, line.x2);
		minY = Math.min(minY, line.y1, line.y2);
		maxX = Math.max(maxX, line.x1, line.x2);
		maxY = Math.max(maxY, line.y1, line.y2);
	}

	return {
		x: minX,
		y: minY,
		width: maxX - minX,
		height: maxY - minY,
	};
}
