import { useCanvasState } from "./StoreProvider";

export function SelectionRectView() {
	const state = useCanvasState();

	if (state.selectionRect === null) return null;

	return (
		<div
			css={{
				position: "absolute",
				inset: 0,
				pointerEvents: "none",
			}}
		>
			<div
				css={{
					position: "absolute",
					left:
						(state.selectionRect.x - state.viewport.x) * state.viewport.scale,
					top:
						(state.selectionRect.y - state.viewport.y) * state.viewport.scale,
					width: state.selectionRect.width * state.viewport.scale,
					height: state.selectionRect.height * state.viewport.scale,
					// border: "2px dashed #303030",
					// boxSizing: "border-box",
					background: "rgba(40, 40 ,40, 0.1)",
				}}
			/>
		</div>
	);
}
