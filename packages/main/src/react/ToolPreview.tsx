import { LineToolPreview } from "./LineToolPreview";
import { ShapeToolPreview } from "./ShapeToolPreview";
import { useCanvasState } from "./StoreProvider";

export function ToolPreview() {
	const state = useCanvasState();

	if (!state.dragging) return null;

	switch (state.mode) {
		case "shape":
			return <ShapeToolPreview />;
		case "line":
			return <LineToolPreview />;
	}
}