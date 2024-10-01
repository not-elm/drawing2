import { type Rect, unionRect } from "../geo/Rect";
import { assert } from "../lib/assert";
import { dataclass } from "../lib/dataclass";
import { isNotNullish } from "../lib/isNullish";
import type { DragType } from "../store/CanvasStateStore";
import type { ColorId } from "./Colors";
import type { FillMode } from "./FillMode";
import type { Mode } from "./Mode";
import type { Page } from "./Page";
import { PropertyPanelState } from "./PropertyPanelState";
import type { TextAlignment } from "./TextAlignment";
import type { Viewport } from "./Viewport";
import { getBoundingRectOfLineObject } from "./obj/LineObject";
import type { Obj } from "./obj/Obj";
import { getBoundingRectOfShapeObject } from "./obj/ShapeObject";

export class CanvasState extends dataclass<{
	readonly page: Page;
	readonly mode: Mode;
	readonly viewport: Viewport;
	readonly selectedObjectIds: string[];
	readonly dragType: DragType;
	readonly dragging: boolean;
	readonly dragStartX: number;
	readonly dragStartY: number;
	readonly dragCurrentX: number;
	readonly dragCurrentY: number;
	readonly defaultColorId: ColorId;
	readonly defaultFillMode: FillMode;
	readonly defaultTextAlignX: TextAlignment;
	readonly defaultTextAlignY: TextAlignment;
}>() {
	setPage(page: Page): CanvasState {
		return this.copy({
			page,
			selectedObjectIds: this.selectedObjectIds.filter((id) =>
				page.objects.has(id),
			),
		});
	}

	select(id: string): CanvasState {
		return this.setSelectedObjectIds([...this.selectedObjectIds, id]);
	}

	selectAll(): CanvasState {
		return this.setSelectedObjectIds(this.page.objectIds);
	}

	unselect(id: string): CanvasState {
		return this.setSelectedObjectIds(
			this.selectedObjectIds.filter((i) => i !== id),
		);
	}

	unselectAll(): CanvasState {
		return this.setSelectedObjectIds([]);
	}

	setSelectedObjectIds(selectedObjectIds: string[]): CanvasState {
		return this.copy({
			selectedObjectIds: selectedObjectIds.filter((id) =>
				this.page.objects.has(id),
			),
		});
	}

	getSelectorRect(): Rect | null {
		if (this.dragType.type !== "select") return null;

		return {
			x: Math.min(this.dragStartX, this.dragCurrentX),
			y: Math.min(this.dragStartY, this.dragCurrentY),
			width: Math.abs(this.dragCurrentX - this.dragStartX),
			height: Math.abs(this.dragCurrentY - this.dragStartY),
		};
	}

	getSelectionRect(): Rect | null {
		const rects = this.getSelectedObjects().map((obj) => {
			switch (obj.type) {
				case "shape":
					return getBoundingRectOfShapeObject(obj);
				case "line":
					return getBoundingRectOfLineObject(obj);
			}
		});
		let rect = rects.shift();
		if (rect === undefined) return null;

		for (const r of rects) {
			rect = unionRect(rect, r);
		}
		return rect;
	}

	getSelectedObjects(): Obj[] {
		return this.selectedObjectIds
			.map((id) => this.page.objects.get(id))
			.filter(isNotNullish);
	}

	getPropertyPanelState(): PropertyPanelState {
		const selectedObjects = this.getSelectedObjects();
		const selectedShapes = selectedObjects.filter(
			(obj) => obj.type === "shape",
		);
		const selectedLines = selectedObjects.filter((obj) => obj.type === "line");

		const alignXs = new Set(selectedShapes.map((shape) => shape.textAlignX));
		const alignYs = new Set(selectedShapes.map((shape) => shape.textAlignY));
		const colorIds = new Set([
			...selectedShapes.map((shape) => shape.colorId),
			...selectedLines.map((shape) => shape.colorId),
		]);
		const fillModes = new Set([
			...selectedShapes.map((shape) => shape.fillMode),
		]);

		return new PropertyPanelState({
			colorSectionVisible: true,
			colorId:
				colorIds.size === 0
					? this.defaultColorId
					: colorIds.size === 1
						? [...colorIds][0]
						: null,
			fillModeSectionVisible:
				selectedShapes.length > 0 || selectedLines.length === 0,
			fillMode:
				fillModes.size === 0
					? this.defaultFillMode
					: fillModes.size === 1
						? [...fillModes][0]
						: null,
			textAlignSectionVisible:
				selectedShapes.length > 0 || selectedLines.length === 0,
			textAlignX:
				alignXs.size === 0
					? this.defaultTextAlignX
					: alignXs.size === 1
						? [...alignXs][0]
						: null,
			textAlignY:
				alignYs.size === 0
					? this.defaultTextAlignY
					: alignYs.size === 1
						? [...alignYs][0]
						: null,
			orderSectionVisible:
				selectedShapes.length > 0 || selectedLines.length > 0,
		});
	}

	isTextEditing(shapeId: string): boolean {
		return this.mode === "text" && this.selectedObjectIds.includes(shapeId);
	}

	validate(): void {
		for (const point of this.page.points.values()) {
			// assert(point.children.size > 0, `Point(${point.id}) have 0 children`);

			for (const childId of point.children) {
				const child = this.page.objects.get(childId);
				assert(
					child !== undefined,
					`Point(${point.id}) has invalid child Id ${childId}`,
				);
				assert(
					child.type === "line",
					`Point(${point.id})'s child ${childId} is not a LineObject`,
				);
			}
		}

		for (const object of this.page.objects.values()) {
			switch (object.type) {
				case "shape": {
					assert(
						this.page.objectIds.indexOf(object.id) >= 0,
						`ShapeObject(${object.id}) is not included in Page.objectIds`,
					);
					break;
				}
				case "line": {
					assert(
						this.page.objectIds.indexOf(object.id) >= 0,
						`LineObject(${object.id}) is not included in Page.objectIds`,
					);

					const p1 = this.page.points.get(object.p1Id);
					assert(p1 !== undefined, `LineObject(${object.id}).p1 is not found`);

					const p2 = this.page.points.get(object.p2Id);
					assert(p2 !== undefined, `LineObject(${object.id}).p2 is not found`);
					break;
				}
			}
		}

		for (const objectId of this.page.objectIds) {
			assert(
				this.page.objects.has(objectId),
				`Page has invalid objectId ${objectId}`,
			);
		}

		for (const objectId of this.selectedObjectIds) {
			assert(
				this.page.objects.has(objectId),
				`SelectedObject ${objectId} doesn't exist`,
			);
		}
	}
}
