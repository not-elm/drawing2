import {
	LiveList,
	LiveMap,
	LiveObject,
	createClient,
} from "@liveblocks/client";
import {
	type RestoreViewportService,
	getRestoreViewportService,
} from "../service/RestoreViewportService";
import { CanvasStateStore } from "./CanvasStateStore";
import type { ColorId } from "./Colors";
import type { FillMode } from "./FillMode";
import type { Line } from "./Line";
import type { Page } from "./Page";
import type { Shape } from "./Shape";
import type { TextAlignment } from "./TextAlignment";

interface RoomLike {
	resumeHistory(): void;
	pauseHistory(): void;
	undo(): void;
	redo(): void;
	batch(callback: () => void): void;
}

class LiveBlockCanvasStateStore extends CanvasStateStore {
	constructor(
		private readonly room: RoomLike,
		private readonly storage: { root: LiveObject<Liveblocks["Storage"]> },
		restoreViewportService: RestoreViewportService,
	) {
		super(restoreViewportService);
		this.checkSchemaVersion();
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

	private checkSchemaVersion() {
		const schemaUpdatedAt =
			this.storage.root.get("page").get("schemaUpdatedAt") ?? 0;

		this.update(() => {
			if (schemaUpdatedAt < +new Date("2024-09-28T14:58:00.000Z")) {
				// Add "schemaUpdatedAt" field and delete old fields
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				this.storage.root.get("page").delete("schemaVersion" as any);
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				this.storage.root.get("page").delete("objectIds" as any);
				this.storage.root.get("page").set("schemaUpdatedAt", 0);
			}
			if (schemaUpdatedAt < +new Date("2024-09-28T16:40:00.000Z")) {
				// Add "objectIds" field
				const objectIds = new LiveList([
					...this.storage.root.get("page").get("shapes").keys(),
					...this.storage.root.get("page").get("lines").keys(),
				]);
				this.storage.root.get("page").set("objectIds", objectIds);
			}

			this.storage.root.get("page").set("schemaUpdatedAt", Date.now());
		});
	}

	addShape(shape: Shape) {
		this.update(() => {
			const livePage = this.storage.root.get("page");

			livePage.get("shapes").set(shape.id, new LiveObject(shape));
			livePage.get("objectIds").push(shape.id);
		});
	}

	update(predicate: () => void) {
		this.room.batch(() => {
			predicate();
		});
		this.syncWithLiveBlockStorage();
	}

	addLine(line: Line) {
		this.update(() => {
			const livePage = this.storage.root.get("page");

			livePage.get("lines").set(line.id, new LiveObject(line));
			livePage.get("objectIds").push(line.id);
		});
	}

	deleteShapes(ids: string[]) {
		const idSet = new Set(ids);
		this.update(() => {
			const shapes = this.storage.root.get("page").get("shapes");
			const lines = this.storage.root.get("page").get("lines");
			for (const id of idSet) {
				shapes.delete(id);
				lines.delete(id);
			}

			const objectIds = this.storage.root.get("page").get("objectIds");
			for (let i = objectIds.length - 1; i >= 0; i--) {
				const id = objectIds.get(i);
				if (id === undefined) continue;

				if (idSet.has(id)) {
					objectIds.delete(i);
				}
			}
		});
	}

	moveShapes(deltaX: number, deltaY: number, shapes: Shape[], lines: Line[]) {
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

	scaleShapes(
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

	updateLinePoint(lineId: string, point: 1 | 2, x: number, y: number) {
		this.update(() => {
			const currentLine = this.storage.root
				.get("page")
				.get("lines")
				.get(lineId);
			if (currentLine === undefined) return;

			if (point === 1) {
				currentLine.set("x1", x);
				currentLine.set("y1", y);
			} else {
				currentLine.set("x2", x);
				currentLine.set("y2", y);
			}
		});
	}

	setLabel(shapeId: string, value: string) {
		this.update(() => {
			const shape = this.storage.root.get("page").get("shapes").get(shapeId);

			if (shape !== undefined) {
				shape.set("label", value);
			}
		});
	}

	setTextAlign(alignX: TextAlignment, alignY: TextAlignment) {
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

	setColor(colorId: ColorId) {
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

	setFillMode(fillMode: FillMode) {
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

	bringToFront() {
		this.update(() => {
			const selectedIdSet = new Set(this.state.selectedShapeIds);
			const liveObjectIds = this.storage.root.get("page").get("objectIds");
			const orderedSelectedIds = [];
			for (let i = this.state.page.objectIds.length - 1; i >= 0; i--) {
				const id = this.state.page.objectIds[i];
				if (selectedIdSet.has(id)) {
					liveObjectIds.delete(i);
					orderedSelectedIds.unshift(id);
				}
			}

			while (orderedSelectedIds.length > 0) {
				const id = orderedSelectedIds.shift();
				if (id === undefined) break;
				liveObjectIds.push(id);
			}
		});
	}

	bringForward() {
		this.update(() => {
			const selectedIdSet = new Set(this.state.selectedShapeIds);
			const liveObjectIds = this.storage.root.get("page").get("objectIds");

			let mostBackwardResult = null;
			for (const selectedId of selectedIdSet) {
				const result = this.findForwardOverlappedObject(
					selectedId,
					selectedIdSet,
				);
				if (result === null) continue;
				if (mostBackwardResult === null) {
					mostBackwardResult = result;
				} else {
					if (result.globalIndex < mostBackwardResult.globalIndex) {
						mostBackwardResult = result;
					}
				}
			}

			if (mostBackwardResult === null) {
				// selected objects are already at the front
				return;
			}

			let insertPosition = mostBackwardResult.globalIndex + 1;
			for (let i = insertPosition - 1; i >= 0; i--) {
				const id = liveObjectIds.get(i);
				if (id === undefined) continue;

				if (selectedIdSet.has(id)) {
					liveObjectIds.insert(id, insertPosition);
					liveObjectIds.delete(i);
					insertPosition -= 1;
				}
			}
		});
	}

	sendBackward() {
		this.update(() => {
			const selectedIdSet = new Set(this.state.selectedShapeIds);
			const liveObjectIds = this.storage.root.get("page").get("objectIds");

			let mostForwardResult = null;
			for (const selectedId of selectedIdSet) {
				const result = this.findBackwardOverlappedObject(
					selectedId,
					selectedIdSet,
				);
				if (result === null) continue;
				if (mostForwardResult === null) {
					mostForwardResult = result;
				} else {
					if (result.globalIndex > mostForwardResult.globalIndex) {
						mostForwardResult = result;
					}
				}
			}

			if (mostForwardResult === null) {
				// Selected objects are already at the back
				return;
			}

			let insertPosition = mostForwardResult.globalIndex;
			for (let i = insertPosition + 1; i < liveObjectIds.length; i++) {
				const id = liveObjectIds.get(i);
				if (id === undefined) continue;

				if (selectedIdSet.has(id)) {
					liveObjectIds.delete(i);
					liveObjectIds.insert(id, insertPosition);
					insertPosition += 1;
				}
			}
		});
	}

	sendToBack() {
		this.update(() => {
			const selectedIdSet = new Set(this.state.selectedShapeIds);
			const liveObjectIds = this.storage.root.get("page").get("objectIds");
			const orderedSelectedIds = [];
			for (let i = this.state.page.objectIds.length - 1; i >= 0; i--) {
				const id = this.state.page.objectIds[i];
				if (selectedIdSet.has(id)) {
					liveObjectIds.delete(i);
					orderedSelectedIds.unshift(id);
				}
			}

			while (orderedSelectedIds.length > 0) {
				const id = orderedSelectedIds.pop();
				if (id === undefined) break;
				liveObjectIds.insert(id, 0);
			}
		});
	}

	resumeHistory() {
		this.room.resumeHistory();
	}

	pauseHistory() {
		this.room.pauseHistory();
	}

	undo() {
		this.room.undo();
	}

	redo() {
		this.room.redo();
	}
}

export async function initializeLiveBlockCanvasStateStore(): Promise<CanvasStateStore> {
	const client = createClient({
		publicApiKey:
			"pk_dev_C0tQrDQdKR0j4wrQoccD4kiwG7wVf_kCe806sGq6osrUVSWvzljKiiLhCe9yiOZn",
	});

	const { room } = client.enterRoom("my-room", {
		initialStorage: {
			page: new LiveObject({
				shapes: new LiveMap<string, LiveObject<Shape>>(),
				lines: new LiveMap<string, LiveObject<Line>>(),
				objectIds: new LiveList<string>([]),
				schemaUpdatedAt: 0,
			}),
		},
	});
	const storage = await room.getStorage();
	const store = new LiveBlockCanvasStateStore(
		{
			resumeHistory() {
				room.history.resume();
			},
			pauseHistory() {
				room.history.pause();
			},
			undo() {
				room.history.undo();
			},
			redo() {
				room.history.redo();
			},
			batch(callback: () => void) {
				room.batch(callback);
			},
		},
		storage,
		getRestoreViewportService(),
	);
	room.subscribe(storage.root, () => store.syncWithLiveBlockStorage(), {
		isDeep: true,
	});
	room.subscribe("storage-status", (status) => {
		if (status === "synchronized") {
			store.syncWithLiveBlockStorage();
		}
	});
	store.syncWithLiveBlockStorage();

	return store;
}
