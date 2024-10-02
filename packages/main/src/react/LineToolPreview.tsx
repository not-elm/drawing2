import { assert } from "../lib/assert";
import { randomId } from "../lib/randomId";
import type { LineObject } from "../model/Page";
import { useCanvasState } from "./CanvasStateStoreProvider";
import { LineView } from "./LineView";

export function LineToolPreview() {
	const state = useCanvasState();
	assert(
		state.mode === "line",
		"LineToolPreview must be rendered in line mode",
	);
	assert(state.dragging, "LineToolPreview must be rendered while dragging");

	const line: LineObject = {
		type: "line",
		id: randomId(),
		x1: state.dragStartX,
		y1: state.dragStartY,
		x2: state.dragCurrentX,
		y2: state.dragCurrentY,
		colorId: state.defaultColorId,
	};

	return <LineView line={line} />;
}
