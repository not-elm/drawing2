import { assert } from "../lib/assert";
import { Rect } from "../model/Rect";
import { RectView } from "./RectView";
import { useCanvasState } from "./StoreProvider";

export function RectToolPreview() {
	const state = useCanvasState();
	assert(
		state.mode === "rect",
		"RectToolPreview should be rendered in rect mode",
	);
	assert(state.dragging, "RectToolPreview should be rendered while dragging");

	const width = Math.abs(state.dragCurrentX - state.dragStartX);
	const height = Math.abs(state.dragCurrentY - state.dragStartY);
	const x = Math.min(state.dragStartX, state.dragCurrentX);
	const y = Math.min(state.dragStartY, state.dragCurrentY);

	const rect = Rect.create(x, y, width, height);

	return <RectView rect={rect} viewport={state.viewport} />;
}
