import {
	type MouseEventHandler,
	type WheelEventHandler,
	useCallback,
	useEffect,
} from "react";
import { assert } from "../lib/assert";
import { useCanvasState } from "./CanvasStateStoreProvider";
import { useController } from "./ControllerProvider";
import { LineView } from "./LineView";
import { SelectionRect } from "./SelectionRect";
import { SelectorRect } from "./SelectorRect";
import { ShapeView } from "./ShapeView";
import { ToolPreview } from "./ToolPreview";
import { useStore } from "./hooks/useStore";

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
					const object = state.page.objects.get(objectId);
					if (object === undefined) return null;

					if (object.type === "shape") {
						return (
							<ShapeView
								key={object.id}
								shape={object}
								isLabelEditing={state.isTextEditing(object.id)}
							/>
						);
					}

					if (object.type === "line") {
						return <LineView key={object.id} line={object} />;
					}

					return null;
				})}
				<ToolPreview />
			</div>

			<SelectorRect />
			<SelectionRect />
			<PointHighlightLayer />
		</div>
	);
}

function PointHighlightLayer() {
	const state = useCanvasState();
	const controller = useController();
	const { pointIds } = useStore(controller.hoverStateStore);

	if (pointIds.length === 0) return null;

	const highlightPoints = pointIds.map((pointId) => {
		const point = state.page.points.get(pointId);
		assert(point !== undefined, `Point(${pointId}) is not found`);
		return point;
	});

	return (
		<div css={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
			<svg viewBox="0 0 1 1" width={1} height={1} css={{ overflow: "visible" }}>
				{highlightPoints.map((point) => (
					<circle
						key={point.id}
						r={8}
						cx={(point.x - state.viewport.x) * state.viewport.scale}
						cy={(point.y - state.viewport.y) * state.viewport.scale}
						css={{ fill: "var(--color-selection)", opacity: 0.3 }}
					/>
				))}
			</svg>
		</div>
	);
}
