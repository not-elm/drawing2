import {
	type MouseEventHandler,
	type WheelEventHandler,
	useCallback,
	useEffect,
} from "react";
import { isNullish } from "./lib/isNullish";
import { type CanvasState, toCanvasCoordinate } from "./model/CanvasState";
import { Line } from "./model/Line";
import { Rect } from "./model/Rect";
import type { Viewport } from "./model/Viewport";

export function Canvas({
	state,
	onCanvasMouseDown,
	onCanvasMouseMove,
	onCanvasMouseUp,
	onRectMouseDown,
	onScroll,
	onScale,
}: {
	state: CanvasState;
	onCanvasMouseDown: (canvasX: number, canvasY: number) => void;
	onCanvasMouseMove: (canvasX: number, canvasY: number) => void;
	onCanvasMouseUp: (canvasX: number, canvasY: number) => void;
	onRectMouseDown: (rect: Rect) => void;
	onScroll: (deltaX: number, deltaCanvasY: number) => void;
	/**
	 * Called when the user scales the canvas.
	 * @param scale
	 * @param centerX The x coordinate of the center of the scale operation in canvas coordinate.
	 * @param centerY The y coordinate of the center of the scale operation in canvas coordinate
	 */
	onScale: (
		scale: number,
		centerCanvasX: number,
		centerCanvasY: number,
	) => void;
}) {
	useEffect(() => {
		function handleMouseMove(ev: MouseEvent) {
			onCanvasMouseMove(ev.clientX, ev.clientY);
		}
		function handleMouseUp(ev: MouseEvent) {
			onCanvasMouseUp(ev.clientX, ev.clientY);
		}
		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [onCanvasMouseMove, onCanvasMouseUp]);

	const handleWheel: WheelEventHandler = useCallback(
		(ev) => {
			if (ev.ctrlKey) {
				onScale(
					state.viewport.scale - ev.deltaY * 0.001,
					ev.clientX,
					ev.clientY,
				);
			} else {
				onScroll(ev.deltaX, ev.deltaY);
			}
		},
		[onScroll, onScale, state.viewport.scale],
	);

	const handleCanvasMouseDown: MouseEventHandler = useCallback(
		(ev) => {
			onCanvasMouseDown(ev.clientX, ev.clientY);
		},
		[onCanvasMouseDown],
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
			{state.page.rects.map((rect) => (
				<RectView
					key={JSON.stringify(rect)}
					rect={rect}
					viewport={state.viewport}
					onMouseDown={
						state.mode === "select"
							? (ev) => {
									ev.stopPropagation();
									ev.preventDefault();
									onRectMouseDown(rect);
								}
							: undefined
					}
				/>
			))}
			{state.page.lines.map((line) => (
				<LineView
					key={JSON.stringify(line)}
					line={line}
					viewport={state.viewport}
				/>
			))}

			<ToolPreview state={state} />
			<SelectionView state={state} />
		</div>
	);
}

function RectView({
	rect,
	viewport,
	onMouseDown,
}: { rect: Rect; viewport: Viewport; onMouseDown?: MouseEventHandler }) {
	return (
		<div
			onMouseDown={onMouseDown}
			css={{
				position: "absolute",
				left: (rect.x - viewport.x) * viewport.scale,
				top: (rect.y - viewport.y) * viewport.scale,
				width: rect.width * viewport.scale,
				height: rect.height * viewport.scale,
				border: "1px solid #000",
				background: "#f0f0f0",
				boxSizing: "border-box",
			}}
		/>
	);
}

function LineView({ line, viewport }: { line: Line; viewport: Viewport }) {
	const [canvasX1, canvasY1] = toCanvasCoordinate(line.x1, line.y1, viewport);
	const [canvasX2, canvasY2] = toCanvasCoordinate(line.x2, line.y2, viewport);

	const left = Math.min(canvasX1, canvasX2);
	const top = Math.min(canvasY1, canvasY2);
	const width = Math.abs(canvasX1 - canvasX2);
	const height = Math.abs(canvasY1 - canvasY2);

	return (
		<svg
			viewBox={`0 0 ${width} ${height}`}
			width={width}
			height={height}
			css={{
				position: "absolute",
				left,
				top,
				width,
				height,
			}}
		>
			<title>line</title>
			<line
				x1={canvasX1 - left}
				y1={canvasY1 - top}
				x2={canvasX2 - left}
				y2={canvasY2 - top}
				stroke="#000"
				strokeWidth={1}
			/>
		</svg>
	);
}

function ToolPreview({ state }: { state: CanvasState }) {
	if (!state.dragging) return null;

	switch (state.mode) {
		case "rect":
			return <RectToolPreview state={state} />;
		case "line":
			return <LineToolPreview state={state} />;
	}
}

function RectToolPreview({ state }: { state: CanvasState }) {
	const width = Math.abs(state.dragCurrentX - state.dragStartX);
	const height = Math.abs(state.dragCurrentY - state.dragStartY);
	const x = Math.min(state.dragStartX, state.dragCurrentX);
	const y = Math.min(state.dragStartY, state.dragCurrentY);

	const rect = Rect.create(x, y, width, height);

	return <RectView rect={rect} viewport={state.viewport} />;
}

function LineToolPreview({ state }: { state: CanvasState }) {
	const line = Line.create(
		state.dragStartX,
		state.dragStartY,
		state.dragCurrentX,
		state.dragCurrentY,
	);

	return <LineView line={line} viewport={state.viewport} />;
}

function SelectionView({
	state,
}: {
	state: CanvasState;
}) {
	if (isNullish(state.selectedLine) && isNullish(state.selectedRect))
		return null;

	return (
		<div
			css={{
				position: "absolute",
				inset: 0,
				pointerEvents: "none",
			}}
		>
			{state.selectedRect && (
				<RectSelection rect={state.selectedRect} viewport={state.viewport} />
			)}
		</div>
	);
}

function RectSelection({ rect, viewport }: { rect: Rect; viewport: Viewport }) {
	return (
		<div
			css={{
				position: "absolute",
				left: (rect.x - viewport.x) * viewport.scale,
				top: (rect.y - viewport.y) * viewport.scale,
				width: rect.width * viewport.scale,
				height: rect.height * viewport.scale,
				boxSizing: "border-box",
				border: "3px solid #4d30ef",
				background: "rgba(77,48,239,0.3)",
			}}
		/>
	);
}
