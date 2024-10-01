import { assert } from "../lib/assert";
import { createLineObject } from "../model/obj/LineObject";
import { LineView } from "./LineView";
import { useCanvasState } from "./StoreProvider";

export function LineToolPreview() {
	const state = useCanvasState();
	assert(
		state.mode === "line",
		"LineToolPreview must be rendered in line mode",
	);
	assert(state.dragging, "LineToolPreview must be rendered while dragging");

	const line = createLineObject(
		state.dragStartX,
		state.dragStartY,
		state.dragCurrentX,
		state.dragCurrentY,
		state.defaultColorId,
	);

	return <LineView line={line} />;
}
