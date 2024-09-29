import {
	type MouseEventHandler,
	type WheelEventHandler,
	useCallback,
	useEffect,
} from "react";
import { useController } from "./ControllerProvider";
import { LineView } from "./LineView";
import { SelectionRect } from "./SelectionRect";
import { SelectorRect } from "./SelectorRect";
import { ShapeView } from "./ShapeView";
import { useCanvasState } from "./StoreProvider";
import { ToolPreview } from "./ToolPreview";

export function Canvas() {
	const state = useCanvasState();
	const handlers = useController();

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
			handlers.handleCanvasMouseDown(ev.clientX, ev.clientY, ev.button, {
				shiftKey: ev.shiftKey,
			});
		},
		[handlers],
	);

	const scale = state.viewport.scale;

	return (
		<div
			css={{
				position: "fixed",
				inset: 0,
				overflow: "clip",
			}}
			onWheel={handleWheel}
			onMouseDown={handleCanvasMouseDown}
		>
			<div
				css={{
					position: "relative",
					transform: `translate(${-state.viewport.x}px, ${-state.viewport
						.y}px) scale(${scale})`,
					transformOrigin: `${state.viewport.x}px ${state.viewport.y}px`,
				}}
			>
				{state.page.objectIds.map((objectId) => {
					const shape = state.page.shapes.get(objectId);
					if (shape) {
						return (
							<ShapeView
								key={shape.id}
								shape={shape}
								isLabelEditing={state.isTextEditing(shape.id)}
							/>
						);
					}

					const line = state.page.lines.get(objectId);
					if (line) {
						return <LineView key={line.id} line={line} />;
					}

					return null;
				})}
				<ToolPreview />
			</div>

			<SelectorRect />
			<SelectionRect />
		</div>
	);
}
