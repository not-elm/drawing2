import { useCanvasState } from "./CanvasStateStoreProvider";

export function SelectorRect() {
	const state = useCanvasState();

	const selectorRect = state.getSelectorRect();
	if (selectorRect === null) return null;

	return (
		<div
			css={{
				position: "absolute",
				left: (selectorRect.x - state.viewport.x) * state.viewport.scale,
				top: (selectorRect.y - state.viewport.y) * state.viewport.scale,
				width: selectorRect.width * state.viewport.scale,
				height: selectorRect.height * state.viewport.scale,
				background: "rgba(40, 40 ,40, 0.1)",
				pointerEvents: "none",
			}}
		/>
	);
}
