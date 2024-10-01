import { assert } from "../lib/assert";
import { createPointObject } from "../model/Page";
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

	const p1 = createPointObject(state.dragStartX, state.dragStartY);
	const p2 = createPointObject(state.dragCurrentX, state.dragCurrentY);

	const [_p1, _p2, line] = createLineObject(p1, p2, state.defaultColorId);

	return <LineView line={line} />;
}
