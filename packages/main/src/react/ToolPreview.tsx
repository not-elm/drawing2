import { LineToolPreview } from "./LineToolPreview";
import { RectToolPreview } from "./RectToolPreview";
import { useCanvasState } from "./StoreProvider";

export function ToolPreview() {
	const state = useCanvasState();

	if (!state.dragging) return null;

	switch (state.mode) {
		case "rect":
			return <RectToolPreview />;
		case "line":
			return <LineToolPreview />;
	}
}
