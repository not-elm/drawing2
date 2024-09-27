import { LiveObject, type Room } from "@liveblocks/client";
import { Store } from "../lib/Store";
import { assert } from "../lib/assert";
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
	dragHandle: DragHandle;
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
			dragHandle: { type: "none" },
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

	private setRectPosition(x: number, y: number) {
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
			type: "center",
			startX: rect.x,
			startY: rect.y,
		});
	}

	handleDragStart(
		startCanvasX: number,
		startCanvasY: number,
		handle: DragHandle,
	) {
		logAction("startDrag");
		assert(!this.state.dragging, "Cannot start dragging while dragging");

		const [startX, startY] = fromCanvasCoordinate(
			startCanvasX,
			startCanvasY,
			this.state.viewport,
		);

		this.setState({
			...this.state,
			dragHandle: handle,
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
				switch (this.state.dragHandle.type) {
					case "center": {
						this.setRectPosition(
							this.state.dragCurrentX -
								this.state.dragStartX +
								this.state.dragHandle.startX,
							this.state.dragCurrentY -
								this.state.dragStartY +
								this.state.dragHandle.startY,
						);
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
				switch (this.state.dragHandle.type) {
					case "center": {
						this.setRectPosition(
							this.state.dragCurrentX -
								this.state.dragStartX +
								this.state.dragHandle.startX,
							this.state.dragCurrentY -
								this.state.dragStartY +
								this.state.dragHandle.startY,
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
	handleDragStart(
		startCanvasX: number,
		startCanvasY: number,
		handle: DragHandle,
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

export type DragHandle =
	| { type: "none" }
	| { type: "center"; startX: number; startY: number }
	| { type: "nw" }
	| { type: "ne" }
	| { type: "se" }
	| { type: "sw" }
	| { type: "n" }
	| { type: "e" }
	| { type: "s" }
	| { type: "w" };

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
