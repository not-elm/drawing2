import { assert } from "../lib/assert";
import { Shape } from "../model/Shape";
import { ShapeView } from "./ShapeView";
import { useCanvasState } from "./StoreProvider";

export function ShapeToolPreview() {
	const state = useCanvasState();
	assert(
		state.mode === "shape",
		"ShapeToolPreview should be rendered in rect mode",
	);
	assert(state.dragging, "ShapeToolPreview should be rendered while dragging");

	const width = Math.abs(state.dragCurrentX - state.dragStartX);
	const height = Math.abs(state.dragCurrentY - state.dragStartY);
	const x = Math.min(state.dragStartX, state.dragCurrentX);
	const y = Math.min(state.dragStartY, state.dragCurrentY);

	const rect = Shape.create(
		x,
		y,
		width,
		height,
		"",
		state.defaultTextAlignX,
		state.defaultTextAlignY,
		state.defaultColorId,
	);

	return <ShapeView shape={rect} viewport={state.viewport} />;
}
