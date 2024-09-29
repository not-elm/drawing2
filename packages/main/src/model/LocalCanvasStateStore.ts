import { getRestoreViewportService } from "../service/RestoreViewportService";
import { CanvasStateStore } from "./CanvasStateStore";
import type { ColorId } from "./Colors";
import type { FillMode } from "./FillMode";
import type { Line } from "./Line";
import type { Shape } from "./Shape";
import type { TextAlignment } from "./TextAlignment";

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

	update(predicate: () => void) {
		predicate();
		this.saveToLocalStorage();
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

	moveShapes(deltaX: number, deltaY: number, shapes: Shape[], lines: Line[]) {
		this.update(() => {
			const newShapes = new Map(this.state.page.shapes);
			const newLines = new Map(this.state.page.lines);

			for (const shape of shapes) {
				newShapes.set(shape.id, {
					...shape,
					x: shape.x + deltaX,
					y: shape.y + deltaY,
				});
			}
			for (const line of lines) {
				newLines.set(line.id, {
					...line,
					x1: line.x1 + deltaX,
					y1: line.y1 + deltaY,
					x2: line.x2 + deltaX,
					y2: line.y2 + deltaY,
				});
			}

			this.setState(
				this.state.copy({
					page: {
						...this.state.page,
						lines: newLines,
						shapes: newShapes,
					},
				}),
			);
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
			const newShapes = new Map(this.state.page.shapes);
			const newLines = new Map(this.state.page.lines);

			for (const shape of shapes) {
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

				newShapes.set(shape.id, { ...shape, x, y, width, height });
			}
			for (const line of lines) {
				const x1 = (line.x1 - originX) * scaleX + originX;
				const y1 = (line.y1 - originY) * scaleY + originY;
				const x2 = (line.x2 - originX) * scaleX + originX;
				const y2 = (line.y2 - originY) * scaleY + originY;

				newLines.set(line.id, { ...line, x1, y1, x2, y2 });
			}

			this.setState(
				this.state.copy({
					page: {
						...this.state.page,
						lines: newLines,
						shapes: newShapes,
					},
				}),
			);
		});
	}

	updateLinePoint(lineId: string, point: 1 | 2, x: number, y: number) {
		this.update(() => {
			const newLines = new Map(this.state.page.lines);
			const line = newLines.get(lineId);
			if (line === undefined) return;

			if (point === 1) {
				newLines.set(line.id, { ...line, x1: x, y1: y });
			} else {
				newLines.set(line.id, { ...line, x2: x, y2: y });
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

	setLabel(shapeId: string, value: string) {
		this.update(() => {
			const newShapes = new Map(this.state.page.shapes);
			const shape = newShapes.get(shapeId);
			if (shape === undefined) return;

			newShapes.set(shape.id, { ...shape, label: value });

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

	setTextAlign(alignX: TextAlignment, alignY: TextAlignment) {
		this.update(() => {
			const newShapes = new Map(this.state.page.shapes);
			for (const id of this.state.selectedShapeIds) {
				const shape = newShapes.get(id);
				if (shape === undefined) return;

				newShapes.set(shape.id, {
					...shape,
					textAlignX: alignX,
					textAlignY: alignY,
				});
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
		this.setState(
			this.state.copy({ defaultTextAlignX: alignX, defaultTextAlignY: alignY }),
		);
	}

	setColor(colorId: ColorId) {
		this.update(() => {
			const newShapes = new Map(this.state.page.shapes);
			const newLines = new Map(this.state.page.lines);
			for (const id of this.state.selectedShapeIds) {
				const shape = newShapes.get(id);
				if (shape !== undefined) {
					newShapes.set(shape.id, { ...shape, colorId });
				}

				const line = newLines.get(id);
				if (line !== undefined) {
					newLines.set(line.id, { ...line, colorId });
				}
			}
			this.setState(
				this.state.copy({
					page: {
						...this.state.page,
						shapes: newShapes,
						lines: newLines,
					},
				}),
			);
		});
		this.setState(this.state.copy({ defaultColorId: colorId }));
	}

	setFillMode(fillMode: FillMode) {
		this.update(() => {
			const newShapes = new Map(this.state.page.shapes);
			for (const id of this.state.selectedShapeIds) {
				const shape = newShapes.get(id);
				if (shape === undefined) return;

				newShapes.set(shape.id, { ...shape, fillMode });
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
		this.setState(this.state.copy({ defaultFillMode: fillMode }));
	}

	bringToFront() {
		const newObjectIds = this.state.page.objectIds.slice();

		this.update(() => {
			const selectedIdSet = new Set(this.state.selectedShapeIds);
			const orderedSelectedIds = [];
			for (let i = this.state.page.objectIds.length - 1; i >= 0; i--) {
				const id = this.state.page.objectIds[i];
				if (selectedIdSet.has(id)) {
					newObjectIds.splice(i);
					orderedSelectedIds.unshift(id);
				}
			}

			while (orderedSelectedIds.length > 0) {
				const id = orderedSelectedIds.shift();
				if (id === undefined) break;
				newObjectIds.push(id);
			}

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

	bringForward() {
		const newObjectIds = this.state.page.objectIds.slice();

		this.update(() => {
			const selectedIdSet = new Set(this.state.selectedShapeIds);

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
				const id = newObjectIds[i];
				if (id === undefined) continue;

				if (selectedIdSet.has(id)) {
					newObjectIds.splice(insertPosition, 0, id);
					newObjectIds.splice(i, 1);
					insertPosition -= 1;
				}
			}

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

	sendBackward() {
		const newObjectIds = this.state.page.objectIds.slice();

		this.update(() => {
			const selectedIdSet = new Set(this.state.selectedShapeIds);

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
			for (let i = insertPosition + 1; i < newObjectIds.length; i++) {
				const id = newObjectIds[i];
				if (id === undefined) continue;

				if (selectedIdSet.has(id)) {
					newObjectIds.splice(i, 1);
					newObjectIds.splice(insertPosition, 0, id);
					insertPosition += 1;
				}
			}

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

	sendToBack() {
		const newObjectIds = this.state.page.objectIds.slice();

		this.update(() => {
			const selectedIdSet = new Set(this.state.selectedShapeIds);
			const orderedSelectedIds = [];
			for (let i = this.state.page.objectIds.length - 1; i >= 0; i--) {
				const id = this.state.page.objectIds[i];
				if (selectedIdSet.has(id)) {
					newObjectIds.splice(i);
					orderedSelectedIds.unshift(id);
				}
			}

			while (orderedSelectedIds.length > 0) {
				const id = orderedSelectedIds.pop();
				if (id === undefined) break;
				newObjectIds.unshift(id);
			}

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

	undo() {}

	redo() {}
}

export async function initializeLocalCanvasStateStore(): Promise<CanvasStateStore> {
	return Promise.resolve(
		new LocalCanvasStateStore(getRestoreViewportService()),
	);
}
