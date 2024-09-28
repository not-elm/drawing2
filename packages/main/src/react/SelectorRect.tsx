import { useCanvasState } from "./StoreProvider";

export function SelectorRect() {
	const state = useCanvasState();

	if (state.selectorRect === null) return null;

	return (
		<div
			css={{
				position: "absolute",
				left: (state.selectorRect.x - state.viewport.x) * state.viewport.scale,
				top: (state.selectorRect.y - state.viewport.y) * state.viewport.scale,
				width: state.selectorRect.width * state.viewport.scale,
				height: state.selectorRect.height * state.viewport.scale,
				background: "rgba(40, 40 ,40, 0.1)",
				pointerEvents: "none",
			}}
		/>
	);
}
