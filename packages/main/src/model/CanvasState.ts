import { dataclass } from "../lib/dataclass";
import { isNotNullish } from "../lib/isNullish";
import { type DragType, computeUnionRect } from "./CanvasStateStore";
import type { Line } from "./Line";
import type { Mode } from "./Mode";
import type { Page } from "./Page";
import { PropertyPanelState } from "./PropertyPanelState";
import type { Rect } from "./Rect";
import type { Shape } from "./Shape";
import type { TextAlignment } from "./TextAlignment";
import type { Viewport } from "./Viewport";

export class CanvasState extends dataclass<{
	readonly page: Page;
	readonly mode: Mode;
	readonly viewport: Viewport;
	readonly selectedShapeIds: string[];
	readonly dragType: DragType;
	readonly dragging: boolean;
	readonly dragStartX: number;
	readonly dragStartY: number;
	readonly dragCurrentX: number;
	readonly dragCurrentY: number;
	readonly defaultColorId: number;
	readonly defaultTextAlignX: TextAlignment;
	readonly defaultTextAlignY: TextAlignment;
}>() {
	get selectorRect(): Rect | null {
		if (this.dragType.type !== "select") return null;

		return {
			x: Math.min(this.dragStartX, this.dragCurrentX),
			y: Math.min(this.dragStartY, this.dragCurrentY),
			width: Math.abs(this.dragCurrentX - this.dragStartX),
			height: Math.abs(this.dragCurrentY - this.dragStartY),
		};
	}

	get selectionRect(): Rect | null {
		const shapes = this.selectedShapeIds
			.map((id) => this.page.shapes.get(id))
			.filter(isNotNullish);
		const lines = this.selectedShapeIds
			.map((id) => this.page.lines.get(id))
			.filter(isNotNullish);

		return computeUnionRect(shapes, lines);
	}

	get selectedShapes(): Shape[] {
		return this.selectedShapeIds
			.map((id) => this.page.shapes.get(id))
			.filter(isNotNullish);
	}

	get selectedLines(): Line[] {
		return this.selectedShapeIds
			.map((id) => this.page.lines.get(id))
			.filter(isNotNullish);
	}

	get propertyPanelState(): PropertyPanelState {
		const selectedShapes = this.selectedShapes;
		const selectedLines = this.selectedLines;

		const alignXs = new Set(selectedShapes.map((shape) => shape.textAlignX));
		const alignYs = new Set(selectedShapes.map((shape) => shape.textAlignY));
		const colorIds = new Set([
			...selectedShapes.map((shape) => shape.colorId),
			...selectedLines.map((shape) => shape.colorId),
		]);

		return new PropertyPanelState({
			colorSectionVisible: true,
			colorId:
				colorIds.size === 0
					? this.defaultColorId
					: colorIds.size === 1
						? [...colorIds][0]
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
		});
	}

	isTextEditing(shapeId: string): boolean {
		return this.mode === "text" && this.selectedShapeIds.includes(shapeId);
	}
}
