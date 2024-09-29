import {
	LiveList,
	LiveMap,
	LiveObject,
	createClient,
} from "@liveblocks/client";
import type { ColorId } from "../model/Colors";
import type { FillMode } from "../model/FillMode";
import type { Line } from "../model/Line";
import type { Page } from "../model/Page";
import type { Shape } from "../model/Shape";
import type { TextAlignment } from "../model/TextAlignment";
import {
	type RestoreViewportService,
	getRestoreViewportService,
} from "../service/RestoreViewportService";
import {
	CanvasStateStore,
	type LineAccessor,
	type ShapeAccessor,
} from "./CanvasStateStore";

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

	update(predicate: () => void) {
		this.room.batch(() => {
			predicate();
		});
		this.syncWithLiveBlockStorage();
	}

	addShape(shape: Shape) {
		this.update(() => {
			const livePage = this.storage.root.get("page");

			livePage.get("shapes").set(shape.id, new LiveObject(shape));
			livePage.get("objectIds").push(shape.id);
		});
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

	updateZIndex(currentIndex: number, newIndex: number) {
		this.update(() => {
			const liveObjectIds = this.storage.root.get("page").get("objectIds");
			const id = this.state.page.objectIds[currentIndex];
			liveObjectIds.delete(currentIndex);
			liveObjectIds.insert(id, newIndex);
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

	protected updateShapes(
		ids: string[],
		updater: (shape: ShapeAccessor) => void,
	): void {
		this.update(() => {
			for (const id of ids) {
				const liveShape = this.storage.root.get("page").get("shapes").get(id);
				if (liveShape !== undefined) {
					liveBlockShapeAccessor.liveShape = liveShape;
					updater(liveBlockShapeAccessor);
				}
			}
		});
	}

	protected updateLines(
		ids: string[],
		updater: (line: LineAccessor) => void,
	): void {
		this.update(() => {
			for (const id of ids) {
				const liveLine = this.storage.root.get("page").get("lines").get(id);
				if (liveLine !== undefined) {
					liveBlockLineAccessor.liveLine = liveLine;
					updater(liveBlockLineAccessor);
				}
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
}

const liveBlockShapeAccessor = new (class implements ShapeAccessor {
	public liveShape: LiveObject<Shape> = null as never;

	getId(): string {
		return this.liveShape.get("id");
	}
	getX(): number {
		return this.liveShape.get("x");
	}
	setX(x: number): void {
		this.liveShape.set("x", x);
	}
	getY(): number {
		return this.liveShape.get("y");
	}
	setY(y: number): void {
		this.liveShape.set("y", y);
	}
	getWidth(): number {
		return this.liveShape.get("width");
	}
	setWidth(width: number): void {
		this.liveShape.set("width", width);
	}
	getHeight(): number {
		return this.liveShape.get("height");
	}
	setHeight(height: number): void {
		this.liveShape.set("height", height);
	}
	getColorId(): ColorId {
		return this.liveShape.get("colorId");
	}
	setColorId(colorId: ColorId): void {
		this.liveShape.set("colorId", colorId);
	}
	getFillMode(): FillMode {
		return this.liveShape.get("fillMode");
	}
	setFillMode(fillMode: FillMode): void {
		this.liveShape.set("fillMode", fillMode);
	}
	getTextAlignX(): TextAlignment {
		return this.liveShape.get("textAlignX");
	}
	setTextAlignX(textAlignX: TextAlignment): void {
		this.liveShape.set("textAlignX", textAlignX);
	}
	getTextAlignY(): TextAlignment {
		return this.liveShape.get("textAlignY");
	}
	setTextAlignY(textAlignY: TextAlignment): void {
		this.liveShape.set("textAlignY", textAlignY);
	}
	getLabel(): string {
		return this.liveShape.get("label");
	}
	setLabel(label: string): void {
		this.liveShape.set("label", label);
	}
})();

const liveBlockLineAccessor = new (class implements LineAccessor {
	public liveLine: LiveObject<Line> = null as never;

	getId(): string {
		return this.liveLine.get("id");
	}
	getX1(): number {
		return this.liveLine.get("x1");
	}
	setX1(x1: number): void {
		this.liveLine.set("x1", x1);
	}
	getY1(): number {
		return this.liveLine.get("y1");
	}
	setY1(y1: number): void {
		this.liveLine.set("y1", y1);
	}
	getX2(): number {
		return this.liveLine.get("x2");
	}
	setX2(x2: number): void {
		this.liveLine.set("x2", x2);
	}
	getY2(): number {
		return this.liveLine.get("y2");
	}
	setY2(y2: number): void {
		this.liveLine.set("y2", y2);
	}
	getColorId(): ColorId {
		return this.liveLine.get("colorId");
	}
	setColorId(colorId: ColorId): void {
		this.liveLine.set("colorId", colorId);
	}
})();

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
