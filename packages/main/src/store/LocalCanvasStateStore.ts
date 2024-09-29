import type { ColorId } from "../model/Colors";
import type { FillMode } from "../model/FillMode";
import type { Line } from "../model/Line";
import type { Shape } from "../model/Shape";
import type { TextAlignment } from "../model/TextAlignment";
import { getRestoreViewportService } from "../service/RestoreViewportService";
import {
	CanvasStateStore,
	type LineAccessor,
	type ShapeAccessor,
} from "./CanvasStateStore";

const LOCAL_STORAGE_KEY = "LocalCanvasStateStore.state.page";

interface SerializedPage {
	shapes: Shape[];
	lines: Line[];
	objectIds: string[];
}

class LocalCanvasStateStore extends CanvasStateStore {
	constructor(
		restoreViewportService: ReturnType<typeof getRestoreViewportService>,
	) {
		super(restoreViewportService);

		this.loadFromLocalStorage();
		setInterval(() => {
			this.saveToLocalStorage();
		}, 5000);
	}

	update(predicate: () => void) {
		predicate();
	}

	addShape(shape: Shape) {
		this.update(() => {
			const newShapes = new Map(this.state.page.shapes);
			newShapes.set(shape.id, shape);

			this.setState(
				this.state.copy({
					page: {
						...this.state.page,
						shapes: newShapes,
						objectIds: [...this.state.page.objectIds, shape.id],
					},
				}),
			);
		});
	}

	addLine(line: Line) {
		this.update(() => {
			const newLines = new Map(this.state.page.lines);
			newLines.set(line.id, line);

			this.setState(
				this.state.copy({
					page: {
						...this.state.page,
						lines: newLines,
						objectIds: [...this.state.page.objectIds, line.id],
					},
				}),
			);
		});
	}

	deleteShapes(ids: string[]) {
		const idSet = new Set(ids);
		this.update(() => {
			const newShapes = new Map(this.state.page.shapes);
			const newLines = new Map(this.state.page.lines);
			for (const id of idSet) {
				newShapes.delete(id);
				newLines.delete(id);
			}

			this.setState(
				this.state.copy({
					page: {
						...this.state.page,
						lines: newLines,
						shapes: newShapes,
						objectIds: this.state.page.objectIds.filter((id) => !idSet.has(id)),
					},
				}),
			);
		});
	}

	updateZIndex(currentIndex: number, newIndex: number) {
		this.update(() => {
			const newObjectIds = this.state.page.objectIds.slice();
			const [id] = newObjectIds.splice(currentIndex, 1);
			newObjectIds.splice(newIndex, 0, id);

			this.setState(
				this.state.copy({
					page: {
						...this.state.page,
						objectIds: newObjectIds,
					},
				}),
			);
		});
	}

	resumeHistory() {}

	pauseHistory() {}

	// Command or Pageをスタックで管理
	undo() {}

	redo() {}

	protected updateShapes(
		ids: string[],
		updater: (shape: ShapeAccessor) => void,
	): void {
		this.update(() => {
			const newShapes = new Map(this.state.page.shapes);

			for (const id of ids) {
				const shape = this.state.page.shapes.get(id);
				if (shape !== undefined) {
					const newShape = { ...shape };
					localShapeAccessor.shape = newShape;
					updater(localShapeAccessor);
					newShapes.set(id, newShape);
				}
			}

			this.setState(
				this.state.copy({
					page: {
						...this.state.page,
						shapes: newShapes,
					},
				}),
			);
		});
	}

	protected updateLines(
		ids: string[],
		updater: (line: LineAccessor) => void,
	): void {
		this.update(() => {
			const newLines = new Map(this.state.page.lines);

			for (const id of ids) {
				const line = this.state.page.lines.get(id);
				if (line !== undefined) {
					const newLine = { ...line };
					localLineAccessor.line = newLine;
					updater(localLineAccessor);
					newLines.set(id, newLine);
				}
			}

			this.setState(
				this.state.copy({
					page: {
						...this.state.page,
						lines: newLines,
					},
				}),
			);
		});
	}

	private saveToLocalStorage() {
		const serializedPage: SerializedPage = {
			shapes: Array.from(this.state.page.shapes.values()),
			lines: Array.from(this.state.page.lines.values()),
			objectIds: this.state.page.objectIds,
		};

		localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serializedPage));
	}

	private loadFromLocalStorage() {
		try {
			const data = localStorage.getItem(LOCAL_STORAGE_KEY);
			if (data === null) return;

			const serializedPage: SerializedPage = JSON.parse(data);

			const shapes = new Map<string, Shape>();
			const lines = new Map<string, Line>();
			for (const shape of serializedPage.shapes) {
				shapes.set(shape.id, shape);
			}
			for (const line of serializedPage.lines) {
				lines.set(line.id, line);
			}

			this.setState(
				this.state.copy({
					page: {
						schemaUpdatedAt: 0,
						shapes,
						lines,
						objectIds: serializedPage.objectIds,
					},
					selectedShapeIds: [],
				}),
			);
		} catch {}
	}
}

const localShapeAccessor = new (class implements ShapeAccessor {
	public shape: Shape = null as never;

	getId(): string {
		return this.shape.id;
	}
	getX(): number {
		return this.shape.x;
	}
	setX(x: number): void {
		this.shape.x = x;
	}
	getY(): number {
		return this.shape.y;
	}
	setY(y: number): void {
		this.shape.y = y;
	}
	getWidth(): number {
		return this.shape.width;
	}
	setWidth(width: number): void {
		this.shape.width = width;
	}
	getHeight(): number {
		return this.shape.height;
	}
	setHeight(height: number): void {
		this.shape.height = height;
	}
	getColorId(): ColorId {
		return this.shape.colorId;
	}
	setColorId(colorId: ColorId): void {
		this.shape.colorId = colorId;
	}
	getFillMode(): FillMode {
		return this.shape.fillMode;
	}
	setFillMode(fillMode: FillMode): void {
		this.shape.fillMode = fillMode;
	}
	getTextAlignX(): TextAlignment {
		return this.shape.textAlignX;
	}
	setTextAlignX(textAlignX: TextAlignment): void {
		this.shape.textAlignX = textAlignX;
	}
	getTextAlignY(): TextAlignment {
		return this.shape.textAlignY;
	}
	setTextAlignY(textAlignY: TextAlignment): void {
		this.shape.textAlignY = textAlignY;
	}
	getLabel(): string {
		return this.shape.label;
	}
	setLabel(label: string): void {
		this.shape.label = label;
	}
})();

const localLineAccessor = new (class implements LineAccessor {
	public line: Line = null as never;

	getId(): string {
		return this.line.id;
	}
	getX1(): number {
		return this.line.x1;
	}
	setX1(x1: number): void {
		this.line.x1 = x1;
	}
	getY1(): number {
		return this.line.y1;
	}
	setY1(y1: number): void {
		this.line.y1 = y1;
	}
	getX2(): number {
		return this.line.x2;
	}
	setX2(x2: number): void {
		this.line.x2 = x2;
	}
	getY2(): number {
		return this.line.y2;
	}
	setY2(y2: number): void {
		this.line.y2 = y2;
	}
	getColorId(): ColorId {
		return this.line.colorId;
	}
	setColorId(colorId: ColorId): void {
		this.line.colorId = colorId;
	}
})();

export async function initializeLocalCanvasStateStore(): Promise<CanvasStateStore> {
	return Promise.resolve(
		new LocalCanvasStateStore(getRestoreViewportService()),
	);
}
