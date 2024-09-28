import { useMemo } from "react";
import { isNotNullish } from "../lib/isNullish";
import { computeUnionRect } from "../model/CanvasState";
import { SelectionRect } from "./SelectionRect";
import { useCanvasState } from "./StoreProvider";

export function SelectionView() {
	const state = useCanvasState();

	const selectionRect = useMemo(
		() =>
			computeUnionRect(
				state.selectedShapeIds
					.map((id) => state.page.rects.get(id))
					.filter(isNotNullish),
				state.selectedShapeIds
					.map((id) => state.page.lines.get(id))
					.filter(isNotNullish),
			),
		[state.selectedShapeIds, state.page.rects, state.page.lines],
	);
	if (selectionRect === null) return null;
	const rects = state.selectedShapeIds
		.map((id) => state.page.rects.get(id))
		.filter(isNotNullish);

	return (
		<div
			css={{
				position: "absolute",
				inset: 0,
				pointerEvents: "none",
			}}
		>
			<SelectionRect
				x={selectionRect.x}
				y={selectionRect.y}
				width={selectionRect.width}
				height={selectionRect.height}
				rects={rects}
				viewport={state.viewport}
			/>
		</div>
	);
}
