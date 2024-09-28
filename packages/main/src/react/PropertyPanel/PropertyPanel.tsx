import { type MouseEventHandler, useCallback } from "react";
import { Card } from "../Card";
import { useCanvasState } from "../StoreProvider";
import { ColorSection } from "./ColorSection";
import { TextAlignmentSection } from "./TextAlignmentSection";

export function PropertyPanel() {
	const state = useCanvasState().propertyPanelState;
	const handleMouseDown: MouseEventHandler = useCallback((ev) => {
		ev.stopPropagation();
	}, []);

	return (
		<Card onMouseDown={handleMouseDown}>
			{state.colorSectionVisible && <ColorSection />}
			{state.textAlignSectionVisible && <TextAlignmentSection />}
		</Card>
	);
}
