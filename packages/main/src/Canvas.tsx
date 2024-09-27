import { type WheelEventHandler, useCallback } from "react";
import { type DragState, useDrag } from "./hooks/useDrag";
import { Line } from "./model/Line";
import type { Page } from "./model/Page";
import { Rect } from "./model/Rect";
import type { ToolMode } from "./model/ToolMode";
import type { Viewport } from "./model/Viewport";

export function Canvas({
	toolMode,
	page,
	viewport,
	onAddRect,
	onAddLine,
	onScroll,
	onScale,
}: {
	toolMode: ToolMode;
	page: Page;
	viewport: Viewport;
	onAddRect: (rect: Rect) => void;
	onAddLine: (line: Line) => void;
	onScroll: (deltaX: number, deltaY: number) => void;
	/**
	 * Called when the user scales the canvas.
	 * @param scale
	 * @param centerX The x coordinate of the center of the scale operation in canvas coordinate.
	 * @param centerY The y coordinate of the center of the scale operation in canvas coordinate
	 */
	onScale: (scale: number, centerX: number, centerY: number) => void;
}) {
	const { containerRef, state } = useDrag({
		onDragEnd: (state) => {
			const [startX, startY] = fromCanvasCoordinate(
				state.startX,
				state.startY,
				viewport,
			);
			const [currentX, currentY] = fromCanvasCoordinate(
				state.currentX,
				state.currentY,
				viewport,
			);

			switch (toolMode) {
				case "rect": {
					const width = Math.abs(currentX - startX);
					const height = Math.abs(currentY - startY);
					const x = Math.min(startX, currentX);
					const y = Math.min(startY, currentY);
					onAddRect(Rect.create(x, y, width, height));
					break;
				}
				case "line": {
					onAddLine(Line.create(startX, startY, currentX, currentY));
					break;
				}
			}
		},
	});

	const handleWheel: WheelEventHandler = useCallback(
		(ev) => {
			if (ev.ctrlKey) {
				onScale(viewport.scale - ev.deltaY * 0.001, ev.clientX, ev.clientY);
			} else {
				onScroll(ev.deltaX, ev.deltaY);
			}
		},
		[onScroll, onScale, viewport.scale],
	);

	return (
		<div
			ref={containerRef}
			css={{
				position: "fixed",
				inset: 0,
			}}
			onWheel={handleWheel}
		>
			{page.rects.map((rect) => (
				<RectView key={JSON.stringify(rect)} rect={rect} viewport={viewport} />
			))}
			{page.lines.map((line) => (
				<LineView key={JSON.stringify(line)} line={line} viewport={viewport} />
			))}

			<ToolPreview dragState={state} mode={toolMode} viewport={viewport} />
		</div>
	);
}

function RectView({ rect, viewport }: { rect: Rect; viewport: Viewport }) {
	return (
		<div
			css={{
				position: "absolute",
				left: (rect.x - viewport.x) * viewport.scale,
				top: (rect.y - viewport.y) * viewport.scale,
				width: rect.width * viewport.scale,
				height: rect.height * viewport.scale,
				border: "1px solid #000",
				background: "#f0f0f0",
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

function ToolPreview({
	dragState,
	mode,
	viewport,
}: { dragState: DragState; mode: ToolMode; viewport: Viewport }) {
	if (!dragState.dragging) return null;

	switch (mode) {
		case "rect":
			return <RectToolPreview dragState={dragState} viewport={viewport} />;
		case "line":
			return <LineToolPreview dragState={dragState} viewport={viewport} />;
	}
}

function RectToolPreview({
	dragState,
	viewport,
}: { dragState: DragState; viewport: Viewport }) {
	const [startX, startY] = fromCanvasCoordinate(
		dragState.startX,
		dragState.startY,
		viewport,
	);
	const [currentX, currentY] = fromCanvasCoordinate(
		dragState.currentX,
		dragState.currentY,
		viewport,
	);

	const width = Math.abs(currentX - startX);
	const height = Math.abs(currentY - startY);
	const x = Math.min(startX, currentX);
	const y = Math.min(startY, currentY);

	const rect = Rect.create(x, y, width, height);

	return <RectView rect={rect} viewport={viewport} />;
}

function LineToolPreview({
	dragState,
	viewport,
}: { dragState: DragState; viewport: Viewport }) {
	const [startX, startY] = fromCanvasCoordinate(
		dragState.startX,
		dragState.startY,
		viewport,
	);
	const [currentX, currentY] = fromCanvasCoordinate(
		dragState.currentX,
		dragState.currentY,
		viewport,
	);

	const line = Line.create(startX, startY, currentX, currentY);

	return <LineView line={line} viewport={viewport} />;
}

function fromCanvasCoordinate(
	canvasX: number,
	canvasY: number,
	viewport: Viewport,
): [x: number, y: number] {
	return [
		canvasX / viewport.scale + viewport.x,
		canvasY / viewport.scale + viewport.y,
	];
}

function toCanvasCoordinate(
	x: number,
	y: number,
	viewport: Viewport,
): [canvasX: number, canvasY: number] {
	return [(x - viewport.x) * viewport.scale, (y - viewport.y) * viewport.scale];
}
