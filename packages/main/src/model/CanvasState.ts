import { LiveList, LiveObject, createClient } from "@liveblocks/client";
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
	dragHandle: DragHandle | null;
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
			dragHandle: null,
			dragging: false,
			dragStartX: 0,
			dragStartY: 0,
			dragCurrentX: 0,
			dragCurrentY: 0,
		};
	}
}

const client = createClient({
	publicApiKey:
		"pk_dev_C0tQrDQdKR0j4wrQoccD4kiwG7wVf_kCe806sGq6osrUVSWvzljKiiLhCe9yiOZn",
});

const { room, leave } = client.enterRoom("my-room", {
	initialStorage: {
		page: new LiveObject({
			rects: new LiveList([]),
			lines: new LiveList([]),
		}),
	},
});
room.getStorage().then(({ root }) => {
	const unsubscribe = room.subscribe(
		root,
		() => store.syncWithLiveBlockStorage(),
		{ isDeep: true },
	);
});
room.subscribe("storage-status", (status) => {
	switch (status) {
		case "not-loaded":
			// Storage has not been loaded yet
			break;
		case "loading":
			// Storage is currently loading
			break;
		case "synchronizing":
			// Local Storage changes are being synchronized
			break;
		case "synchronized": {
			store.syncWithLiveBlockStorage();
			break;
		}
	}
});

export async function addRect(rect: Rect) {
	const storage = await room.getStorage();
	storage.root.get("page").get("rects").push(new LiveObject(rect));
	store.syncWithLiveBlockStorage();
}

export async function deleteRect(id: string) {
	const storage = await room.getStorage();
	const rects = storage.root.get("page").get("rects");
	const index = rects.findIndex((rect) => rect.get("id") === id);
	rects.delete(index);
	store.syncWithLiveBlockStorage();
}

export async function addLine(line: Line) {
	const storage = await room.getStorage();
	storage.root.get("page").get("lines").push(new LiveObject(line));
	store.syncWithLiveBlockStorage();
}

class CanvasStateStore {
	private state: CanvasState;
	private callbacks: Set<(state: CanvasState) => void> = new Set();

	constructor() {
		this.state = CanvasState.create();
	}

	syncWithLiveBlockStorage() {
		room
			.getStorage()
			.then((storage) =>
				store.setPage(storage.root.get("page").toImmutable() as Page),
			);
	}

	getState() {
		return this.state;
	}

	setState(newState: CanvasState) {
		this.state = newState;
		for (const callback of this.callbacks) {
			callback(newState);
		}
	}

	addListener(callback: (state: CanvasState) => void) {
		this.callbacks.add(callback);
	}

	removeListener(callback: (state: CanvasState) => void) {
		this.callbacks.delete(callback);
	}

	setPage(page: Page) {
		logAction("setPage");
		const state = { ...this.state, page };
		if (page.rects.every((rect) => rect.id !== state.selectedRect?.id)) {
			state.selectedRect = null;
		}
		if (page.lines.every((rect) => rect.id !== state.selectedLine?.id)) {
			state.selectedLine = null;
		}
		this.setState(state);
	}

	setMode(mode: ToolMode) {
		logAction("setMode");
		this.setState({ ...this.state, mode });
	}

	moveViewportPosition(deltaCanvasX: number, deltaCanvasY: number) {
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

	setViewportScale(
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

	selectShape(id: string | null) {
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

	deleteSelectedShape() {
		logAction("deleteSelectedShape");

		if (this.state.selectedRect) {
			deleteRect(this.state.selectedRect.id);
		}
	}

	undo() {
		room.history.undo();
	}

	redo() {
		room.history.redo();
	}

	/// handlers

	handleCanvasMouseDown(canvasX: number, canvasY: number) {
		switch (this.state.mode) {
			case "select": {
				this.selectShape(null);
				break;
			}
			case "line":
			case "rect": {
				this.handleDragStart(canvasX, canvasY, "none");
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
	}

	handleDragEnd() {
		assert(this.state.dragging, "Cannot end drag while not dragging");

		this.setState({ ...this.state, dragging: false });

		switch (this.state.mode) {
			case "rect": {
				const width = Math.abs(this.state.dragCurrentX - this.state.dragStartX);
				const height = Math.abs(
					this.state.dragCurrentY - this.state.dragStartY,
				);
				const x = Math.min(this.state.dragStartX, this.state.dragCurrentX);
				const y = Math.min(this.state.dragStartY, this.state.dragCurrentY);
				const rect = Rect.create(x, y, width, height);
				addRect(rect);
				break;
			}
			case "line": {
				const line = Line.create(
					this.state.dragStartX,
					this.state.dragStartY,
					this.state.dragCurrentX,
					this.state.dragCurrentY,
				);
				addLine(line);
			}
		}
	}
}

export const store = new CanvasStateStore();

export type DragHandle =
	| "none"
	| "center"
	| "nw"
	| "ne"
	| "se"
	| "sw"
	| "n"
	| "e"
	| "s"
	| "w";

export function logAction(name: string, params?: Record<string, unknown>) {
	console.table({ name, ...params });
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
