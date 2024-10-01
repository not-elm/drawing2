import { type Rect, unionRect } from "../geo/Rect";
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
import { getBoundingRectOfPointObject } from "./obj/PointObject";
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
				case "point":
					return getBoundingRectOfPointObject(obj);
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
}
