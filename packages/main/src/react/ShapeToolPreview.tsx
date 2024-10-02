import { getRectanglePath } from "../geo/path";
import { assert } from "../lib/assert";
import { randomId } from "../lib/randomId";
import type { ShapeObject } from "../model/Page";
import { useCanvasState } from "./CanvasStateStoreProvider";
import { ShapeView } from "./ShapeView";

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

	const rect: ShapeObject = {
		type: "shape",
		id: randomId(),
		x,
		y,
		width,
		height,
		label: "",
		textAlignX: state.defaultTextAlignX,
		textAlignY: state.defaultTextAlignY,
		colorId: state.defaultColorId,
		fillMode: state.defaultFillMode,
		path: getRectanglePath(),
	};

	return <ShapeView shape={rect} isLabelEditing={false} />;
}
