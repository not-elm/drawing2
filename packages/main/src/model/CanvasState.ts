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
	selectedRect: Rect | null;
	selectedLine: Line | null;
	dragType: DragType;
	dragging: boolean;
	dragStartX: number;
	dragStartY: number;
	dragCurrentX: number;
	dragCurrentY: number;
}

export namespace CanvasState {
	export function create(): CanvasState {
		return {
			page: Page.create(),
			mode: "select",
			viewport: {
				x: 0,
				y: 0,
				scale: 1,
			},
			selectedRect: null,
			selectedLine: null,
			dragType: { type: "none" },
			dragging: false,
			dragStartX: 0,
			dragStartY: 0,
			dragCurrentX: 0,
			dragCurrentY: 0,
		};
	}
}

export class CanvasStateStore
	extends Store<CanvasState>
	implements CanvasEventHandlers
{
	constructor(
		private readonly room: Room,
		private readonly storage: { root: LiveObject<Liveblocks["Storage"]> },
	) {
		super(CanvasState.create());
	}

	syncWithLiveBlockStorage() {
		const page = this.storage.root.get("page").toImmutable() as Page;

		const state = { ...this.state, page };
		state.selectedRect =
			page.rects.find((rect) => rect.id === state.selectedRect?.id) ?? null;
		state.selectedLine =
			page.lines.find((line) => line.id === state.selectedLine?.id) ?? null;
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

	private setPosition(x: number, y: number) {
		if (this.state.selectedRect) {
			const rects = this.storage.root.get("page").get("rects");
			const rect = rects.find(
				(rect) => rect.get("id") === this.state.selectedRect?.id,
			);
			if (rect === undefined) return;

			rect.set("x", x);
			rect.set("y", y);
			this.syncWithLiveBlockStorage();
		}
	}

	private scaleShapes(
		scaleX: number,
		scaleY: number,
		originX: number,
		originY: number,
		rects: Rect[],
		lines: Line[],
	) {
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
	}

	private setMode(mode: ToolMode) {
		logAction("setMode");
		this.setState({ ...this.state, mode });

		if (mode !== "select") {
			this.selectShape(null);
		}
	}

	private moveViewportPosition(deltaCanvasX: number, deltaCanvasY: number) {
		logAction("moveViewportPosition");

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
		logAction("setViewportScale");

		this.setState({
			...this.state,
			viewport: {
				x:
					this.state.viewport.x / this.state.viewport.scale -
					centerCanvasX / newScale +
					this.state.viewport.x,
				y:
					this.state.viewport.y / this.state.viewport.scale -
					centerCanvasY / newScale +
					this.state.viewport.y,
				scale: newScale,
			},
		});
	}

	private selectShape(id: string | null) {
		logAction("selectShape");

		const selectedRect =
			this.state.page.rects.find((rect) => rect.id === id) ?? null;
		const selectedLine =
			this.state.page.lines.find((line) => line.id === id) ?? null;
		this.setState({
			...this.state,
			selectedRect,
			selectedLine,
		});
	}

	private deleteSelectedShape() {
		logAction("deleteSelectedShape");

		if (this.state.selectedRect) {
			this.deleteRect(this.state.selectedRect.id);
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

	handleCanvasMouseDown(canvasX: number, canvasY: number) {
		switch (this.state.mode) {
			case "select": {
				this.selectShape(null);
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

	handleRectMouseDown(rect: Rect, canvasX: number, canvasY: number) {
		this.selectShape(rect.id);
		this.handleDragStart(canvasX, canvasY, {
			type: "move",
			startX: rect.x,
			startY: rect.y,
		});
	}

	handleRectResizeHandleMouseDown(
		rect: Rect,
		canvasX: number,
		canvasY: number,
		handle: RectResizeHandle,
	) {
		this.selectShape(rect.id);

		let dragType: DragType;
		switch (handle) {
			case "topLeft":
				dragType = {
					type: "nwse-resize",
					originX: rect.x + rect.width,
					originY: rect.y + rect.height,
					rects: [this.state.selectedRect].filter(isNotNullish),
					lines: [this.state.selectedLine].filter(isNotNullish),
				};
				break;
			case "top":
				dragType = {
					type: "ns-resize",
					originY: rect.y + rect.height,
					rects: [this.state.selectedRect].filter(isNotNullish),
					lines: [this.state.selectedLine].filter(isNotNullish),
				};
				break;
			case "topRight":
				dragType = {
					type: "nesw-resize",
					originX: rect.x,
					originY: rect.y + rect.height,
					rects: [this.state.selectedRect].filter(isNotNullish),
					lines: [this.state.selectedLine].filter(isNotNullish),
				};
				break;
			case "right":
				dragType = {
					type: "ew-resize",
					originX: rect.x,
					rects: [this.state.selectedRect].filter(isNotNullish),
					lines: [this.state.selectedLine].filter(isNotNullish),
				};
				break;
			case "bottomRight":
				dragType = {
					type: "nwse-resize",
					originX: rect.x,
					originY: rect.y,
					rects: [this.state.selectedRect].filter(isNotNullish),
					lines: [this.state.selectedLine].filter(isNotNullish),
				};
				break;
			case "bottomLeft":
				dragType = {
					type: "nesw-resize",
					originX: rect.x + rect.width,
					originY: rect.y,
					rects: [this.state.selectedRect].filter(isNotNullish),
					lines: [this.state.selectedLine].filter(isNotNullish),
				};
				break;
			case "left":
				dragType = {
					type: "ew-resize",
					originX: rect.x + rect.width,
					rects: [this.state.selectedRect].filter(isNotNullish),
					lines: [this.state.selectedLine].filter(isNotNullish),
				};
				break;
			case "bottom":
				dragType = {
					type: "ns-resize",
					originY: rect.y,
					rects: [this.state.selectedRect].filter(isNotNullish),
					lines: [this.state.selectedLine].filter(isNotNullish),
				};
				break;
		}

		this.handleDragStart(canvasX, canvasY, dragType);
	}

	handleDragStart(startCanvasX: number, startCanvasY: number, type: DragType) {
		logAction("startDrag");
		assert(!this.state.dragging, "Cannot start dragging while dragging");

		const [startX, startY] = fromCanvasCoordinate(
			startCanvasX,
			startCanvasY,
			this.state.viewport,
		);

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
					case "move": {
						this.setPosition(
							this.state.dragCurrentX -
								this.state.dragStartX +
								this.state.dragType.startX,
							this.state.dragCurrentY -
								this.state.dragStartY +
								this.state.dragType.startY,
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

		this.setState({ ...this.state, dragging: false });

		switch (this.state.mode) {
			case "select": {
				switch (this.state.dragType.type) {
					case "move": {
						this.setPosition(
							this.state.dragCurrentX -
								this.state.dragStartX +
								this.state.dragType.startX,
							this.state.dragCurrentY -
								this.state.dragStartY +
								this.state.dragType.startY,
						);
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
				this.deleteSelectedShape();
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
	handleCanvasMouseDown(canvasX: number, canvasY: number): void;
	handleCanvasMouseMove(canvasX: number, canvasY: number): void;
	handleCanvasMouseUp(): void;
	handleRectMouseDown(rect: Rect, canvasX: number, canvasY: number): void;
	handleRectResizeHandleMouseDown(
		rect: Rect,
		canvasX: number,
		canvasY: number,
		handle:
			| "topLeft"
			| "top"
			| "topRight"
			| "right"
			| "bottomRight"
			| "bottom"
			| "bottomLeft"
			| "left",
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

export type DragType =
	| { type: "none" }
	| { type: "move"; startX: number; startY: number }
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

export type RectResizeHandle =
	| "topLeft"
	| "top"
	| "topRight"
	| "right"
	| "bottomRight"
	| "bottom"
	| "bottomLeft"
	| "left";

export function logAction(name: string, params?: Record<string, unknown>) {
	// console.table({ name, ...params });
}

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
