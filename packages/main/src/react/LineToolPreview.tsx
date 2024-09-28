import { assert } from "../lib/assert";
import { Line } from "../model/Line";
import { LineView } from "./LineView";
import { useCanvasState } from "./StoreProvider";

export function LineToolPreview() {
	const state = useCanvasState();
	assert(
		state.mode === "line",
		"LineToolPreview must be rendered in line mode",
	);
	assert(state.dragging, "LineToolPreview must be rendered while dragging");

	const line = Line.create(
		state.dragStartX,
		state.dragStartY,
		state.dragCurrentX,
		state.dragCurrentY,
	);

	return <LineView line={line} viewport={state.viewport} />;
}
