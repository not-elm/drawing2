import {
	type MouseEventHandler,
	type WheelEventHandler,
	useCallback,
	useEffect,
} from "react";
import { LineView } from "./LineView";
import { RectView } from "./RectView";
import { SelectionRect } from "./SelectionRect";
import { SelectorRect } from "./SelectorRect";
import { useCanvasEventHandler, useCanvasState } from "./StoreProvider";
import { ToolPreview } from "./ToolPreview";

export function Canvas() {
	const state = useCanvasState();
	const handlers = useCanvasEventHandler();

	useEffect(() => {
		function handleMouseMove(ev: MouseEvent) {
			handlers.handleCanvasMouseMove(ev.clientX, ev.clientY);
		}
		function handleMouseUp() {
			handlers.handleCanvasMouseUp();
		}
		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [handlers]);

	const handleWheel: WheelEventHandler = useCallback(
		(ev) => {
			if (ev.ctrlKey) {
				handlers.handleScale(
					Math.min(Math.max(0.1, state.viewport.scale - ev.deltaY * 0.0005), 4),
					ev.clientX,
					ev.clientY,
				);
			} else {
				handlers.handleScroll(ev.deltaX, ev.deltaY);
			}
		},
		[handlers, state.viewport.scale],
	);

	const handleCanvasMouseDown: MouseEventHandler = useCallback(
		(ev) => {
			ev.stopPropagation();
			ev.preventDefault();
			handlers.handleCanvasMouseDown(ev.clientX, ev.clientY, {
				shiftKey: ev.shiftKey,
			});
		},
		[handlers],
	);

	return (
		<div
			css={{
				position: "fixed",
				inset: 0,
			}}
			onWheel={handleWheel}
			onMouseDown={handleCanvasMouseDown}
		>
			{[...state.page.rects.values()].map((rect) => (
				<RectView key={rect.id} rect={rect} viewport={state.viewport} />
			))}
			{[...state.page.lines.values()].map((line) => (
				<LineView key={line.id} line={line} viewport={state.viewport} />
			))}

			<ToolPreview />
			<SelectorRect />
			<SelectionRect />
		</div>
	);
}
